import React from "react";
import { Skeleton } from "@/components/ui/Skeleton";

export default function ModeratorControlsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div className="space-y-2">
          <Skeleton className="w-48 h-8" />
          <Skeleton className="w-32 h-4" />
        </div>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm space-y-6">
        <Skeleton className="w-full h-12 rounded" />
        <Skeleton className="w-full h-12 rounded" />
        <Skeleton className="w-full h-12 rounded" />
      </div>
    </div>
  );
}
