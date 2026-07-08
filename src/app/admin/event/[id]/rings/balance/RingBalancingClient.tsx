"use client";

import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { saveAssignments } from "@/actions/balancing";

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
  // State structure:
  // We need a list for "unassigned" and a list for each ring.
  const [unassigned, setUnassigned] = useState<Category[]>([]);
  const [ringQueues, setRingQueues] = useState<Record<string, Category[]>>({});
  const [ringCompletedQueues, setRingCompletedQueues] = useState<Record<string, Category[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Drag confirmation state
  const [pendingDragResult, setPendingDragResult] = useState<DropResult | null>(null);
  const [confirmText, setConfirmText] = useState("");

  // History popover state
  const [historyOpenForRing, setHistoryOpenForRing] = useState<string | null>(null);

  // Filter & Sort State
  const [search, setSearch] = useState("");
  const [beltFilter, setBeltFilter] = useState("");
  const [sexFilter, setSexFilter] = useState("");
  const [dayFilter, setDayFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "athletes">("athletes");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

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
    const { source, destination } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // 1. Create shallow copies of active queues to avoid stale state mutations
    const nextUnassigned = [...unassigned];
    const nextRingQueues = { ...ringQueues };
    Object.keys(ringQueues).forEach(key => {
      nextRingQueues[key] = [...ringQueues[key]];
    });

    // 2. Find and extract the category from the source position
    let movedItem: Category | undefined;
    if (source.droppableId === "unassigned") {
      movedItem = nextUnassigned[source.index];
      nextUnassigned.splice(source.index, 1);
    } else {
      const sourceQueue = nextRingQueues[source.droppableId];
      if (sourceQueue) {
        movedItem = sourceQueue[source.index];
        sourceQueue.splice(source.index, 1);
      }
    }

    if (!movedItem) return;

    // 3. Insert the category into the destination position
    if (destination.droppableId === "unassigned") {
      nextUnassigned.splice(destination.index, 0, movedItem);
    } else {
      const destQueue = nextRingQueues[destination.droppableId] || [];
      destQueue.splice(destination.index, 0, movedItem);
      nextRingQueues[destination.droppableId] = destQueue;
    }

    // 4. Update state atomically in a single render pass
    setUnassigned(nextUnassigned);
    setRingQueues(nextRingQueues);
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    
    // Check if it's moving from one ring to another ring, or from a ring to unassigned
    if (source.droppableId !== "unassigned" && source.droppableId !== destination.droppableId) {
      setPendingDragResult(result);
      setConfirmText("");
      return;
    }

    executeDrag(result);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload: { category_id: string; ring_id: string | null; queue_order: number; status?: string; completed_at?: string | null }[] = [];

    // Process unassigned
    unassigned.forEach((cat, idx) => {
      payload.push({ category_id: cat.id, ring_id: null, queue_order: idx });
    });

    // Process rings
    Object.keys(ringQueues).forEach(ringId => {
      ringQueues[ringId].forEach((cat, idx) => {
        const originalAssignment = initialAssignments.find(a => a.category_id === cat.id);
        let status = "pending";
        // Only preserve running/paused status if it's still in the same ring
        if (originalAssignment && originalAssignment.ring_id === ringId) {
          status = originalAssignment.status || "pending";
        }
        payload.push({ category_id: cat.id, ring_id: ringId, queue_order: idx, status });
      });
    });

    // Process completed categories (keep them assigned and completed)
    Object.keys(ringCompletedQueues).forEach(ringId => {
      ringCompletedQueues[ringId].forEach((cat, idx) => {
        const originalAssignment = initialAssignments.find(a => a.category_id === cat.id);
        payload.push({ 
          category_id: cat.id, 
          ring_id: ringId, 
          queue_order: (ringQueues[ringId]?.length || 0) + idx, 
          status: "completed",
          completed_at: originalAssignment?.completed_at || new Date().toISOString()
        });
      });
    });

    try {
      await saveAssignments(tournamentId, payload);
      setLastSaved(new Date());
    } catch (err) {
      console.error(err);
      alert("Failed to save assignments");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateRingWorkload = (ringId: string) => {
    const categories = ringQueues[ringId] || [];
    const totalMatches = categories.reduce((sum, cat) => sum + cat.expected_matches, 0);
    // 109 seconds per match (1 min 49 secs)
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
    const totalSeconds = totalMatches * 109;
    return totalSeconds > 360 * 60; // > 6 hours
  };

  // Derive visible unassigned
  const visibleUnassigned = unassigned
    .filter(cat => {
      if (search && !cat.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (beltFilter && cat.belt !== beltFilter) return false;
      if (sexFilter && cat.sex !== sexFilter) return false;
      if (dayFilter && cat.day !== dayFilter) return false;
      return true;
    })
    .sort((a, b) => {
      let result = 0;
      if (sortBy === "athletes") {
        result = a.athletes_count - b.athletes_count;
      } else {
        result = a.name.localeCompare(b.name);
      }
      return sortOrder === "asc" ? result : -result;
    });

  const uniqueBelts = Array.from(new Set(initialCategories.map(c => c.belt).filter(Boolean)));
  const uniqueSexes = Array.from(new Set(initialCategories.map(c => c.sex).filter(Boolean)));
  const uniqueDays = Array.from(new Set(initialCategories.map(c => c.day).filter(Boolean)));

  return (
    <div className="flex flex-col h-full overflow-hidden w-full">
      {/* TopNavBar */}
      <header className="flex justify-between items-center w-full px-8 h-16 bg-surface-container-lowest border-b border-outline-variant shrink-0 z-10">
        <div className="flex items-center gap-6">
          <span className="font-headline-lg text-headline-lg font-black text-primary tracking-tighter">Ring Flow</span>
          <div className="h-8 w-[1px] bg-outline-variant"></div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline-sm text-headline-sm text-primary">Ring Balancing</h2>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant font-label-caps text-label-caps opacity-70">{tournamentName}</span>
          </div>
        </div>
      </header>

      {/* Tournament Overview Bar */}
      <div className="bg-primary text-on-primary px-8 py-3 flex items-center justify-between shrink-0 shadow-lg z-10 w-full">
        <div className="flex items-center gap-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-label-caps opacity-60">TOTAL RINGS</span>
            <span className="font-data-mono text-lg font-bold">{initialRings.length} ACTIVE</span>
          </div>
          <div className="h-6 w-[1px] bg-white/20"></div>
          <div className="flex flex-col">
            <span className="text-[10px] font-label-caps opacity-60">ACTIONS</span>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-secondary text-white px-4 py-1 rounded text-xs font-bold hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "SAVING..." : "SAVE BALANCING"}
            </button>
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {/* Main Content Area */}
        <div className="flex-1 flex overflow-hidden w-full">
          
          {/* Persistent Left Sidebar: Unassigned */}
          <section className="w-80 flex flex-col bg-surface-container-lowest border-r border-outline-variant shrink-0 z-10 relative">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <h3 className="font-label-caps text-label-caps text-primary">Unassigned ({visibleUnassigned.length})</h3>
                <button 
                  onClick={() => {
                    setSearch(""); setBeltFilter(""); setSexFilter(""); setDayFilter("");
                  }}
                  className="text-[10px] text-secondary hover:underline"
                >Clear Filters</button>
              </div>

              {/* Search */}
              <input 
                type="text" 
                placeholder="Search categories..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-white border border-outline-variant rounded p-2 text-xs outline-none focus:border-secondary"
              />

              {/* Filters */}
              <div className="flex gap-2 flex-wrap">
                <select 
                  value={beltFilter} 
                  onChange={e => setBeltFilter(e.target.value)}
                  className="flex-1 min-w-[70px] bg-white border border-outline-variant rounded p-1 text-[10px] outline-none"
                >
                  <option value="">All Belts</option>
                  {uniqueBelts.map(b => <option key={b as string} value={b as string}>{b}</option>)}
                </select>

                <select 
                  value={sexFilter} 
                  onChange={e => setSexFilter(e.target.value)}
                  className="min-w-[60px] bg-white border border-outline-variant rounded p-1 text-[10px] outline-none"
                >
                  <option value="">Sex</option>
                  {uniqueSexes.map(s => <option key={s as string} value={s as string}>{s}</option>)}
                </select>

                <select 
                  value={dayFilter} 
                  onChange={e => setDayFilter(e.target.value)}
                  className="min-w-[60px] bg-white border border-outline-variant rounded p-1 text-[10px] outline-none"
                >
                  <option value="">Day</option>
                  {uniqueDays.map(d => <option key={d as string} value={d as string}>{d}</option>)}
                </select>

                <div className="w-full flex gap-2">
                  <select 
                    value={sortBy} 
                    onChange={e => setSortBy(e.target.value as any)}
                    className="flex-1 bg-white border border-outline-variant rounded p-1 text-[10px] outline-none"
                  >
                    <option value="name">Sort: Name</option>
                    <option value="athletes">Sort: Athletes</option>
                  </select>
                  <button
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    className="bg-white border border-outline-variant rounded p-1 text-[10px] flex items-center justify-center min-w-[40px] hover:bg-surface-container"
                  >
                    {sortOrder === "asc" ? "ASC" : "DESC"}
                  </button>
                </div>
              </div>
            </div>

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
                              {(cat.age_min !== null || cat.age_max !== null) && (
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
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 font-data-mono text-[11px]"><span className="material-symbols-outlined text-[14px] text-outline">group</span> {cat.athletes_count}</span>
                            </div>
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
                          <h4 className="font-headline-sm text-lg tracking-tight leading-none mb-1">{ring.name} History</h4>
                          <div className="flex gap-3 text-[10px] font-bold text-on-surface-variant uppercase">
                            <span>{ringCompletedQueues[ring.id]?.length || 0} Categories</span>
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">group</span> {ringCompletedQueues[ring.id]?.reduce((sum, cat) => sum + cat.athletes_count, 0) || 0} Athletes</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        className="p-1 rounded hover:bg-black/10 transition-colors flex items-center justify-center text-primary"
                        onClick={() => setHistoryOpenForRing(null)}
                        title="Back to Current"
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
                                <span className="text-[10px] font-bold text-secondary uppercase tracking-wider">{cat.age_bracket} | {cat.weight_class}</span>
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
                <Droppable key={ring.id} droppableId={ring.id}>
                  {(provided, snapshot) => (
                    <div 
                      className="w-72 shrink-0 flex flex-col bg-white border border-outline-variant rounded-xl overflow-hidden shadow-sm h-full"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                    >
                      <div className={`sticky top-0 z-10 p-4 flex justify-between items-center shrink-0 ${overloaded ? 'bg-error text-on-error' : 'bg-primary text-on-primary'}`}>
                        <div>
                          <h4 className="font-headline-sm text-lg tracking-tight leading-none mb-1">{ring.name}</h4>
                          <span className="text-[9px] font-label-caps opacity-80">{overloaded ? "OVERLOADED" : "OPTIMUM CAPACITY"}</span>
                        </div>
                        <div className="relative">
                          <button 
                            className="p-1 rounded hover:bg-white/20 transition-colors flex items-center justify-center"
                            onClick={() => setHistoryOpenForRing(ring.id)}
                            title="View Completed Categories"
                          >
                            <span className="material-symbols-outlined text-[20px]">history</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className={`p-4 border-b border-outline-variant flex flex-col items-center ${overloaded ? 'bg-error/5' : 'bg-secondary/5'}`}>
                        <span className={`text-[10px] font-label-caps font-bold mb-1 ${overloaded ? 'text-error' : 'text-secondary'}`}>CURRENT WORKLOAD</span>
                        <div className="flex items-center gap-4">
                          <span className={`font-data-mono text-3xl font-black leading-none ${overloaded ? 'text-error' : 'text-secondary'}`}>{calculateRingWorkload(ring.id)}</span>
                          <div className="h-6 w-[1px] bg-outline-variant/50"></div>
                          <span className={`flex items-center gap-1 font-data-mono text-xl font-black ${overloaded ? 'text-error' : 'text-secondary'}`}>
                            <span className="material-symbols-outlined text-[18px]">group</span> {calculateRingAthletes(ring.id)}
                          </span>
                        </div>
                      </div>
                      
                      <div className={`flex-1 overflow-y-auto p-3 space-y-3 ${snapshot.isDraggingOver ? 'bg-secondary/5' : ''}`}>
                        {ringQueues[ring.id]?.map((cat, index) => (
                          <Draggable key={cat.id} draggableId={cat.id} index={index}>
                            {(provided, snapshot) => (
                              <div 
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 bg-surface-container-lowest border ${snapshot.isDragging ? 'border-secondary shadow-lg' : 'border-outline-variant'} rounded-lg`}
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-[9px] font-bold text-secondary uppercase tracking-wider">{cat.age_bracket} | {cat.weight_class}</span>
                                  <span className="font-data-mono text-[10px] font-bold">{Math.ceil((cat.expected_matches * 109) / 60)}m</span>
                                </div>
                                <h5 className="text-xs font-bold text-primary mb-2">{cat.name}</h5>
                                <div className="flex gap-4 text-[10px] font-data-mono text-outline">
                                  <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">group</span> {cat.athletes_count}</span>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
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

      {/* Confirmation Modal */}
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
                You are about to move a category that was already assigned to a ring. Are you sure you want to proceed?
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
