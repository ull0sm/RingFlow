"use client";

import React, { useState } from "react";
import { addRing, regenerateRingCode, deleteRing } from "@/actions/rings";

type Ring = {
  id: string;
  name: string;
  ring_order: number;
  access_code: string;
};

interface Props {
  tournamentId: string;
  initialRings: Ring[];
}

export default function RingsClient({ tournamentId, initialRings }: Props) {
  const [rings, setRings] = useState<Ring[]>(initialRings);
  const [isAdding, setIsAdding] = useState(false);
  const [loadingAction, setLoadingAction] = useState<string | null>(null); // ring id + action

  const handleAddRing = async () => {
    setIsAdding(true);
    try {
      await addRing(tournamentId);
      // Data revalidation happens via next.js, but since it's client state, we might need router.refresh() 
      // or we just rely on the server action revalidating path and Server Component sending down new props.
      // Wait, since we use useState for initialRings, it won't auto-update unless we sync it.
      // Easiest is to just use window.location.reload() or router.refresh() if using next/navigation.
    } catch (err) {
      alert("Failed to add ring.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRegenerate = async (ringId: string) => {
    setLoadingAction(`${ringId}-regen`);
    try {
      await regenerateRingCode(ringId, tournamentId);
    } catch (err) {
      alert("Failed to regenerate code.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = async (ringId: string) => {
    if (!confirm("Are you sure you want to delete this ring? Categories assigned to it will be unassigned.")) return;
    
    setLoadingAction(`${ringId}-delete`);
    try {
      await deleteRing(ringId, tournamentId);
    } catch (err) {
      alert("Failed to delete ring.");
    } finally {
      setLoadingAction(null);
    }
  };

  // Sync state with props
  React.useEffect(() => {
    setRings(initialRings);
  }, [initialRings]);

  return (
    <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8 bg-surface">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary">Ring Management</h2>
          <p className="text-body-sm text-on-surface-variant">Manage physical rings and their access codes.</p>
        </div>
        <button 
          onClick={handleAddRing} 
          disabled={isAdding}
          className="px-4 py-2 bg-primary text-white font-label-caps text-label-caps rounded flex items-center gap-2 hover:opacity-90 disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[18px]">add</span> {isAdding ? "ADDING..." : "ADD RING"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rings.map(ring => (
          <div key={ring.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-headline-sm text-lg text-primary font-bold">{ring.name}</h3>
                <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded text-[10px] font-label-caps">Ring {ring.ring_order}</span>
              </div>
              
              <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg mb-6 flex flex-col items-center">
                <span className="text-[10px] font-label-caps text-on-surface-variant mb-1">MODERATOR ACCESS CODE</span>
                <span className="font-data-mono text-3xl font-black text-secondary tracking-widest">{ring.access_code}</span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => handleRegenerate(ring.id)}
                disabled={loadingAction === `${ring.id}-regen`}
                className="flex-1 py-2 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded font-label-caps text-[10px] text-primary transition-colors flex justify-center items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">refresh</span> 
                {loadingAction === `${ring.id}-regen` ? "..." : "REGENERATE"}
              </button>
              <button 
                onClick={() => handleDelete(ring.id)}
                disabled={loadingAction === `${ring.id}-delete`}
                className="px-3 py-2 border border-error/50 text-error hover:bg-error/10 rounded transition-colors flex justify-center items-center disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">delete</span>
              </button>
            </div>
          </div>
        ))}

        {rings.length === 0 && (
          <div className="col-span-full p-8 text-center text-on-surface-variant italic border border-dashed border-outline-variant rounded-xl">
            No rings found for this tournament.
          </div>
        )}
      </div>
    </div>
  );
}
