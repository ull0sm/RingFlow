import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function RingBalancingLoading() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      {/* Top Header Panel */}
      <header className="bg-surface-container-lowest border-b border-outline-variant px-margin-desktop h-16 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-24 h-4" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-32 h-9 rounded" />
        </div>
      </header>

      {/* Main Board Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column - Unassigned Categories */}
        <aside className="w-80 bg-surface-container-lowest border-r border-outline-variant flex flex-col shrink-0">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low">
            <Skeleton className="w-32 h-5 mb-3" />
            <div className="space-y-2">
              <Skeleton className="w-full h-9 rounded" />
              <div className="grid grid-cols-3 gap-2">
                <Skeleton className="h-8 rounded" />
                <Skeleton className="h-8 rounded" />
                <Skeleton className="h-8 rounded" />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 border border-outline-variant rounded bg-surface space-y-2">
                <Skeleton className="w-5/6 h-4" />
                <div className="flex justify-between items-center mt-2">
                  <Skeleton className="w-16 h-3" />
                  <Skeleton className="w-10 h-3" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* Right Columns - Rings Queues */}
        <main className="flex-grow flex overflow-x-auto p-6 gap-6 items-start bg-surface">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-80 shrink-0 flex flex-col max-h-full bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm">
              <div className="p-4 bg-surface-container-low border-b border-outline-variant flex justify-between items-center rounded-t-xl shrink-0">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-20 h-5" />
                </div>
                <Skeleton className="w-10 h-4" />
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto space-y-3 min-h-[400px]">
                {[1, 2].map((j) => (
                  <div key={j} className="p-3 border border-outline-variant rounded bg-surface space-y-2">
                    <Skeleton className="w-4/5 h-4" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="w-12 h-3" />
                      <Skeleton className="w-8 h-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </main>
      </div>
    </div>
  );
}
