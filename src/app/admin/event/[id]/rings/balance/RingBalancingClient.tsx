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
};

interface Props {
  tournamentId: string;
  tournamentName: string;
  initialCategories: Category[];
  initialRings: Ring[];
  initialAssignments: Assignment[];
}

export default function RingBalancingClient({ tournamentId, tournamentName, initialCategories, initialRings, initialAssignments }: Props) {
  // State structure:
  // We need a list for "unassigned" and a list for each ring.
  const [unassigned, setUnassigned] = useState<Category[]>([]);
  const [ringQueues, setRingQueues] = useState<Record<string, Category[]>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(new Date());

  // Initialize state from props
  useEffect(() => {
    const ringMap: Record<string, Category[]> = {};
    initialRings.forEach(r => {
      ringMap[r.id] = [];
    });

    const unassignedList: Category[] = [];

    initialCategories.forEach(cat => {
      const assignment = initialAssignments.find(a => a.category_id === cat.id);
      if (assignment && ringMap[assignment.ring_id]) {
        ringMap[assignment.ring_id].push(cat);
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
  }, [initialCategories, initialRings, initialAssignments]);

  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      return;
    }

    let sourceList = source.droppableId === "unassigned" ? [...unassigned] : [...ringQueues[source.droppableId]];
    let destList = destination.droppableId === "unassigned" ? [...unassigned] : [...ringQueues[destination.droppableId]];

    const [movedItem] = sourceList.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceList.splice(destination.index, 0, movedItem);
      if (source.droppableId === "unassigned") {
        setUnassigned(sourceList);
      } else {
        setRingQueues({ ...ringQueues, [source.droppableId]: sourceList });
      }
    } else {
      destList.splice(destination.index, 0, movedItem);
      if (source.droppableId === "unassigned") {
        setUnassigned(sourceList);
      } else {
        setRingQueues({ ...ringQueues, [source.droppableId]: sourceList });
      }

      if (destination.droppableId === "unassigned") {
        setUnassigned(destList);
      } else {
        setRingQueues({ ...ringQueues, [destination.droppableId]: destList });
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = [];

    // Process unassigned
    unassigned.forEach((cat, idx) => {
      payload.push({ category_id: cat.id, ring_id: null, queue_order: idx });
    });

    // Process rings
    Object.keys(ringQueues).forEach(ringId => {
      ringQueues[ringId].forEach((cat, idx) => {
        payload.push({ category_id: cat.id, ring_id: ringId, queue_order: idx });
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
    // Rough estimate: 3 mins per match
    const minutes = totalMatches * 3;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const isOverloaded = (ringId: string) => {
    const categories = ringQueues[ringId] || [];
    const totalMatches = categories.reduce((sum, cat) => sum + cat.expected_matches, 0);
    return totalMatches * 3 > 360; // > 6 hours
  };

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
          <section className="w-80 flex flex-col bg-surface-container-lowest border-r border-outline-variant shrink-0">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h3 className="font-label-caps text-label-caps text-primary">Unassigned Categories</h3>
              <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded font-data-mono text-[10px]">{unassigned.length} ITEMS</span>
            </div>

            <Droppable droppableId="unassigned">
              {(provided, snapshot) => (
                <div 
                  ref={provided.innerRef} 
                  {...provided.droppableProps}
                  className={`flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-lowest ${snapshot.isDraggingOver ? 'bg-secondary/5' : ''}`}
                >
                  {unassigned.map((cat, index) => (
                    <Draggable key={cat.id} draggableId={cat.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`p-4 bg-white border ${snapshot.isDragging ? 'border-secondary shadow-lg' : 'border-outline-variant shadow-sm'} rounded-xl cursor-grab active:cursor-grabbing`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <span className="px-2 py-0.5 bg-surface-container text-on-surface rounded font-label-caps text-[10px] font-bold">
                              {cat.age_bracket || "OPEN"} | {cat.weight_class || "OPEN"}
                            </span>
                            <span className="material-symbols-outlined text-outline-variant text-sm">drag_indicator</span>
                          </div>
                          <h4 className="font-headline-sm text-sm text-primary mb-3">{cat.name}</h4>
                          <div className="flex items-center justify-between pt-3 border-t border-outline-variant/30">
                            <div className="flex items-center gap-3">
                              <span className="flex items-center gap-1 font-data-mono text-[11px]"><span className="material-symbols-outlined text-[14px] text-outline">group</span> {cat.athletes_count}</span>
                            </div>
                            <span className="font-data-mono text-xs font-bold px-2 py-0.5 bg-primary text-on-primary rounded">{cat.expected_matches * 3}m</span>
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
                      </div>
                      
                      <div className={`p-4 border-b border-outline-variant flex flex-col items-center ${overloaded ? 'bg-error/5' : 'bg-secondary/5'}`}>
                        <span className={`text-[10px] font-label-caps font-bold mb-1 ${overloaded ? 'text-error' : 'text-secondary'}`}>CURRENT WORKLOAD</span>
                        <span className={`font-data-mono text-3xl font-black leading-none ${overloaded ? 'text-error' : 'text-secondary'}`}>{calculateRingWorkload(ring.id)}</span>
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
                                  <span className="font-data-mono text-[10px] font-bold">{cat.expected_matches * 3}m</span>
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
              {lastSaved ? `Last saved at ${lastSaved.toLocaleTimeString()}` : "Not saved yet"}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
