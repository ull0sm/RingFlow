import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ModeratorCurrentLoading() {
  return (
    <div className="space-y-0">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary tracking-tight">Ring Controls</h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">Moderator Dashboard</p>
        </div>
        <Skeleton className="w-20 h-8 rounded-full" />
      </div>

      {/* Current Category Box Skeleton */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-card-padding shadow-sm relative overflow-hidden mb-10 h-[190px]">
        <div className="absolute top-0 left-0 w-1 h-full bg-outline"></div>
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2 w-3/4">
            <Skeleton className="w-28 h-3" />
            <Skeleton className="w-4/5 h-6" />
          </div>
          <Skeleton className="w-10 h-10 rounded-full" />
        </div>

        <div className="space-y-3 mt-6">
          <div className="flex justify-between items-center">
            <Skeleton className="w-32 h-4" />
            <Skeleton className="w-24 h-4" />
          </div>
          <Skeleton className="w-full h-2.5 rounded-full" />
          <Skeleton className="w-28 h-3" />
        </div>
      </div>

      {/* Match Adjustment Grid Skeleton */}
      <section className="space-y-4 mb-10">
        <Skeleton className="w-36 h-3 px-1" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </section>

      {/* Pause/Resume Button Skeleton */}
      <div className="pt-4 mb-10">
        <Skeleton className="w-full h-14 rounded-xl" />
      </div>
    </div>
  );
}
