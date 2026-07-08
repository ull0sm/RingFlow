"use client";

import React, { useState, useEffect } from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import RingCard from "@/components/admin/RingCard";
import LiveActivityFeed from "@/components/admin/LiveActivityFeed";
import ModeratorRequestsWidget from "@/components/admin/ModeratorRequestsWidget";
import { createClient } from "@/utils/supabase/client";

export default function AdminDashboardClient({ 
  tournament, 
  categoryCount, 
  initialRings, 
  initialAssignments, 
  initialModRequests, 
  initialLogs 
}: any) {
  const [rings, setRings] = useState<any[]>(initialRings || []);
  const [assignments, setAssignments] = useState<any[]>(initialAssignments || []);
  const [logs, setLogs] = useState<any[]>(initialLogs || []);
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  
  const supabase = createClient();

  useEffect(() => {
    // Listen to assignment updates (matches_completed, status)
    const channel = supabase.channel(`admin_dashboard_${tournament.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'category_assignments'
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setAssignments(prev => {
            const idx = prev.findIndex(a => a.id === payload.new.id);
            if (idx > -1) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...payload.new };
              return copy;
            }
            return prev;
          });
        } else if (payload.eventType === 'INSERT') {
          // This lacks the joined categories, but for MVP it's okay, usually assignments are done beforehand
          setAssignments(prev => [...prev, payload.new]);
        }
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_log',
        filter: `tournament_id=eq.${tournament.id}`
      }, (payload) => {
        setLogs(prev => [payload.new, ...prev]);
        if (payload.new.action === "EMERGENCY_ALERT" || payload.new.action === "REQUEST_ASSISTANCE") {
          setActiveAlert(payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournament.id, supabase]);

  // Calculate totals
  let totalMatches = 0;
  let completedMatches = 0;

  assignments.forEach(a => {
    // Only count categories that are actually assigned/queued
    if (a.categories?.expected_matches) {
      totalMatches += a.categories.expected_matches;
      completedMatches += (a.matches_completed || 0);
    }
  });

  const progressPercent = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  return (
    <>
      <AdminHeader title="Overview" eventName={tournament.name} />
      
      {activeAlert && (
        <div className="fixed top-6 right-6 z-50 flex items-center justify-center p-4">
          <div className={`${activeAlert.action === 'EMERGENCY_ALERT' ? 'bg-error-container text-on-error-container border-error' : 'bg-amber-100 text-amber-900 border-amber-500'} max-w-sm w-full p-4 rounded-xl shadow-2xl border-2 transform animate-bounce-short flex gap-4`}>
            <span className="material-symbols-outlined text-4xl mt-1" style={{fontVariationSettings: '"FILL" 1'}}>
              {activeAlert.action === 'EMERGENCY_ALERT' ? 'warning' : 'support_agent'}
            </span>
            <div className="flex-1">
              <h2 className="text-headline-sm font-headline-sm font-bold leading-tight">
                {activeAlert.action === 'EMERGENCY_ALERT' ? 'EMERGENCY ASSISTANCE' : 'ASSISTANCE REQUESTED'}
              </h2>
              <span className={`font-label-caps text-[10px] ${activeAlert.action === 'EMERGENCY_ALERT' ? 'text-error' : 'text-amber-700'} font-bold mb-2 block uppercase tracking-wider`}>
                {rings.find(r => r.id === activeAlert.ring_id)?.name || "Unknown Tatami"}
              </span>
              <p className="text-body-sm font-body-sm mb-4 leading-snug">
                {activeAlert.metadata?.message || "Assistance requested"}
              </p>
              <button 
                onClick={() => setActiveAlert(null)}
                className={`w-full ${activeAlert.action === 'EMERGENCY_ALERT' ? 'bg-error text-white' : 'bg-amber-500 text-white'} py-2 rounded font-bold font-label-caps tracking-widest active:scale-95 transition-transform text-xs`}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8">
        {/* Global Tournament Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-surface-container-lowest p-card-padding border border-outline-variant rounded-lg flex flex-col justify-between shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Total Categories</span>
              <span className="material-symbols-outlined text-secondary">category</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg font-bold">{categoryCount || 0}</span>
              <p className="text-body-sm text-on-surface-variant mt-1">Configured for tournament</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest p-card-padding border border-outline-variant rounded-lg flex flex-col justify-between shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Completed Matches</span>
              <span className="material-symbols-outlined text-on-secondary-fixed-variant" style={{fontVariationSettings: '"FILL" 1'}}>check_circle</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg font-bold">{completedMatches} / {totalMatches}</span>
              <p className="text-body-sm text-on-surface-variant mt-1">Live aggregated match count</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest p-card-padding border border-outline-variant rounded-lg shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Overall Progress</span>
              <span className="material-symbols-outlined text-secondary">speed</span>
            </div>
            <div className="mt-6">
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, progressPercent)}%` }}></div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-data-mono text-data-mono text-secondary font-bold">{progressPercent.toFixed(1)}%</span>
                <span className="font-data-mono text-data-mono text-on-surface-variant">{Math.max(0, totalMatches - completedMatches)} Remaining</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Rings Grid Overview */}
          <div className="xl:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Live Tatami Status</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {rings.map((ring) => {
                 const ringAssignments = assignments.filter(a => a.ring_id === ring.id) || [];
                 const activeAssignment = ringAssignments.find(a => a.status === "running" || a.status === "paused");
                 const nextAssignment = ringAssignments.find(a => a.status === "pending");
                 
                 const assignment = activeAssignment || nextAssignment;
                 
                 const status = activeAssignment ? (activeAssignment.status === "running" ? "Running" : "Paused") : "Empty";
                 const categoryName = assignment?.categories?.name || "Pending Next Category";
                 const totalMatchesForRing = assignment?.categories?.expected_matches || 0;
                 const currentMatch = assignment?.matches_completed || 0;
                 const ringProgressPercent = totalMatchesForRing > 0 ? (currentMatch / totalMatchesForRing) * 100 : 0;

                 // Calculate Estimated Finish Time
                 let estFinish = "--:--";
                 if (status === "Running" && totalMatchesForRing > 0) {
                   const remaining = Math.max(0, totalMatchesForRing - currentMatch);
                   const msRemaining = remaining * 109 * 1000; // 109 seconds per match
                   estFinish = new Date(Date.now() + msRemaining).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                 }

                 return (
                   <RingCard 
                     key={ring.id}
                     name={ring.name.replace(/Ring/i, "Tatami")} 
                     status={status as any}
                     categoryName={categoryName}
                     currentMatch={currentMatch}
                     totalMatches={totalMatchesForRing}
                     progressPercent={ringProgressPercent}
                     estimatedFinish={estFinish}
                   />
                 );
              })}
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-8">
            <LiveActivityFeed tournamentId={tournament.id} initialLogs={logs} rings={rings} />
            <ModeratorRequestsWidget tournamentId={tournament.id} initialRequests={initialModRequests} />
          </div>
        </div>
      </div>
    </>
  );
}
