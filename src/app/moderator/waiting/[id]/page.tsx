"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { checkModeratorStatus } from "@/actions/moderator";

export default function WaitingRoom() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState("pending");

  useEffect(() => {
    // 1. Initial check
    checkModeratorStatus(id).then(res => {
      if (res.status === 'approved') {
        handleApproved(res.ringId, res.sessionToken);
      } else if (res.status === 'rejected') {
        setStatus("rejected");
      }
    });

    // 2. Realtime listener
    const channel = supabase.channel(`mod_req_${id}`)
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'moderator_requests',
        filter: `id=eq.${id}`
      }, (payload) => {
        const newStatus = payload.new.status;
        if (newStatus === 'approved') {
          handleApproved(payload.new.ring_id, payload.new.session_token);
        } else if (newStatus === 'rejected') {
          setStatus("rejected");
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, router, supabase]);

  const handleApproved = (ringId: string, token?: string) => {
    // Save token in cookie or local storage so middleware/layout can read it
    if (token) {
      document.cookie = `mod_token=${token}; path=/; max-age=86400; SameSite=Strict`;
    } else {
      // MVP fallback
      document.cookie = `mod_token=${id}; path=/; max-age=86400; SameSite=Strict`;
    }
    
    // Animate a bit then redirect
    setStatus("approved");
    setTimeout(() => {
      router.push(`/moderator/ring/${ringId}/queue`);
    }, 1500);
  };

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md overflow-hidden relative">
      <header className="w-full px-4 py-6 flex items-center z-10 justify-center">
        <div className="flex items-center gap-2">
          <span className="text-headline-sm font-headline-sm font-extrabold text-primary tracking-tighter">Ring Flow</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 relative z-10">
        <div className="w-full max-w-md text-center flex flex-col items-center">
          
          {status === "pending" && (
            <>
              <div className="w-24 h-24 mb-10 relative flex justify-center items-center">
                <div className="absolute inset-0 border-4 border-surface-container-high rounded-full"></div>
                <div className="absolute inset-0 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
                <span className="material-symbols-outlined text-secondary text-3xl" style={{fontVariationSettings: '"FILL" 1'}}>admin_panel_settings</span>
              </div>
              <h1 className="text-display-sm font-headline-lg text-primary mb-4 tracking-tight">Waiting for Admin</h1>
              <p className="text-body-lg text-on-surface-variant max-w-xs mx-auto mb-10">
                Your request to control this tatami has been sent. Please wait for the tournament administrator to approve your access.
              </p>
              <div className="w-full max-w-xs bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-outline">info</span>
                <span className="text-body-sm text-on-surface-variant text-left">Keep this screen open. You will be redirected automatically.</span>
              </div>
            </>
          )}

          {status === "approved" && (
            <>
              <div className="w-24 h-24 mb-10 rounded-full bg-green-100 flex items-center justify-center shadow-lg transform transition-transform scale-110">
                <span className="material-symbols-outlined text-green-700 text-5xl" style={{fontVariationSettings: '"FILL" 1'}}>check_circle</span>
              </div>
              <h1 className="text-display-sm font-headline-lg text-green-800 mb-4 tracking-tight">Access Granted</h1>
              <p className="text-body-lg text-green-700 mb-10">Entering tatami controls...</p>
            </>
          )}

          {status === "rejected" && (
            <>
              <div className="w-24 h-24 mb-10 rounded-full bg-error-container flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-error text-5xl" style={{fontVariationSettings: '"FILL" 1'}}>cancel</span>
              </div>
              <h1 className="text-display-sm font-headline-lg text-error mb-4 tracking-tight">Access Denied</h1>
              <p className="text-body-lg text-on-error-container mb-10">The administrator declined your request.</p>
              <button 
                onClick={() => router.push('/moderator/login')}
                className="bg-error text-white px-6 py-3 rounded-lg font-headline-sm"
              >
                Try Again
              </button>
            </>
          )}
          
        </div>
      </main>
    </div>
  );
}
