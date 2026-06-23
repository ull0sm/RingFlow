"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { startCategory, reorderCategory } from "@/actions/moderator";

export default function ModeratorQueueClient({ ringId, initialAssignments }: { ringId: string, initialAssignments: any[] }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`queue_${ringId}`)
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
  const pendingAssignments = assignments.filter(a => a.status === 'pending').sort((a, b) => a.queue_order - b.queue_order);

  const handleStartCategory = async (assignmentId: string) => {
    setLoading(true);
    try {
      await startCategory(assignmentId, ringId);
      router.push(`/moderator/ring/${ringId}/current`);
    } catch (e) {
      console.error(e);
      alert("Failed to start category");
    } finally {
      setLoading(false);
    }
  };

  const handleReorder = async (assignmentId: string, direction: "up" | "down") => {
    setLoading(true);
    try {
      await reorderCategory(assignmentId, ringId, direction);
    } catch (e) {
      console.error(e);
      alert("Failed to reorder");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {!activeAssignment && pendingAssignments.length > 0 && (
        <section className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl text-outline" style={{fontVariationSettings: '"FILL" 1'}}>event_busy</span>
          </div>
          <h2 className="font-headline-sm text-headline-sm mb-2">No category running</h2>
          <p className="text-on-surface-variant mb-8 max-w-sm">There is currently no active competition on this ring. Please initialize the first category to begin.</p>
          <button 
            disabled={loading}
            onClick={() => handleStartCategory(pendingAssignments[0].id)}
            className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            <span className="material-symbols-outlined" style={{fontVariationSettings: '"FILL" 1'}}>play_arrow</span>
            Start First Category
          </button>
        </section>
      )}

      {activeAssignment && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">CURRENT</h2>
            <span className={`flex items-center gap-2 px-3 py-1 rounded-full font-label-caps text-label-caps border ${
              activeAssignment.status === 'running' 
                ? 'bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]' 
                : 'bg-error-container text-on-error-container border-error/20'
            }`}>
              {activeAssignment.status === 'running' && <span className="w-2 h-2 rounded-full bg-[#2e7d32] animate-pulse"></span>}
              {activeAssignment.status.toUpperCase()}
            </span>
          </div>
          <div className="bg-surface-container-lowest border-l-4 border-secondary border-t border-r border-b border-outline-variant rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 p-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-secondary-container rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-3xl text-on-secondary-container" style={{fontVariationSettings: '"FILL" 1'}}>sports_martial_arts</span>
              </div>
              <div className="space-y-1">
                <h3 className="font-headline-sm text-headline-sm font-semibold">{activeAssignment.categories?.name}</h3>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1 text-on-surface-variant font-body-sm">
                    <span className="material-symbols-outlined text-sm">group</span>
                    {activeAssignment.categories?.expected_matches || 0} Expected Matches
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <button 
                onClick={() => router.push(`/moderator/ring/${ringId}/current`)}
                className="flex-grow md:flex-grow-0 px-6 py-2.5 bg-primary text-on-primary rounded-lg font-label-caps text-label-caps hover:opacity-80 transition-opacity"
              >
                GO TO MATCH
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingAssignments.length > 0 && (
        <div className="space-y-4 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">UP NEXT</h2>
          </div>
          <div className="space-y-3">
            {pendingAssignments.map((assignment, index) => (
              <div key={assignment.id} className="group bg-surface-container-low border border-outline-variant rounded-xl p-5 flex items-center justify-between transition-all">
                <div className="flex items-center gap-6">
                  <span className="font-data-mono text-outline text-sm w-4">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-body-md font-medium text-on-surface">{assignment.categories?.name}</p>
                    <p className="text-on-surface-variant text-sm">{assignment.categories?.expected_matches || 0} Matches</p>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <button 
                    disabled={loading || index === 0} 
                    onClick={() => handleReorder(assignment.id, "up")}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container text-on-surface-variant disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">keyboard_arrow_up</span>
                  </button>
                  <button 
                    disabled={loading || index === pendingAssignments.length - 1} 
                    onClick={() => handleReorder(assignment.id, "down")}
                    className="w-8 h-8 flex items-center justify-center rounded hover:bg-surface-container text-on-surface-variant disabled:opacity-30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">keyboard_arrow_down</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!activeAssignment && pendingAssignments.length === 0 && (
        <div className="text-center p-12 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface-variant">
          No categories assigned to this ring yet.
        </div>
      )}
    </div>
  );
}
