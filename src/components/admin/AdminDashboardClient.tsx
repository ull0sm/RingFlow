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
    // Listen to assignment updates, ring changes, and event logs in realtime
    const channel = supabase.channel(`admin_dashboard_${tournament.id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'category_assignments'
      }, async (payload) => {
        if (payload.eventType === 'UPDATE') {
          setAssignments(prev => {
            const idx = prev.findIndex(a => a.id === payload.new.id);
            if (idx > -1) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...payload.new };
              return copy;
            } else {
              return [...prev, payload.new];
            }
          });
        } else if (payload.eventType === 'INSERT') {
          // Fetch joined category data if missing so division name and match count are populated
          const { data: cat } = await supabase
            .from("categories")
            .select("name, expected_matches, athletes_count")
            .eq("id", payload.new.category_id)
            .single();
          setAssignments(prev => [...prev, { ...payload.new, categories: cat }]);
        } else if (payload.eventType === 'DELETE') {
          setAssignments(prev => prev.filter(a => a.id !== payload.old.id));
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'rings',
        filter: `tournament_id=eq.${tournament.id}`
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setRings(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
        } else if (payload.eventType === 'INSERT') {
          setRings(prev => [...prev, payload.new].sort((a, b) => a.ring_order - b.ring_order));
        } else if (payload.eventType === 'DELETE') {
          setRings(prev => prev.filter(r => r.id !== payload.old.id));
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

    // Secondary reconciliation interval (every 6 seconds) to ensure zero desync even under packet loss
    const syncInterval = setInterval(async () => {
      const ringIds = rings.map(r => r.id);
      if (ringIds.length === 0) return;
      
      const { data: latestAssignments } = await supabase
        .from("category_assignments")
        .select("*, categories(name, expected_matches)")
        .in("ring_id", ringIds)
        .order("queue_order", { ascending: true });

      if (latestAssignments && latestAssignments.length > 0) {
        setAssignments(latestAssignments);
      }
    }, 6000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(syncInterval);
    };
  }, [tournament.id, rings, supabase]);

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

  interface RingPaceOverride {
    isPaused: boolean;
    pausedAt: number | null;
    totalPausedMs: number;
    frozenSeconds?: number;
  }

  const [currentTime, setCurrentTime] = useState<number>(() => Date.now());
  const [paceOverrides, setPaceOverrides] = useState<Record<string, RingPaceOverride>>({});

  // Load saved pace overrides from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`ringflow_pace_${tournament.id}`);
      if (saved) {
        setPaceOverrides(JSON.parse(saved));
      }
    } catch (e) {
      console.error("Failed to load pace overrides", e);
    }
  }, [tournament.id]);

  const saveOverrides = (newOverrides: Record<string, RingPaceOverride>) => {
    setPaceOverrides(newOverrides);
    try {
      localStorage.setItem(`ringflow_pace_${tournament.id}`, JSON.stringify(newOverrides));
    } catch (e) {
      console.error("Failed to save pace overrides", e);
    }
  };

  // Toggle individual tatami pause/resume
  const toggleRingPause = (ringId: string, currentActualSeconds: number) => {
    const current = paceOverrides[ringId] || { isPaused: false, pausedAt: null, totalPausedMs: 0 };
    const now = Date.now();
    let updated: RingPaceOverride;

    if (current.isPaused) {
      const additionalPaused = current.pausedAt ? now - current.pausedAt : 0;
      updated = {
        isPaused: false,
        pausedAt: null,
        totalPausedMs: (current.totalPausedMs || 0) + additionalPaused,
        frozenSeconds: undefined,
      };
    } else {
      updated = {
        isPaused: true,
        pausedAt: now,
        totalPausedMs: current.totalPausedMs || 0,
        frozenSeconds: currentActualSeconds,
      };
    }

    const newMap = { ...paceOverrides, [ringId]: updated };
    saveOverrides(newMap);
  };

  // Check if all tatamis are paused
  const areAllPaused = rings.length > 0 && rings.every((r) => paceOverrides[r.id]?.isPaused);

  // Toggle pause/resume for all tatamis at once
  const toggleAllPace = () => {
    const shouldPause = !areAllPaused;
    const now = Date.now();
    const next: Record<string, RingPaceOverride> = { ...paceOverrides };

    rings.forEach((ring) => {
      const ringAssignments = assignments.filter((a) => a.ring_id === ring.id) || [];
      const timing = getRingTiming(ring.id, ringAssignments);
      const curr = next[ring.id] || { isPaused: false, pausedAt: null, totalPausedMs: 0 };

      if (shouldPause) {
        if (!curr.isPaused) {
          next[ring.id] = {
            isPaused: true,
            pausedAt: now,
            totalPausedMs: curr.totalPausedMs || 0,
            frozenSeconds: timing.actualSeconds,
          };
        }
      } else {
        if (curr.isPaused) {
          const addPaused = curr.pausedAt ? now - curr.pausedAt : 0;
          next[ring.id] = {
            isPaused: false,
            pausedAt: null,
            totalPausedMs: (curr.totalPausedMs || 0) + addPaused,
            frozenSeconds: undefined,
          };
        }
      }
    });

    saveOverrides(next);
  };

  // Live timer interval to update elapsed times every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to calculate time took vs expected for each tatami
  const getRingTiming = (ringId: string, ringAssignments: any[]) => {
    const override = paceOverrides[ringId];
    const isManuallyPaused = override?.isPaused || false;

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
      if (isManuallyPaused) {
        actualSeconds = override?.frozenSeconds ?? 0;
        isRunning = false;
      } else if (isAllCompleted && endTime) {
        actualSeconds = Math.max(0, Math.floor((endTime - startTime - (override?.totalPausedMs || 0)) / 1000));
      } else {
        const netElapsedMs = (currentTime - startTime) - (override?.totalPausedMs || 0);
        actualSeconds = Math.max(0, Math.floor(netElapsedMs / 1000));
        isRunning = true;
      }
    } else if (isManuallyPaused && override?.frozenSeconds !== undefined) {
      actualSeconds = override.frozenSeconds;
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
      isStarted: startTime !== null || (override?.frozenSeconds !== undefined && override.frozenSeconds > 0),
      isRunning,
      isManuallyPaused,
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

      <div className="p-margin-desktop space-y-8 pb-24 w-full">
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

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Unified Tatamis Grid Overview */}
          <div className="xl:col-span-3 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  Live Tatami Status & Pace
                </h3>
                {rings.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllPace}
                    title={areAllPaused ? "Resume all tatami timers" : "Pause all tatami timers"}
                    className={`px-3 py-1.5 text-xs font-label-caps font-semibold rounded-md border flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
                      areAllPaused
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100 font-bold"
                        : "border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {areAllPaused ? "play_arrow" : "pause"}
                    </span>
                    <span>{areAllPaused ? "Resume All Tatamis" : "Pause All Tatamis"}</span>
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-label-caps text-on-surface-variant">
                <span className={`w-2 h-2 rounded-full ${areAllPaused ? "bg-amber-500" : "bg-secondary animate-pulse"}`} />
                <span>{areAllPaused ? "Pace Tracking Paused" : "Realtime Pace Tracking"}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
              {rings.map((ring) => {
                const ringAssignments = assignments.filter((a) => a.ring_id === ring.id) || [];
                const activeAssignment =
                  ringAssignments.find((a) => a.status === "running") ||
                  ringAssignments.find((a) => a.status === "paused");
                const nextAssignment = ringAssignments.find((a) => a.status === "pending");
                
                const assignment = activeAssignment || nextAssignment;
                const timing = getRingTiming(ring.id, ringAssignments);
                
                const status = activeAssignment
                  ? activeAssignment.status === "running"
                    ? "Running"
                    : "Paused"
                  : timing.isAllCompleted
                  ? "Completed"
                  : "Empty";

                const categoryName =
                  assignment?.categories?.name ||
                  ringAssignments[0]?.categories?.name ||
                  "No divisions assigned";
                const totalMatchesForRing = assignment?.categories?.expected_matches || 0;
                const currentMatch = assignment?.matches_completed || 0;
                const totalExpectedMatches = ringAssignments.reduce(
                  (acc, a) => acc + (a.categories?.expected_matches || 0),
                  0
                );

                const ringProgressPercent =
                  totalMatchesForRing > 0 ? (currentMatch / totalMatchesForRing) * 100 : 0;

                // Calculate Estimated Finish Time
                let estFinish = "--:--";
                if (status === "Running" && totalMatchesForRing > 0) {
                  const remaining = Math.max(0, totalMatchesForRing - currentMatch);
                  const msRemaining = remaining * 109 * 1000; // 109 seconds per match
                  estFinish = new Date(Date.now() + msRemaining).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                }

                return (
                  <RingCard
                    key={ring.id}
                    name={ring.name.replace(/Ring/i, "Tatami")}
                    status={status as any}
                    categoryName={categoryName}
                    currentMatch={currentMatch}
                    totalMatches={totalMatchesForRing}
                    totalExpectedMatches={totalExpectedMatches}
                    divisionCount={ringAssignments.length}
                    progressPercent={ringProgressPercent}
                    estimatedFinish={estFinish}
                    timing={timing}
                    onTogglePause={() => toggleRingPause(ring.id, timing.actualSeconds)}
                    formatTimeTook={formatTimeTook}
                    formatTimeExpected={formatTimeExpected}
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
