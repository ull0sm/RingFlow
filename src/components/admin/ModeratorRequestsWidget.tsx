"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { approveModeratorRequest, rejectModeratorRequest } from "@/actions/moderator";

interface ModRequest {
  id: string;
  ring_id: string;
  status: string;
  created_at: string;
  device_info: any; // JSON
  moderator_name?: string;
  rings?: { name: string };
}

export default function ModeratorRequestsWidget({ tournamentId, initialRequests }: { tournamentId: string, initialRequests: ModRequest[] }) {
  const [requests, setRequests] = useState<ModRequest[]>(initialRequests);
  const supabase = createClient();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    // We cannot easily filter by tournamentId directly on moderator_requests if the column doesn't exist.
    // The policy ensures we only see our own, so we can just listen to all changes the user has access to.
    const channel = supabase
      .channel('public:moderator_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'moderator_requests' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // Need to fetch ring name ideally, but we'll push it and it might be blank temporarily
            setRequests((current) => [payload.new as ModRequest, ...current]);
          } else if (payload.eventType === 'UPDATE') {
            setRequests((current) => current.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const handleApprove = async (id: string, ringId: string) => {
    setLoadingId(id);
    try {
      await approveModeratorRequest(id, ringId, tournamentId);
    } catch (e) {
      alert("Failed to approve request.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoadingId(id);
    try {
      await rejectModeratorRequest(id, tournamentId);
    } catch (e) {
      alert("Failed to reject request.");
    } finally {
      setLoadingId(null);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col h-96">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0 rounded-t-xl">
        <h3 className="font-label-caps text-label-caps text-primary font-bold">Moderator Requests</h3>
        {pendingRequests.length > 0 && (
          <span className="bg-error text-white text-[10px] font-bold px-2 py-0.5 rounded-full">{pendingRequests.length} NEW</span>
        )}
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {pendingRequests.map(req => (
          <div key={req.id} className="p-3 border border-outline-variant rounded-lg bg-surface flex flex-col gap-3 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="w-full">
                <div className="flex justify-between items-start w-full">
                  <span className="font-label-caps text-[10px] text-secondary font-bold block mb-1">
                    {req.rings?.name || "Unknown Ring"}
                  </span>
                  <span className="text-[10px] text-on-surface-variant">{new Date(req.created_at).toLocaleTimeString()}</span>
                </div>
                {req.moderator_name && req.moderator_name !== "Unknown" && (
                  <p className="font-body-sm font-semibold mb-1 text-primary">{req.moderator_name}</p>
                )}
                {req.device_info && typeof req.device_info === 'object' ? (
                  <div className="text-[11px] text-on-surface-variant font-data-mono space-y-0.5 bg-surface-container-lowest p-2 rounded border border-outline-variant mt-1">
                    <p><span className="text-outline">Device:</span> {req.device_info.browser} on {req.device_info.os} ({req.device_info.deviceType})</p>
                    <p><span className="text-outline">Location:</span> {req.device_info.location}</p>
                    <p><span className="text-outline">IP:</span> {req.device_info.ip}</p>
                  </div>
                ) : (
                  <span className="text-xs text-on-surface-variant font-data-mono">No details</span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleApprove(req.id, req.ring_id)}
                disabled={loadingId === req.id}
                className="flex-1 bg-primary text-white text-[10px] font-bold py-1.5 rounded hover:opacity-90 disabled:opacity-50"
              >
                APPROVE
              </button>
              <button 
                onClick={() => handleReject(req.id)}
                disabled={loadingId === req.id}
                className="flex-1 border border-error text-error text-[10px] font-bold py-1.5 rounded hover:bg-error/10 disabled:opacity-50"
              >
                REJECT
              </button>
            </div>
          </div>
        ))}
        {pendingRequests.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-on-surface-variant opacity-60">
            <span className="material-symbols-outlined text-4xl mb-2">shield_person</span>
            <span className="text-body-sm text-center">No pending moderator requests.</span>
          </div>
        )}
      </div>
    </div>
  );
}
