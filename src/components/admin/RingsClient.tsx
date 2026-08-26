"use client";

import React, { useState, useEffect } from "react";
import { addRing, regenerateRingCode, deleteRing } from "@/actions/rings";
import { approveModeratorRequest, rejectModeratorRequest, revokeActiveModeratorSession } from "@/actions/moderator";
import { createClient } from "@/utils/supabase/client";

export default function RingsClient({ tournamentId, initialRings, initialModRequests = [] }: { tournamentId: string, initialRings: any[], initialModRequests?: any[] }) {
  const [rings, setRings] = useState(initialRings);
  const [modRequests, setModRequests] = useState(initialModRequests);
  const [isAdding, setIsAdding] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  useEffect(() => {
    const supabaseClient = createClient();
    const channel = supabaseClient
      .channel(`rings_mod_reqs_${tournamentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'moderator_requests'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const req = payload.new as any;
          setModRequests(prev => [req, ...prev.filter(r => r.id !== req.id)]);
        } else if (payload.eventType === 'UPDATE') {
          const req = payload.new as any;
          setModRequests(prev => prev.map(r => r.id === req.id ? req : r));
        }
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, [tournamentId]);

  useEffect(() => {
    setRings(initialRings);
  }, [initialRings]);

  useEffect(() => {
    setModRequests(initialModRequests);
  }, [initialModRequests]);

  const handleAddRing = async () => {
    setLoadingAction("add");
    try {
      const newRing = await addRing(tournamentId);
      setRings([...rings, newRing]);
      setIsAdding(false);
    } catch (e) {
      console.error(e);
      alert("Failed to add tatami");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRegenerate = async (ringId: string) => {
    setLoadingAction(`${ringId}-regen`);
    try {
      await regenerateRingCode(ringId, tournamentId);
      // Refresh local ring access code
      const { data: ring } = await createClient().from("rings").select("*").eq("id", ringId).single();
      if (ring) {
        setRings(rings.map(r => r.id === ringId ? ring : r));
      }
    } catch (e) {
      console.error(e);
      alert("Failed to regenerate code");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRevokeSession = async (ringId: string) => {
    if (!confirm("Are you sure you want to log out the current moderator from this Tatami?")) return;
    setLoadingAction(`revoke-${ringId}`);
    try {
      await revokeActiveModeratorSession(ringId, tournamentId);
      setModRequests(prev => prev.filter(r => !(r.ring_id === ringId && r.status === "approved")));
    } catch (e) {
      console.error(e);
      alert("Failed to revoke moderator session");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleApprove = async (requestId: string, ringId: string) => {
    setLoadingAction(`approve-${requestId}`);
    try {
      await approveModeratorRequest(requestId, ringId, tournamentId);
      setModRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "approved" } : (r.ring_id === ringId && r.status === "approved" ? { ...r, status: "revoked" } : r)));
    } catch (e) {
      console.error(e);
      alert("Failed to approve request");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (requestId: string) => {
    setLoadingAction(`reject-${requestId}`);
    try {
      await rejectModeratorRequest(requestId, tournamentId);
      setModRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (e) {
      console.error(e);
      alert("Failed to reject request");
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-md text-headline-md text-primary font-bold">Tatami Management</h2>
          <p className="text-body-sm text-on-surface-variant">View and manage tournament tatamis, moderator access codes, and active officials.</p>
        </div>
        <button 
          onClick={handleAddRing}
          disabled={loadingAction === "add"}
          className="px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bold font-body-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">add</span> {loadingAction === "add" ? "Adding..." : "Add Tatami"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
        {rings.map(ring => {
          const ringPendingReqs = modRequests.filter(r => r.ring_id === ring.id && r.status === "pending");
          const activeApprovedReq = modRequests.find(r => r.ring_id === ring.id && r.status === "approved");

          return (
            <div key={ring.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col space-y-5 relative">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-headline-sm text-lg text-primary font-bold">{ring.name.replace(/Ring/i, "Tatami")}</h3>
                    <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[10px] font-label-caps">Tatami {ring.ring_order}</span>
                  </div>

                  {/* Active Moderator Status Badge */}
                  {activeApprovedReq ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/30 rounded-md text-green-700 text-[10px] font-bold">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                      <span>ACTIVE: {activeApprovedReq.moderator_name}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-surface-container text-on-surface-variant opacity-60 rounded text-[10px] font-label-caps">
                      <span>NO MODERATOR</span>
                    </div>
                  )}
                </div>
                
                {/* Access Code Display */}
                <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg flex flex-col items-center">
                  <span className="text-[10px] font-label-caps text-on-surface-variant mb-1">MODERATOR ACCESS CODE</span>
                  <span className="font-data-mono text-3xl font-black text-secondary tracking-widest">{ring.access_code}</span>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex gap-2 pt-2 border-t border-outline-variant/40">
                <button 
                  onClick={() => handleRegenerate(ring.id)}
                  disabled={loadingAction === `${ring.id}-regen`}
                  className="flex-1 py-1.5 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded font-label-caps text-[10px] text-primary transition-colors flex justify-center items-center gap-1.5 disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span> 
                  {loadingAction === `${ring.id}-regen` ? "..." : "REGEN CODE"}
                </button>

                {activeApprovedReq && (
                  <button
                    onClick={() => handleRevokeSession(ring.id)}
                    disabled={loadingAction === `revoke-${ring.id}`}
                    className="flex-1 py-1.5 bg-error/10 hover:bg-error/20 text-error border border-error/30 rounded font-label-caps text-[10px] font-bold transition-colors flex justify-center items-center gap-1.5 disabled:opacity-50"
                    title="Revoke active moderator session on this Tatami"
                  >
                    <span className="material-symbols-outlined text-[14px]">logout</span>
                    {loadingAction === `revoke-${ring.id}` ? "..." : "LOG OUT MOD"}
                  </button>
                )}
              </div>

              {/* Pending Access Requests */}
              {ringPendingReqs.length > 0 && (
                <div className="pt-3 border-t border-amber-300/40">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
                    <div className="flex justify-between items-center text-amber-900 font-label-caps text-[10px] font-bold">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">lock_open</span>
                        PENDING REQUEST ({ringPendingReqs.length})
                      </span>
                    </div>
                    {ringPendingReqs.map(req => (
                      <div key={req.id} className="bg-white p-2.5 rounded border border-amber-300/50 flex items-center justify-between shadow-xs">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-primary">{req.moderator_name}</span>
                          <span className="text-[9px] font-data-mono text-on-surface-variant opacity-70">
                            {req.device_info?.browser || "Device"} • {new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApprove(req.id, ring.id)}
                            disabled={loadingAction === `approve-${req.id}`}
                            className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold disabled:opacity-50"
                          >
                            {loadingAction === `approve-${req.id}` ? "..." : "APPROVE"}
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            disabled={loadingAction === `reject-${req.id}`}
                            className="px-2 py-1 bg-surface-container hover:bg-error/20 text-error rounded text-[10px] font-bold border border-outline-variant disabled:opacity-50"
                          >
                            REJECT
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {rings.length === 0 && (
          <div className="col-span-full p-8 text-center text-on-surface-variant italic border border-dashed border-outline-variant rounded-xl">
            No tatamis configured for this tournament yet.
          </div>
        )}
      </div>
    </div>
  );
}
