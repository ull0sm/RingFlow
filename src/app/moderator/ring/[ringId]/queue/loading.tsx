import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ModeratorQueueLoading() {
  return (
    <div className="space-y-6">
      {/* Current Category Section Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">CURRENT</h2>
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
        <div className="bg-surface-container-lowest border-l-4 border-secondary border-t border-r border-b border-outline-variant rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 p-8 h-[132px]">
          <div className="flex items-center gap-6">
            <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
            <div className="space-y-2">
              <Skeleton className="w-48 h-6" />
              <Skeleton className="w-32 h-4" />
            </div>
          </div>
          <Skeleton className="w-28 h-10 rounded-lg shrink-0" />
        </div>
      </div>

      {/* Up Next List Skeleton */}
      <div className="space-y-4 pt-8">
        <div className="flex items-center justify-between">
          <h2 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest uppercase">UP NEXT</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-surface-container-low border border-outline-variant rounded-xl p-5 flex items-center justify-between h-[82px]">
              <div className="flex items-center gap-6 w-3/4">
                <Skeleton className="w-4 h-4 rounded shrink-0" />
                <div className="space-y-2 w-full">
                  <Skeleton className="w-2/3 h-5" />
                  <Skeleton className="w-20 h-4" />
                </div>
              </div>
              <div className="flex flex-col gap-1 shrink-0">
                <Skeleton className="w-8 h-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
