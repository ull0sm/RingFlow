"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { saveAssignments } from "@/actions/balancing";
import { createClient } from "@/utils/supabase/client";

type Category = {
  id: string;
  name: string;
  age_bracket: string | null;
  weight_class: string | null;
  athletes_count: number;
  expected_matches: number;
  belt?: string | null;
  age_min?: number | null;
  age_max?: number | null;
  sex?: string | null;
  day?: string | null;
};

type Ring = {
  id: string;
  name: string;
  ring_order: number;
};

type Assignment = {
  category_id: string;
  ring_id: string;
  queue_order: number;
  status?: string;
  created_at?: string;
  completed_at?: string | null;
};

interface Props {
  tournamentId: string;
  tournamentName: string;
  initialCategories: Category[];
  initialRings: Ring[];
  initialAssignments: Assignment[];
  completedTimes: Record<string, string>;
}

export default function RingBalancingClient({ tournamentId, tournamentName, initialCategories, initialRings, initialAssignments, completedTimes }: Props) {
  const [unassigned, setUnassigned] = useState<Category[]>([]);
  const [ringQueues, setRingQueues] = useState<Record<string, Category[]>>({});
  const [ringCompletedQueues, setRingCompletedQueues] = useState<Record<string, Category[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [saveStatusText, setSaveStatusText] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Drag confirmation state (for cross-ring moves)
  const [pendingDragResult, setPendingDragResult] = useState<DropResult | null>(null);
  const [confirmText, setConfirmText] = useState("");

  // History view per ring
  const [historyOpenForRing, setHistoryOpenForRing] = useState<string | null>(null);

  // Filter & Sort State
  const [search, setSearch] = useState("");
  const [beltFilter, setBeltFilter] = useState("");
  const [ageFilter, setAgeFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "athletes" | "weight">("athletes");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [statusFilter, setStatusFilter] = useState<"idle" | "queue" | "completed">("idle");

  // Realtime assignments map for live match count, status, queue_order tracking
  const [assignmentsMap, setAssignmentsMap] = useState<Record<string, { matches_completed: number; status: string; ring_id: string; queue_order: number }>>({});

  useEffect(() => {
    const map: Record<string, { matches_completed: number; status: string; ring_id: string; queue_order: number }> = {};
    initialAssignments.forEach(a => {
      map[a.category_id] = {
        matches_completed: (a as any).matches_completed || 0,
        status: a.status || "pending",
        ring_id: a.ring_id,
        queue_order: a.queue_order ?? 0,
      };
    });
    setAssignmentsMap(map);
  }, [initialAssignments]);

  useEffect(() => {
    const supabase = createClient();
    const ringIds = initialRings.map(r => r.id);
    if (ringIds.length === 0) return;

    const channel = supabase.channel(`admin_balancing_${tournamentId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'category_assignments'
      }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const updated = payload.new as any;
          if (updated && updated.category_id) {
            setAssignmentsMap(prev => ({
              ...prev,
              [updated.category_id]: {
                matches_completed: updated.matches_completed || 0,
                status: updated.status || "pending",
                ring_id: updated.ring_id,
                queue_order: updated.queue_order ?? prev[updated.category_id]?.queue_order ?? 0,
              }
            }));

            if (updated.status === 'completed' && updated.ring_id) {
              setRingQueues(prev => {
                const currentRingQueue = prev[updated.ring_id] || [];
                const categoryItem = currentRingQueue.find(c => c.id === updated.category_id);
                if (categoryItem) {
                  const newRingQueue = currentRingQueue.filter(c => c.id !== updated.category_id);
                  setRingCompletedQueues(compPrev => {
                    const compQueue = compPrev[updated.ring_id] || [];
                    if (!compQueue.some(c => c.id === categoryItem.id)) {
                      return { ...compPrev, [updated.ring_id]: [categoryItem, ...compQueue] };
                    }
                    return compPrev;
                  });
                  return { ...prev, [updated.ring_id]: newRingQueue };
                }
                return prev;
              });
            }

            if (updated.ring_id && updated.status !== 'completed') {
              setRingQueues(prev => {
                const currentQueue = prev[updated.ring_id];
                if (!currentQueue) return prev;

                let catItem = currentQueue.find(c => c.id === updated.category_id);
                if (!catItem) {
                  for (const rId of Object.keys(prev)) {
                    const found = prev[rId].find(c => c.id === updated.category_id);
                    if (found) { catItem = found; break; }
                  }
                  if (!catItem) {
                    catItem = unassigned.find(c => c.id === updated.category_id);
                  }
                }
                if (!catItem) return prev;

                const cleanQueue = currentQueue.filter(c => c.id !== updated.category_id);

                if (updated.status === 'running' || updated.status === 'paused') {
                  return { ...prev, [updated.ring_id]: [catItem, ...cleanQueue] };
                } else if (updated.queue_order !== undefined) {
                  const reQueue = [...cleanQueue];
                  const insertIdx = Math.min(Math.max(0, updated.queue_order), reQueue.length);
                  reQueue.splice(insertIdx, 0, catItem);
                  return { ...prev, [updated.ring_id]: reQueue };
                }
                return prev;
              });
            }
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, initialRings]);

  // Initialize state from props (once on mount)
  useEffect(() => {
    if (isInitialized) return;
    setIsInitialized(true);
    setIsMounted(true);
    setLastSaved(new Date());

    const ringMap: Record<string, Category[]> = {};
    const ringMapHistory: Record<string, Category[]> = {};
    initialRings.forEach(r => {
      ringMap[r.id] = [];
      ringMapHistory[r.id] = [];
    });

    const unassignedList: Category[] = [];

    initialCategories.forEach(cat => {
      const assignment = initialAssignments.find(a => a.category_id === cat.id);
      if (assignment && ringMap[assignment.ring_id]) {
        if (assignment.status === "completed") {
          ringMapHistory[assignment.ring_id].push(cat);
        } else {
          ringMap[assignment.ring_id].push(cat);
        }
      } else {
        unassignedList.push(cat);
      }
    });

    // Sort ring queues by original queue_order
    Object.keys(ringMap).forEach(ringId => {
      ringMap[ringId].sort((a, b) => {
        const orderA = initialAssignments.find(as => as.category_id === a.id)?.queue_order || 0;
        const orderB = initialAssignments.find(as => as.category_id === b.id)?.queue_order || 0;
        return orderA - orderB;
      });
    });

    setUnassigned(unassignedList);
    setRingQueues(ringMap);
    setRingCompletedQueues(ringMapHistory);
  }, [initialCategories, initialRings, initialAssignments, isInitialized]);

  const executeDrag = (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;

    const sourceDroppableId = source.droppableId.startsWith("header_")
      ? source.droppableId.replace("header_", "")
      : source.droppableId;

    const destDroppableId = destination.droppableId.startsWith("header_")
      ? destination.droppableId.replace("header_", "")
      : destination.droppableId;

    if (sourceDroppableId === destDroppableId && source.index === destination.index && !destination.droppableId.startsWith("header_")) return;

    const nextUnassigned = [...unassigned];
    const nextRingQueues = { ...ringQueues };
    Object.keys(ringQueues).forEach(key => {
      nextRingQueues[key] = [...ringQueues[key]];
    });

    let movedItem: Category | undefined;
    if (sourceDroppableId === "unassigned") {
      const realIndex = nextUnassigned.findIndex(c => c.id === draggableId);
      if (realIndex === -1) return;
      movedItem = nextUnassigned[realIndex];
      nextUnassigned.splice(realIndex, 1);
    } else {
      const sourceQueue = nextRingQueues[sourceDroppableId];
      if (sourceQueue) {
        const itemIdx = sourceQueue.findIndex(c => c.id === draggableId);
        if (itemIdx > -1) {
          movedItem = sourceQueue[itemIdx];
          sourceQueue.splice(itemIdx, 1);
        }
      }
    }

    if (!movedItem) return;

    const prevUnassigned = [...unassigned];
    const prevRingQueues = { ...ringQueues };

    // Guard: block placing above a live/running category
    if (destDroppableId !== "unassigned") {
      const targetQueue = ringQueues[destDroppableId] || [];
      const topCat = targetQueue[0];
      const topStatus = topCat ? assignmentsMap[topCat.id]?.status : null;
      
      if (topCat && (topStatus === "running" || topStatus === "paused")) {
        const isHeaderDrop = destination.droppableId.startsWith("header_");
        if (!isHeaderDrop && destination.index === 0 && movedItem.id !== topCat.id) {
          alert(`Cannot place above "${topCat.name}": it is currently live/running on this Tatami!`);
          return;
        }
      }
    }

    // Guard: block dragging a running category off its tatami
    if (sourceDroppableId !== "unassigned") {
      const sourceQueue = ringQueues[sourceDroppableId] || [];
      const sourceTop = sourceQueue[0];
      const sourceTopStatus = sourceTop ? assignmentsMap[sourceTop.id]?.status : null;
      if (sourceTop && (sourceTopStatus === "running" || sourceTopStatus === "paused")) {
        if (movedItem.id === sourceTop.id && destDroppableId !== sourceDroppableId) {
          alert(`Cannot move "${sourceTop.name}": it is currently live/running on Tatami!`);
          return;
        }
      }
    }

    if (destDroppableId === "unassigned") {
      const visibleAtDest = unassigned.filter(cat => {
        if (search && !cat.name.toLowerCase().includes(search.toLowerCase())) return false;
        if (beltFilter && cat.belt !== beltFilter) return false;
        if (ageFilter && cat.age_bracket !== ageFilter) return false;
        if (sexFilter && cat.sex !== sexFilter) return false;
        return true;
      });
      const anchorItem = visibleAtDest[destination.index];
      if (anchorItem) {
        const anchorIndex = nextUnassigned.findIndex(c => c.id === anchorItem.id);
        nextUnassigned.splice(anchorIndex >= 0 ? anchorIndex : nextUnassigned.length, 0, movedItem);
      } else {
        nextUnassigned.push(movedItem);
      }
    } else {
      const destQueue = nextRingQueues[destDroppableId] || [];
      const insertIndex = destination.droppableId.startsWith("header_")
        ? destQueue.length
        : Math.min(destination.index, destQueue.length);
      destQueue.splice(insertIndex, 0, movedItem);
      nextRingQueues[destDroppableId] = destQueue;
    }

    setUnassigned(nextUnassigned);
    setRingQueues(nextRingQueues);

    setAssignmentsMap(prev => {
      const nextMap = { ...prev };
      Object.keys(nextRingQueues).forEach(rId => {
        nextRingQueues[rId].forEach((cat, idx) => {
          nextMap[cat.id] = {
            ...nextMap[cat.id],
            ring_id: rId,
            queue_order: idx,
            status: nextMap[cat.id]?.status || "pending",
            matches_completed: nextMap[cat.id]?.matches_completed || 0,
          };
        });
      });
      return nextMap;
    });

    triggerAutoSaveIfNeeded(nextUnassigned, nextRingQueues, prevUnassigned, prevRingQueues);
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    
    const sourceDroppableId = source.droppableId.startsWith("header_")
      ? source.droppableId.replace("header_", "")
      : source.droppableId;

    const destDroppableId = destination.droppableId.startsWith("header_")
      ? destination.droppableId.replace("header_", "")
      : destination.droppableId;

    // Cross-ring moves require confirmation
    if (sourceDroppableId !== "unassigned" && sourceDroppableId !== destDroppableId) {
      setPendingDragResult(result);
      setConfirmText("");
      return;
    }

    executeDrag(result);
  };

  const buildPayload = (
    targetUnassigned: Category[],
    targetRingQueues: Record<string, Category[]>
  ) => {
    const payload: { category_id: string; ring_id: string | null; queue_order: number; status?: string; completed_at?: string | null }[] = [];

    targetUnassigned.forEach((cat, idx) => {
      payload.push({ category_id: cat.id, ring_id: null, queue_order: idx });
    });

    Object.keys(targetRingQueues).forEach(ringId => {
      targetRingQueues[ringId].forEach((cat, idx) => {
        const liveStatus = assignmentsMap[cat.id]?.status;
        payload.push({ category_id: cat.id, ring_id: ringId, queue_order: idx, status: liveStatus || "pending" });
      });
    });

    Object.keys(ringCompletedQueues).forEach(ringId => {
      ringCompletedQueues[ringId].forEach((cat, idx) => {
        const originalAssignment = initialAssignments.find(a => a.category_id === cat.id);
        payload.push({
          category_id: cat.id,
          ring_id: ringId,
          queue_order: (targetRingQueues[ringId]?.length || 0) + idx,
          status: "completed",
          completed_at: originalAssignment?.completed_at || new Date().toISOString()
        });
      });
    });

    return payload;
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = buildPayload(unassigned, ringQueues);

    try {
      await saveAssignments(tournamentId, payload);
      setLastSaved(new Date());
      setSaveStatusText("Saved!");
      setTimeout(() => setSaveStatusText(null), 2500);
    } catch (err: any) {
      const msg: string = err?.message || "";
      if (msg.startsWith("RUNNING_CATEGORY_DISPLACED:")) {
        const catId = msg.replace("RUNNING_CATEGORY_DISPLACED:", "");
        const catName = initialCategories.find(c => c.id === catId)?.name || "A category";
        alert(`Cannot save: "${catName}" is currently running on a Tatami.\n\nA running category must stay at the top of its queue. Move it to the first position or wait for the moderator to finish it before saving.`);
      } else {
        alert("Failed to save assignments. Please try again.");
        console.error(err);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const triggerAutoSaveIfNeeded = (
    updatedUnassigned?: Category[],
    updatedRingQueues?: Record<string, Category[]>,
    prevUnassigned?: Category[],
    prevRingQueues?: Record<string, Category[]>
  ) => {
    if (!autoSave) return;

    const targetUnassigned = updatedUnassigned || unassigned;
    const targetRingQueues = updatedRingQueues || ringQueues;

    setIsSaving(true);
    setSaveStatusText("Auto-saving...");
    const payload = buildPayload(targetUnassigned, targetRingQueues);

    saveAssignments(tournamentId, payload)
      .then(() => {
        setLastSaved(new Date());
        setSaveStatusText("Auto-saved");
        setTimeout(() => setSaveStatusText(null), 2500);
      })
      .catch((err: any) => {
        if (prevUnassigned && prevRingQueues) {
          setUnassigned(prevUnassigned);
          setRingQueues(prevRingQueues);
        }
        setSaveStatusText(null);

        const msg: string = err?.message || "";
        if (msg.startsWith("RUNNING_CATEGORY_DISPLACED:")) {
          const catId = msg.replace("RUNNING_CATEGORY_DISPLACED:", "");
          const catName = initialCategories.find(c => c.id === catId)?.name || "A category";
          alert(`Auto-save blocked & reverted: "${catName}" is currently running on a Tatami.\n\nA running category must stay at the top of its queue.`);
        } else {
          alert("Auto-save failed. UI reverted to previous state.");
          console.error("Auto-save error:", err);
        }
      })
      .finally(() => {
        setIsSaving(false);
      });
  };

  const calculateRingMatchStats = (ringId: string) => {
    const activeCats = ringQueues[ringId] || [];
    const completedCats = ringCompletedQueues[ringId] || [];
    const allCats = [...activeCats, ...completedCats];

    let totalExpected = 0;
    let totalCompleted = 0;

    allCats.forEach(cat => {
      totalExpected += (cat.expected_matches || 0);
      const assignment = assignmentsMap[cat.id];
      if (assignment?.status === 'completed') {
        totalCompleted += (cat.expected_matches || 0);
      } else if (assignment) {
        totalCompleted += Math.min(cat.expected_matches || 0, assignment.matches_completed || 0);
      }
    });

    const percentage = totalExpected > 0 ? (totalCompleted / totalExpected) * 100 : 0;
    return { totalCompleted, totalExpected, percentage };
  };

  const calculateRingWorkload = (ringId: string) => {
    const categories = ringQueues[ringId] || [];
    const totalMatches = categories.reduce((sum, cat) => sum + cat.expected_matches, 0);
    const totalSeconds = totalMatches * 109;
    const hours = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  const calculateRingAthletes = (ringId: string) => {
    const categories = ringQueues[ringId] || [];
    return categories.reduce((sum, cat) => sum + cat.athletes_count, 0);
  };

  const isOverloaded = (ringId: string) => {
    const categories = ringQueues[ringId] || [];
    const totalMatches = categories.reduce((sum, cat) => sum + cat.expected_matches, 0);
    return totalMatches * 109 > 360 * 60;
  };

  const queuedCategories = initialCategories.filter(cat => {
    const a = assignmentsMap[cat.id];
    return a && a.status !== 'completed' && !unassigned.some(u => u.id === cat.id);
  });

  const allCompletedCategories = initialCategories.filter(cat => {
    const a = assignmentsMap[cat.id];
    return a && a.status === 'completed';
  });

  const visibleUnassigned = unassigned
    .filter(cat => {
      if (search && !cat.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (beltFilter && cat.belt !== beltFilter) return false;
      if (ageFilter && cat.age_bracket !== ageFilter) return false;
      if (sexFilter && cat.sex !== sexFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let result = 0;
      if (sortBy === "athletes") {
        result = a.athletes_count - b.athletes_count;
      } else if (sortBy === "weight") {
        const getNum = (w: string | null) => {
          if (!w) return 0;
          const m = w.match(/(\d+)/);
          return m ? parseInt(m[1]) : 0;
        };
        result = getNum(a.weight_class) - getNum(b.weight_class) || (a.weight_class || "").localeCompare(b.weight_class || "");
      } else {
        result = a.name.localeCompare(b.name);
      }
      return sortOrder === "asc" ? result : -result;
    });

  const sidebarCategoriesToShow = statusFilter === "idle"
    ? visibleUnassigned
    : statusFilter === "queue"
    ? queuedCategories.filter(cat => search ? cat.name.toLowerCase().includes(search.toLowerCase()) : true)
    : allCompletedCategories.filter(cat => search ? cat.name.toLowerCase().includes(search.toLowerCase()) : true);

  const uniqueBelts = Array.from(new Set(initialCategories.map(c => c.belt).filter(Boolean)));
  const uniqueAges = Array.from(new Set(initialCategories.map(c => c.age_bracket).filter(Boolean)));
  const uniqueSexes = Array.from(new Set(initialCategories.map(c => c.sex).filter(Boolean)));

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      {/* TopNavBar */}
      <header className="flex justify-between items-center w-full px-8 h-16 bg-surface-container-lowest border-b border-outline-variant shrink-0 z-10">
        <div className="flex items-center gap-6">
          <span className="font-headline-lg text-headline-lg font-black text-primary tracking-tighter">Ring Flow</span>
          <div className="h-8 w-[1px] bg-outline-variant"></div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline-sm text-headline-sm text-primary">Tatami Balancing</h2>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant font-label-caps text-label-caps opacity-70">{tournamentName}</span>
          </div>
        </div>
      </header>

      {/* Tournament Overview Bar */}
      <div className="bg-primary text-on-primary px-8 py-3 flex items-center justify-between shrink-0 shadow-lg z-10 w-full">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-label-caps opacity-60">TOTAL TATAMIS</span>
            <span className="font-data-mono text-lg font-bold">{initialRings.length} ACTIVE</span>
          </div>
          <div className="h-6 w-[1px] bg-white/20"></div>
          
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-label-caps opacity-60">SYNC MODE</span>
              <button 
                onClick={() => setAutoSave(!autoSave)}
                className={`flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold transition-all border ${
                  autoSave 
                    ? 'bg-secondary/20 border-secondary text-white' 
                    : 'bg-white/5 border-outline-variant/40 text-on-primary/70 hover:bg-white/10'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${autoSave ? 'bg-secondary animate-pulse' : 'bg-outline-variant'}`}></span>
                <span className="font-label-caps">{autoSave ? "AUTO SYNC ON" : "MANUAL SYNC"}</span>
              </button>
            </div>

            {!autoSave && (
              <div className="flex flex-col">
                <span className="text-[10px] font-label-caps opacity-60">ACTIONS</span>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className="bg-secondary text-white px-4 py-1 rounded-md text-xs font-bold hover:opacity-90 disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                >
                  {isSaving && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                  {isSaving ? "SAVING..." : "SAVE BALANCING"}
                </button>
              </div>
            )}

            {saveStatusText && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary text-white text-xs font-bold rounded-md shadow-md">
                <span className="material-symbols-outlined text-sm">sync</span>
                <span className="font-label-caps tracking-wider">{saveStatusText}</span>
              </div>
            )}
            {!saveStatusText && lastSaved && (
              <span className="text-[11px] opacity-70 font-data-mono">
                Synced {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex-1 flex overflow-hidden w-full">
          
          {/* Left Sidebar: Category Pool */}
          <section className="w-80 flex flex-col bg-surface-container-lowest border-r border-outline-variant shrink-0 z-10 relative">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="font-label-caps text-label-caps text-primary">
                  {statusFilter === "idle" ? `Unassigned (${visibleUnassigned.length})` : statusFilter === "queue" ? `In Queue (${queuedCategories.length})` : `Completed (${allCompletedCategories.length})`}
                </h3>
                <button 
                  onClick={() => { setSearch(""); setBeltFilter(""); setAgeFilter(""); setSexFilter(""); }}
                  className="text-[10px] text-secondary hover:underline"
                >Clear Filters</button>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex rounded-lg overflow-hidden border border-outline-variant bg-surface-container-high">
                {(["idle", "queue", "completed"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors ${
                      statusFilter === tab ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Search */}
              <input 
                type="text" 
                placeholder="Search categories..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-outline-variant rounded p-2 text-xs outline-none focus:border-secondary"
              />

              {/* Filters (only for idle) */}
              {statusFilter === "idle" && (
              <div className="flex gap-2 flex-wrap">
                {uniqueBelts.length > 0 && (
                  <select 
                    value={beltFilter} 
                    onChange={e => setBeltFilter(e.target.value)}
                    className="flex-1 min-w-[70px] bg-white border border-outline-variant rounded p-1 text-[10px] outline-none"
                  >
                    <option value="">All Belts</option>
                    {uniqueBelts.map(b => <option key={b as string} value={b as string}>{b}</option>)}
                  </select>
                )}

                {uniqueAges.length > 0 && (
                  <select 
                    value={ageFilter} 
                    onChange={e => setAgeFilter(e.target.value)}
                    className="flex-1 min-w-[70px] bg-white border border-outline-variant rounded p-1 text-[10px] outline-none"
                  >
                    <option value="">Age</option>
                    {uniqueAges.map(a => <option key={a as string} value={a as string}>{a}</option>)}
                  </select>
                )}

                <select 
                  value={sexFilter} 
                  onChange={e => setSexFilter(e.target.value)}
                  className="min-w-[60px] bg-white border border-outline-variant rounded p-1 text-[10px] outline-none"
                >
                  <option value="">Sex</option>
                  {uniqueSexes.map(s => <option key={s as string} value={s as string}>{s}</option>)}
                </select>

                <div className="w-full flex gap-2">
                  <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value as any)}
                    className="flex-1 bg-white border border-outline-variant rounded p-1 text-[10px] outline-none"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="athletes">Sort: Athletes</option>
                    <option value="weight">Sort: Weight</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="bg-white border border-outline-variant rounded p-1 text-[10px] flex items-center justify-center min-w-[40px] hover:bg-surface-container"
                  >
                    {sortOrder === "asc" ? "ASC" : "DESC"}
                  </button>
                </div>
              </div>
              )}
            </div>

            {/* Idle view: draggable categories */}
            {statusFilter === "idle" ? (
              <Droppable droppableId="unassigned">
                {(provided, snapshot) => (
                  <div 
                    ref={provided.innerRef} 
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest ${snapshot.isDraggingOver ? 'bg-secondary/5' : ''}`}
                  >
                    {visibleUnassigned.map((cat, index) => (
                      <Draggable key={cat.id} draggableId={cat.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`p-4 bg-white border ${snapshot.isDragging ? 'border-secondary shadow-lg' : 'border-outline-variant shadow-sm'} rounded-xl cursor-grab active:cursor-grabbing`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex gap-1 flex-wrap">
                                {cat.belt && <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface rounded text-[9px] font-bold uppercase">{cat.belt}</span>}
                                {cat.sex && <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface rounded text-[9px] font-bold uppercase">{cat.sex}</span>}
                                {cat.age_bracket ? (
                                  <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface rounded text-[9px] font-bold uppercase">{cat.age_bracket}</span>
                                ) : (cat.age_min !== null || cat.age_max !== null) && (
                                  <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface rounded text-[9px] font-bold uppercase">
                                    {cat.age_min}-{cat.age_max}
                                  </span>
                                )}
                                {cat.day && <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface rounded text-[9px] font-bold uppercase">{cat.day}</span>}
                              </div>
                              <span className="material-symbols-outlined text-outline-variant text-sm">drag_indicator</span>
                            </div>
                            <h4 className="font-headline-sm text-sm text-primary mb-3">{cat.name}</h4>
                            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                              <span className="flex items-center gap-1 font-data-mono text-[11px]"><span className="material-symbols-outlined text-[14px] text-outline">group</span> {cat.athletes_count}</span>
                              <span className="font-data-mono text-xs font-bold px-2 py-0.5 bg-primary text-on-primary rounded">{Math.ceil((cat.expected_matches * 109) / 60)}m</span>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {sidebarCategoriesToShow.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-40 text-outline opacity-60">
                    <span className="material-symbols-outlined text-3xl mb-2">inbox</span>
                    <span className="text-xs">No categories</span>
                  </div>
                )}
                {sidebarCategoriesToShow.map(cat => {
                  const assignment = assignmentsMap[cat.id];
                  const ringName = initialRings.find(r => r.id === assignment?.ring_id)?.name?.replace(/Ring/i, 'Tatami') || "";
                  const isCompleted = assignment?.status === 'completed';
                  const isRunning = assignment?.status === 'running' || assignment?.status === 'paused';
                  const matchesDone = assignment?.matches_completed || 0;
                  const matchesTotal = cat.expected_matches || 0;
                  const pct = matchesTotal > 0 ? (matchesDone / matchesTotal) * 100 : 0;

                  return (
                    <div
                      key={cat.id}
                      className={`p-3 border rounded-xl relative overflow-hidden ${
                        isCompleted ? 'bg-surface-container border-outline-variant/50 opacity-60' : 'bg-surface-container border-outline-variant/50 opacity-70'
                      }`}
                    >
                      <div className="flex gap-1 flex-wrap mb-1.5">
                        {cat.belt && <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface rounded text-[9px] font-bold uppercase">{cat.belt}</span>}
                        {cat.sex && <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface rounded text-[9px] font-bold uppercase">{cat.sex}</span>}
                        {cat.age_bracket && <span className="px-1.5 py-0.5 bg-surface-container-high text-on-surface rounded text-[9px] font-bold uppercase">{cat.age_bracket}</span>}
                      </div>
                      <h4 className="text-xs font-bold text-on-surface mb-1.5">{cat.name}</h4>
                      <div className="flex justify-between items-center text-[10px] text-on-surface-variant mb-1">
                        <span className="flex items-center gap-1 font-bold">
                          <span className="material-symbols-outlined text-[12px]">{isCompleted ? 'done_all' : 'schedule'}</span>
                          {ringName}
                        </span>
                        {isRunning && <span className="text-[9px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Live</span>}
                        {isCompleted && <span className="text-[9px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">Done</span>}
                      </div>
                      {(isRunning || isCompleted) && (
                        <div className="mt-1.5">
                          <div className="flex justify-between text-[9px] font-bold text-on-surface-variant mb-0.5">
                            <span>{matchesDone} / {matchesTotal} matches</span>
                            <span>{pct.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-surface-container-high h-1 rounded-full overflow-hidden">
                            <div className={`h-full transition-all duration-500 ${isCompleted ? 'bg-green-500' : 'bg-secondary'}`} style={{ width: `${Math.min(100, pct)}%` }}></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Horizontal Scrollable Ring Grid */}
          <section className="flex-1 overflow-x-auto bg-surface-container-low flex p-6 gap-6 items-start">
            {initialRings.map(ring => {
              const overloaded = isOverloaded(ring.id);
              const isHistoryView = historyOpenForRing === ring.id;
              
              if (isHistoryView) {
                return (
                  <div key={ring.id} className="w-72 shrink-0 flex flex-col bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm h-full">
                    <div className="sticky top-0 z-10 p-4 flex justify-between items-start shrink-0 bg-surface-container-highest text-on-surface">
                      <div className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[20px] text-primary mt-1">history</span>
                        <div>
                          <h4 className="font-headline-sm text-lg tracking-tight leading-none mb-1">{ring.name.replace(/Ring/i, "Tatami")} History</h4>
                          <div className="flex gap-3 text-[10px] font-bold text-on-surface-variant uppercase">
                            <span>{ringCompletedQueues[ring.id]?.length || 0} Categories</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">group</span> {ringCompletedQueues[ring.id]?.reduce((sum, cat) => sum + cat.athletes_count, 0) || 0} Athletes</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        className="p-1 rounded hover:bg-black/10 transition-colors text-primary"
                        onClick={() => setHistoryOpenForRing(null)}
                      >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                      </button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {(!ringCompletedQueues[ring.id] || ringCompletedQueues[ring.id].length === 0) ? (
                        <div className="flex flex-col items-center justify-center h-full text-outline opacity-70">
                          <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                          <span className="text-sm">No completed categories</span>
                        </div>
                      ) : (
                        ringCompletedQueues[ring.id].map(cat => {
                          const assignment = initialAssignments.find(a => a.category_id === cat.id);
                          const fallbackTime = assignment?.completed_at || assignment?.created_at;
                          const rawTime = completedTimes[cat.id] || fallbackTime;
                          const timeStr = rawTime ? new Date(rawTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Completed";
                          return (
                            <div key={cat.id} className="p-3 bg-white border border-outline-variant rounded-lg flex flex-col gap-1 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 left-0 w-1 h-full bg-green-500"></div>
                              <div className="flex justify-between items-center ml-2">
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                                  {(cat.age_bracket || (cat.age_min !== null && cat.age_max !== null ? `${cat.age_min}-${cat.age_max}` : ""))} | {cat.belt || "-"}
                                </span>
                                <span className="text-[10px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[12px]">done_all</span>
                                  {timeStr}
                                </span>
                              </div>
                              <div className="flex justify-between items-center ml-2">
                                <h5 className="text-xs font-bold text-primary">{cat.name}</h5>
                                <span className="flex items-center gap-1 text-[10px] font-data-mono font-bold text-outline">
                                  <span className="material-symbols-outlined text-[12px]">group</span> {cat.athletes_count}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div key={ring.id} className="w-72 shrink-0 flex flex-col bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm h-full">
                  {/* Header Droppable Shortcut */}
                  <Droppable droppableId={`header_${ring.id}`}>
                    {(providedHeader, snapshotHeader) => (
                      <div
                        ref={providedHeader.innerRef}
                        {...providedHeader.droppableProps}
                        className={`sticky top-0 z-10 p-4 flex flex-col shrink-0 relative transition-all ${
                          snapshotHeader.isDraggingOver
                            ? 'bg-emerald-600 text-white ring-4 ring-emerald-400/50 shadow-xl'
                            : overloaded ? 'bg-error text-on-error' : 'bg-primary text-on-primary'
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <div>
                            <h4 className="font-headline-sm text-lg tracking-tight leading-none mb-1">{ring.name.replace(/Ring/i, "Tatami")}</h4>
                            <span className="text-[9px] font-label-caps opacity-80">{overloaded ? "OVERLOADED" : "OPTIMUM CAPACITY"}</span>
                          </div>
                          <button 
                            className="p-1 rounded hover:bg-white/20 transition-colors"
                            onClick={() => setHistoryOpenForRing(ring.id)}
                          >
                            <span className="material-symbols-outlined text-[20px]">history</span>
                          </button>
                        </div>

                        {snapshotHeader.isDraggingOver && (
                          <div className="mt-2 bg-emerald-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow-md animate-pulse">
                            <span className="material-symbols-outlined text-sm">south</span>
                            Append to Bottom of Queue
                          </div>
                        )}

                        <div className="hidden">{providedHeader.placeholder}</div>
                      </div>
                    )}
                  </Droppable>

                  {/* Workload Info */}
                  <div className={`p-3 border-b border-outline-variant flex items-center justify-around ${overloaded ? 'bg-error/5' : 'bg-secondary/5'}`}>
                    <div className="flex flex-col items-center">
                      <span className={`text-[9px] font-label-caps font-bold ${overloaded ? 'text-error' : 'text-on-surface-variant'}`}>EST TIME</span>
                      <span className={`font-data-mono text-lg font-black ${overloaded ? 'text-error' : 'text-secondary'}`}>{calculateRingWorkload(ring.id)}</span>
                    </div>
                    <div className="h-6 w-[1px] bg-outline-variant/50"></div>
                    <div className="flex flex-col items-center">
                      <span className="text-[9px] font-label-caps font-bold text-on-surface-variant">ATHLETES</span>
                      <span className={`flex items-center gap-1 font-data-mono text-lg font-black ${overloaded ? 'text-error' : 'text-secondary'}`}>
                        <span className="material-symbols-outlined text-[15px]">group</span> {calculateRingAthletes(ring.id)}
                      </span>
                    </div>
                  </div>

                  {/* Queue Droppable */}
                  <Droppable droppableId={ring.id}>
                    {(provided, snapshot) => (
                      <div 
                        className={`flex-1 overflow-y-auto p-3 space-y-3 ${snapshot.isDraggingOver ? 'bg-secondary/5' : ''}`}
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                      >
                        {ringQueues[ring.id]?.map((cat, index) => (
                          <Draggable key={cat.id} draggableId={cat.id} index={index}>
                            {(provided, snapshot) => {
                              const catAssignment = assignmentsMap[cat.id];
                              const isRunning = catAssignment?.status === 'running' || catAssignment?.status === 'paused';
                              const matchesDone = catAssignment?.matches_completed || 0;
                              const matchesTotal = cat.expected_matches || 0;
                              const pct = matchesTotal > 0 ? (matchesDone / matchesTotal) * 100 : 0;

                              return (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 border rounded-lg relative overflow-hidden ${
                                  isRunning
                                    ? 'bg-secondary/5 border-secondary/40 shadow-md'
                                    : `bg-surface-container-lowest border-outline-variant ${snapshot.isDragging ? 'border-secondary shadow-lg' : ''}`
                                }`}
                              >
                                {isRunning && (
                                  <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                                )}
                                <div className={`flex justify-between items-center mb-1 ${isRunning ? 'ml-2' : ''}`}>
                                  <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">
                                    {(cat.age_bracket || (cat.age_min !== null && cat.age_max !== null ? `${cat.age_min}-${cat.age_max}` : ""))} | {cat.belt || "-"}
                                  </span>
                                  {isRunning ? (
                                    <span className="text-[9px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">Live</span>
                                  ) : (
                                    <span className="font-data-mono text-[10px] font-bold">{Math.ceil((cat.expected_matches * 109) / 60)}m</span>
                                  )}
                                </div>
                                <h5 className={`text-xs font-bold text-primary mb-2 ${isRunning ? 'ml-2' : ''}`}>{cat.name}</h5>
                                <div className={`flex gap-4 text-[10px] font-data-mono text-outline ${isRunning ? 'ml-2' : ''}`}>
                                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">group</span> {cat.athletes_count}</span>
                                </div>
                                {isRunning && (
                                  <div className="mt-2 ml-2">
                                    <div className="flex justify-between text-[9px] font-bold text-secondary mb-0.5">
                                      <span>{matchesDone} / {matchesTotal} matches</span>
                                      <span>{pct.toFixed(0)}%</span>
                                    </div>
                                    <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                                      <div
                                        className="bg-secondary h-full transition-all duration-500 ease-out"
                                        style={{ width: `${Math.min(100, pct)}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              );
                            }}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </section>
        </div>
      </DragDropContext>

      {/* Bottom Status Bar */}
      <footer className="h-10 bg-surface-container-highest border-t border-outline-variant px-8 flex items-center justify-between shrink-0 z-10 w-full">
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="font-label-caps text-[10px] text-on-surface-variant">System Live</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[14px] text-outline">sync</span>
            <span className="font-label-caps text-[10px] text-on-surface-variant">
              {isMounted && lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : "Not saved yet"}
            </span>
          </div>
        </div>
      </footer>

      {/* Confirmation Modal for cross-ring moves */}
      {pendingDragResult && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col border border-outline-variant">
            <div className="p-6 bg-surface-container-low border-b border-outline-variant">
              <h3 className="font-headline-sm text-xl font-bold text-error flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span>
                Confirm Move
              </h3>
            </div>
            <div className="p-6 flex flex-col gap-4">
              <p className="text-sm text-on-surface-variant">
                You are about to move a category that was already assigned to a tatami. Are you sure you want to proceed?
              </p>
              <div className="bg-error/10 p-4 rounded-lg border border-error/20">
                <label className="text-xs font-bold text-error block mb-2">Type "confirm" to proceed</label>
                <input 
                  type="text" 
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="confirm"
                  className="w-full bg-white border border-error/30 rounded p-2 text-sm outline-none focus:border-error focus:ring-1 focus:ring-error"
                />
              </div>
            </div>
            <div className="p-4 bg-surface-container flex justify-end gap-3 border-t border-outline-variant">
              <button 
                onClick={() => setPendingDragResult(null)}
                className="px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high rounded transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if (pendingDragResult) {
                    executeDrag(pendingDragResult);
                    setPendingDragResult(null);
                  }
                }}
                disabled={confirmText.toLowerCase() !== "confirm"}
                className="px-4 py-2 bg-error text-white text-sm font-bold rounded hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed with Move
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
