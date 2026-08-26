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

  const completedCategories = assignments.filter(a => a.status === "completed").length;
  const totalCategories = categoryCount || assignments.length || 0;
  const progressPercent = totalMatches > 0 ? (completedMatches / totalMatches) * 100 : 0;

  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());

  // Live timer interval to update elapsed times every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to calculate time took vs expected for each tatami
  const getRingTiming = (ringId: string, ringAssignments: any[]) => {
    const ringLogs = logs.filter((l: any) => l.ring_id === ringId);
    const startLogs = ringLogs.filter((l: any) => l.action === "START_CATEGORY");
    const finishLogs = ringLogs.filter((l: any) => l.action === "FINISH_CATEGORY");

    let startTime: number | null = null;
    if (startLogs.length > 0) {
      startTime = Math.min(...startLogs.map((l: any) => new Date(l.created_at).getTime()));
    } else {
      const activeOrDone = ringAssignments.find(
        (a: any) => a.status === "running" || a.status === "paused" || a.status === "completed"
      );
      if (activeOrDone && activeOrDone.created_at) {
        startTime = new Date(activeOrDone.created_at).getTime();
      }
    }

    const hasAssignments = ringAssignments.length > 0;
    const isAllCompleted = hasAssignments && ringAssignments.every((a: any) => a.status === "completed");

    let endTime: number | null = null;
    if (isAllCompleted && finishLogs.length > 0) {
      endTime = Math.max(...finishLogs.map((l: any) => new Date(l.created_at).getTime()));
    } else if (isAllCompleted && ringAssignments[ringAssignments.length - 1]?.completed_at) {
      endTime = new Date(ringAssignments[ringAssignments.length - 1].completed_at).getTime();
    }

    let actualSeconds = 0;
    let isRunning = false;
    if (startTime) {
      if (isAllCompleted && endTime) {
        actualSeconds = Math.max(0, Math.floor((endTime - startTime) / 1000));
      } else {
        actualSeconds = Math.max(0, Math.floor((currentTime - startTime) / 1000));
        isRunning = true;
      }
    }

    // Sum all expected category durations for this tatami (standard 109s per match)
    let expectedSeconds = 0;
    ringAssignments.forEach((a: any) => {
      const matches = a.categories?.expected_matches || a.categories?.athletes_count || 4;
      expectedSeconds += matches * 109;
    });

    if (expectedSeconds === 0 && hasAssignments) {
      expectedSeconds = 15 * 60;
    }

    const diffSeconds = actualSeconds - expectedSeconds;

    return {
      startTime,
      isStarted: startTime !== null,
      isRunning,
      isAllCompleted,
      actualSeconds,
      expectedSeconds,
      diffSeconds,
    };
  };

  const formatTimeTook = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "00m 00s";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
    }
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  };

  const formatTimeExpected = (totalSeconds: number) => {
    if (totalSeconds <= 0) return "--";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
    }
    return `${minutes}m`;
  };

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
              <span className="font-label-caps text-label-caps text-on-surface-variant">Completed Categories</span>
              <span className="material-symbols-outlined text-secondary">category</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg font-bold">
                {completedCategories} / {totalCategories}
              </span>
              <p className="text-body-sm text-on-surface-variant mt-1">
                {totalCategories > 0 && completedCategories === totalCategories
                  ? "All divisions finished"
                  : `${Math.max(0, totalCategories - completedCategories)} divisions remaining`}
              </p>
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

        {/* Tatami Time Took vs Time Expected Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-label-caps text-label-caps text-on-surface-variant font-bold">
              Tatami Duration & Schedule Pace
            </h3>
            <div className="flex items-center gap-1.5 text-[11px] font-label-caps text-on-surface-variant">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
              <span>Realtime Pace Tracking</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
            {rings.map((ring) => {
              const ringAssignments = assignments.filter((a) => a.ring_id === ring.id) || [];
              const timing = getRingTiming(ring.id, ringAssignments);
              const activeAssign = ringAssignments.find((a) => a.status === "running" || a.status === "paused");
              const currentCatName =
                activeAssign?.categories?.name || ringAssignments[0]?.categories?.name || "No divisions assigned";
              const totalExpectedMatches = ringAssignments.reduce(
                (acc, a) => acc + (a.categories?.expected_matches || 0),
                0
              );

              return (
                <div
                  key={ring.id}
                  className="bg-surface-container-lowest p-card-padding border border-outline-variant rounded-lg flex flex-col justify-between shadow-sm hover:shadow transition-shadow"
                >
                  <div>
                    {/* Header */}
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-headline-sm text-headline-sm font-bold text-primary">
                        {ring.name.replace(/Ring/i, "Tatami")}
                      </span>
                      {timing.isAllCompleted ? (
                        <span className="px-2 py-0.5 rounded font-label-caps text-[10px] uppercase font-bold bg-blue-100 text-blue-800">
                          Completed
                        </span>
                      ) : timing.isRunning ? (
                        <span className="px-2 py-0.5 rounded font-label-caps text-[10px] uppercase font-bold bg-green-100 text-green-800 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse" />
                          Running
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded font-label-caps text-[10px] uppercase font-bold bg-surface-container-highest text-on-surface-variant">
                          Idle
                        </span>
                      )}
                    </div>

                    <p className="text-body-sm text-on-surface-variant truncate mb-5" title={currentCatName}>
                      {currentCatName}
                    </p>

                    {/* Time Elapsed / Expected */}
                    <div className="space-y-1 mb-4">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[11px] font-label-caps text-on-surface-variant uppercase tracking-wider">
                          Time Elapsed / Expected
                        </span>
                        {timing.isStarted && (
                          <span
                            className={`font-label-caps text-[11px] font-bold ${
                              timing.diffSeconds > 60
                                ? "text-amber-700"
                                : timing.diffSeconds < -60
                                ? "text-green-700"
                                : "text-secondary"
                            }`}
                          >
                            {timing.diffSeconds > 60
                              ? `+${Math.ceil(timing.diffSeconds / 60)}m Behind`
                              : timing.diffSeconds < -60
                              ? `${Math.floor(Math.abs(timing.diffSeconds) / 60)}m Ahead`
                              : "On Pace"}
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span
                          className="font-data-mono text-2xl font-bold text-primary"
                          suppressHydrationWarning
                        >
                          {timing.isStarted ? formatTimeTook(timing.actualSeconds) : "-- : --"}
                        </span>
                        <span className="font-data-mono text-sm text-on-surface-variant">
                          / {timing.expectedSeconds > 0 ? formatTimeExpected(timing.expectedSeconds) : "--"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Track & Details */}
                  <div>
                    <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-1000 ease-out ${
                          timing.diffSeconds > 60
                            ? "bg-amber-500"
                            : timing.isAllCompleted
                            ? "bg-blue-600"
                            : "bg-secondary"
                        }`}
                        style={{
                          width: `${
                            timing.expectedSeconds > 0
                              ? Math.min(100, (timing.actualSeconds / timing.expectedSeconds) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-on-surface-variant font-data-mono">
                      <span>
                        {ringAssignments.length} {ringAssignments.length === 1 ? "division" : "divisions"}
                      </span>
                      <span>{totalExpectedMatches} matches total</span>
                    </div>
                  </div>
                </div>
              );
            })}
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
