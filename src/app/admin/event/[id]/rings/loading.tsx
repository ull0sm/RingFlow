import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import { RingManagerCardSkeleton } from "@/components/ui/Skeleton";

export default function RingsLoading() {
  return (
    <>
      <AdminHeader title="Rings" />
      
      <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8 bg-surface">
        {/* Header Block */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-headline-sm text-headline-sm text-primary">Ring Management</h2>
            <p className="text-body-sm text-on-surface-variant">Manage physical rings and their access codes.</p>
          </div>
          <button 
            disabled 
            className="px-4 py-2 bg-primary/50 text-white/50 font-label-caps text-label-caps rounded flex items-center gap-2 select-none opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">add</span> ADD RING
          </button>
        </div>

        {/* Rings Manager Cards Grid Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <RingManagerCardSkeleton />
          <RingManagerCardSkeleton />
          <RingManagerCardSkeleton />
        </div>
      </div>
    </>
  );
}
