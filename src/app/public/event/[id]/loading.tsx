import React from "react";
import { PublicRingCardSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function PublicEventLoading() {
  return (
    <div className="font-body-md text-on-background min-h-screen bg-surface">
      {/* Top Navigation Shell */}
      <header className="bg-surface-container-lowest border-b border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center h-16 px-4 md:px-margin-desktop">
        <div className="flex items-center gap-3 py-2">
          <span className="font-headline-lg text-headline-lg font-black text-primary tracking-tighter select-none">Ring Flow</span>
        </div>
      </header>

      <main className="px-4 md:px-margin-desktop max-w-7xl mx-auto py-6 mt-16">
        {/* Search & Info Bar */}
        <div className="flex flex-col space-y-4 mb-6 relative">
          <div className="flex items-center gap-3 py-6">
            <div className="w-3 h-3 rounded-full bg-secondary animate-pulse"></div>
            <Skeleton className="w-64 h-8" />
          </div>
          
          <div className="relative">
            <input 
              disabled
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-4 pl-12 pr-4 opacity-75 select-none pointer-events-none" 
              placeholder="Search athlete by name or chest number..." 
              type="text"
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          </div>
        </div>

        {/* Ring Mat Cards Skeletons */}
        <div className="space-y-6">
          <PublicRingCardSkeleton />
          <PublicRingCardSkeleton />
          <PublicRingCardSkeleton />
        </div>
      </main>
    </div>
  );
}
