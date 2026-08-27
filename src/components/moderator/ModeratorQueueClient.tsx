"use client";

import React, { useState, useEffect } from "react";
import { startCategory, reorderCategory } from "@/actions/moderator";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ModeratorQueueClient({ ringId, initialAssignments }: { ringId: string, initialAssignments: any[] }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`queue_${ringId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'category_assignments',
        filter: `ring_id=eq.${ringId}`
      }, async (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const newRow = payload.new as any;
          // Fetch joined category info if missing from raw payload
          let categoryData = newRow.categories;
          if (!categoryData && newRow.category_id) {
            const { data } = await supabase
              .from('categories')
              .select('name, expected_matches, belt, age_bracket')
              .eq('id', newRow.category_id)
              .single();
            if (data) categoryData = data;
          }

          const fullAssignment = { ...newRow, categories: categoryData };

          setAssignments(prev => {
            const idx = prev.findIndex(a => a.id === fullAssignment.id || a.category_id === fullAssignment.category_id);
            if (idx > -1) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...fullAssignment };
              return copy;
            }
            return [...prev, fullAssignment];
          });
        } else if (payload.eventType === 'DELETE') {
          setAssignments(prev => prev.filter(a => a.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ringId, supabase]);

  const pendingAssignments = assignments
    .filter(a => a.status === 'pending')
    .sort((a, b) => a.queue_order - b.queue_order);

  const activeAssignment = assignments.find(a => a.status === 'running' || a.status === 'paused');

  const handleStart = async (id: string) => {
    setLoadingId(id);
    try {
      await startCategory(id, ringId);
      router.push(`/moderator/ring/${ringId}/current`);
    } catch (e) {
      console.error(e);
      alert("Failed to start category");
    } finally {
      setLoadingId(null);
    }
  };

  const handleReorder = async (id: string, direction: "up" | "down") => {
    try {
      await reorderCategory(id, ringId, direction);
    } catch (e) {
      console.error(e);
      alert("Failed to reorder queue");
    }
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">
      <div>
        <h2 className="font-headline-md text-xl font-black text-primary">Tatami Queue</h2>
        <p className="text-body-sm text-on-surface-variant">Scheduled upcoming categories in match order.</p>
      </div>

      {activeAssignment && (
        <div className="p-4 bg-secondary/10 border border-secondary/30 rounded-xl flex justify-between items-center">
          <div>
            <span className="text-[10px] font-label-caps font-bold text-secondary uppercase tracking-wider block">CURRENTLY ON MAT</span>
            <span className="font-bold text-primary text-sm">{activeAssignment.categories?.name}</span>
          </div>
          <button 
            onClick={() => router.push(`/moderator/ring/${ringId}/current`)}
            className="px-3 py-1.5 bg-secondary text-on-secondary rounded-lg font-bold text-xs hover:opacity-90 transition-opacity"
          >
            View Live
          </button>
        </div>
      )}

      <div className="space-y-3">
        {pendingAssignments.map((a, index) => (
          <div 
            key={a.id}
            className="p-4 bg-surface-container-lowest border border-outline-variant rounded-xl shadow-xs flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="font-data-mono font-black text-lg text-outline w-6 text-center">{index + 1}</span>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-primary text-sm truncate">{a.categories?.name}</h4>
                <div className="flex items-center gap-2 text-[10px] text-on-surface-variant font-data-mono">
                  <span>{a.categories?.belt || a.categories?.weight_class || "-"}</span>
                  <span>•</span>
                  <span>{a.categories?.expected_matches || 0} Matches</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex flex-col gap-0.5">
                <button 
                  onClick={() => handleReorder(a.id, "up")}
                  disabled={index === 0}
                  className="p-1 hover:bg-surface-container rounded disabled:opacity-20 text-on-surface-variant"
                  title="Move Up"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                </button>
                <button 
                  onClick={() => handleReorder(a.id, "down")}
                  disabled={index === pendingAssignments.length - 1}
                  className="p-1 hover:bg-surface-container rounded disabled:opacity-20 text-on-surface-variant"
                  title="Move Down"
                >
                  <span className="material-symbols-outlined text-[14px]">arrow_downward</span>
                </button>
              </div>

              <button
                onClick={() => handleStart(a.id)}
                disabled={loadingId === a.id}
                className="px-4 py-2.5 bg-primary text-on-primary rounded-lg font-bold text-xs hover:opacity-90 transition-opacity flex items-center gap-1 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                {loadingId === a.id ? "Starting..." : "Start"}
              </button>
            </div>
          </div>
        ))}

        {pendingAssignments.length === 0 && (
          <div className="p-8 text-center border border-dashed border-outline-variant rounded-2xl text-on-surface-variant italic">
            No categories remaining in this Tatami's queue.
          </div>
        )}
      </div>
    </div>
  );
}
