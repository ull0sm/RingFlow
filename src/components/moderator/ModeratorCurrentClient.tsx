"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { adjustMatchCount, finishCategory, setRingStatus } from "@/actions/moderator";

export default function ModeratorCurrentClient({ ringId, initialAssignments, allAthletes }: { ringId: string, initialAssignments: any[], allAthletes: any[] }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`current_${ringId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'category_assignments',
        filter: `ring_id=eq.${ringId}`
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
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ringId, supabase]);

  const activeAssignment = assignments.find(a => a.status === 'running' || a.status === 'paused');

  if (!activeAssignment) {
    return (
      <section className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-outline" style={{fontVariationSettings: '"FILL" 1'}}>event_busy</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm mb-2">No category running</h2>
        <p className="text-on-surface-variant mb-8 max-w-sm">Please initialize the next category from the Queue to begin.</p>
        <button 
          onClick={() => router.push(`/moderator/ring/${ringId}/queue`)}
          className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>queue</span>
          Go to Queue
        </button>
      </section>
    );
  }

  const handleAdjustMatch = async (delta: number) => {
    try {
      await adjustMatchCount(activeAssignment.id, ringId, delta);
    } catch (e) {
      console.error(e);
      alert("Failed to update score");
    }
  };

  const handleTogglePause = async () => {
    setLoading(true);
    try {
      await setRingStatus(activeAssignment.id, ringId, activeAssignment.status === 'running');
    } catch (e) {
      console.error(e);
      alert("Failed to pause/resume ring");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteCategory = async () => {
    if (!confirm("Are you sure you want to complete this category?")) return;
    setLoading(true);
    try {
      await finishCategory(activeAssignment.id, ringId);
      router.push(`/moderator/ring/${ringId}/queue`);
    } catch (e) {
      console.error(e);
      alert("Failed to complete category");
    } finally {
      setLoading(false);
    }
  };

  const totalMatches = activeAssignment.categories?.expected_matches || 0;
  const currentCompleted = activeAssignment.matches_completed;
  const percentage = totalMatches > 0 ? (currentCompleted / totalMatches) * 100 : 0;
  const isPaused = activeAssignment.status === 'paused';

  return (
    <div className="space-y-0">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Ring Controls</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Moderator Dashboard</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm ${isPaused ? 'bg-error-container text-on-error-container border-error/20 border' : 'bg-success/10 text-emerald-700 border border-emerald-500/20'}`}>
          {!isPaused && (
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          )}
          {isPaused && (
            <span className="flex h-2 w-2 relative">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
          )}
          <span className="font-label-caps text-label-caps">{isPaused ? 'PAUSED' : 'LIVE'}</span>
        </div>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding shadow-sm relative overflow-hidden mb-10">
        <div className={`absolute top-0 left-0 w-1 h-full ${isPaused ? 'bg-error' : 'bg-secondary'}`}></div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="font-label-caps text-label-caps text-on-surface-variant block mb-1">CURRENT CATEGORY</span>
            <h2 className="font-headline-sm text-headline-sm text-primary">{activeAssignment.categories?.name}</h2>
          </div>
        </div>

        <div className="space-y-3 mt-6">
          <div className="flex justify-between items-center font-body-sm text-body-sm">
            <span className="font-semibold text-primary">{currentCompleted} / {totalMatches} <span className="font-normal text-on-surface-variant">Completed</span></span>
            <span className="text-secondary font-bold">{percentage.toFixed(0)}% Complete</span>
          </div>
          <div className="w-full bg-surface-container-high h-2.5 rounded-full overflow-hidden">
            <div className={`${isPaused ? 'bg-error/40' : 'bg-secondary'} h-full transition-all duration-500 ease-out`} style={{ width: `${Math.min(100, percentage)}%` }}></div>
          </div>
          <div className="flex justify-between text-on-surface-variant font-label-caps text-label-caps pt-1">
            <span>{Math.max(0, totalMatches - currentCompleted)} REMAINING</span>
          </div>
        </div>
      </div>

      <section className="space-y-4 mb-10">
        <h3 className="font-label-caps text-label-caps text-on-surface-variant px-1">MATCH ADJUSTMENT</h3>
        <div className="grid grid-cols-2 gap-4">
          <button onClick={() => handleAdjustMatch(-1)} disabled={isPaused || loading} className="bg-surface-container-lowest border border-outline-variant h-16 rounded-xl flex items-center justify-center active:scale-95 transition-transform hover:bg-surface-container shadow-sm disabled:opacity-50">
            <span className="font-headline-sm text-headline-sm text-primary">-1</span>
          </button>
          <button onClick={() => handleAdjustMatch(1)} disabled={isPaused || loading} className="bg-surface-container-lowest border border-outline-variant h-16 rounded-xl flex items-center justify-center active:scale-95 transition-transform hover:bg-surface-container shadow-sm disabled:opacity-50">
            <span className="font-headline-sm text-headline-sm text-primary">+1</span>
          </button>
          <button onClick={() => handleAdjustMatch(-5)} disabled={isPaused || loading} className="bg-surface-container-lowest border border-outline-variant h-16 rounded-xl flex items-center justify-center active:scale-95 transition-transform hover:bg-surface-container shadow-sm disabled:opacity-50">
            <span className="font-headline-sm text-headline-sm text-on-surface-variant">-5</span>
          </button>
          <button onClick={() => handleAdjustMatch(5)} disabled={isPaused || loading} className="bg-surface-container-lowest border border-outline-variant h-16 rounded-xl flex items-center justify-center active:scale-95 transition-transform hover:bg-surface-container shadow-sm disabled:opacity-50">
            <span className="font-headline-sm text-headline-sm text-on-surface-variant">+5</span>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 pt-4 mb-10">
        <button 
          disabled={loading}
          onClick={handleTogglePause}
          className={`w-full bg-surface-container-lowest border h-14 rounded-xl font-bold font-body-md flex items-center justify-center gap-2 transition-colors ${
            isPaused ? 'border-emerald-500 text-emerald-700 active:bg-emerald-50' : 'border-amber-500 text-amber-700 active:bg-amber-50'
          }`}
        >
          <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>{isPaused ? 'play_circle' : 'pause_circle'}</span>
          {isPaused ? 'Resume Ring' : 'Pause Ring'}
        </button>
        <button 
          disabled={loading || isPaused}
          onClick={handleCompleteCategory}
          className="w-full bg-primary text-on-primary h-14 rounded-xl font-bold font-body-md flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>check_circle</span>
          Complete Category
        </button>
      </div>

      <div className="mt-8 bg-surface-container-low p-4 rounded-xl border border-outline-variant">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-secondary opacity-50">visibility</span>
          <div>
            <h4 className="font-label-caps text-label-caps text-on-surface-variant opacity-70">CURRENTLY LIVE TO PUBLIC</h4>
            <p className="font-body-sm text-body-sm text-on-surface">
              Ring Status: <span className={`${isPaused ? 'text-error' : 'text-emerald-600'} font-semibold uppercase`}>{isPaused ? 'Paused' : 'Active'} - {activeAssignment.categories?.name}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
