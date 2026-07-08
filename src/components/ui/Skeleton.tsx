import React from "react";

// 1. Base Skeleton component with subtle pulse animation
export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-surface-container-high rounded-md ${className}`} />
  );
}

// 2. Tournament Overview Card Skeleton (Select Tournament Page)
export function TournamentCardSkeleton() {
  return (
    <div className="w-full max-w-sm bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden flex flex-col h-[208px]">
      <div className="p-card-padding flex-grow">
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="w-16 h-5" />
          <Skeleton className="w-16 h-4" />
        </div>
        <Skeleton className="w-3/4 h-6 mb-2" />
        <Skeleton className="w-1/2 h-4 mb-6" />
      </div>
      <div className="px-card-padding py-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center h-[53px]">
        <Skeleton className="w-24 h-4" />
        <Skeleton className="w-5 h-5 rounded-full" />
      </div>
    </div>
  );
}

// 3. Stats Card Skeleton (Total Categories, Completed Matches, etc.)
export function StatsCardSkeleton({ hasProgress = false }: { hasProgress?: boolean }) {
  return (
    <div className="bg-surface-container-lowest p-card-padding border border-outline-variant rounded-lg flex flex-col justify-between shadow-sm min-h-[142px]">
      <div className="flex justify-between items-start">
        <Skeleton className="w-28 h-4" />
        <Skeleton className="w-6 h-6 rounded-full" />
      </div>
      {hasProgress ? (
        <div className="mt-6">
          <Skeleton className="w-full h-2 rounded-full mb-3" />
          <div className="flex justify-between">
            <Skeleton className="w-12 h-4" />
            <Skeleton className="w-16 h-4" />
          </div>
        </div>
      ) : (
        <div className="mt-4">
          <Skeleton className="w-16 h-8 mb-2" />
          <Skeleton className="w-32 h-4" />
        </div>
      )}
    </div>
  );
}

// 4. Live Ring Status Card Skeleton (Dashboard View)
export function RingCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest border-l-4 border-outline p-card-padding border border-outline-variant rounded shadow-sm flex flex-col justify-between h-[230px]">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline opacity-40 select-none">drag_indicator</span>
            <Skeleton className="w-20 h-5" />
          </div>
          <Skeleton className="w-14 h-5 rounded" />
        </div>
        
        <Skeleton className="w-3/4 h-5 mb-3" />
        
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="w-24 h-4" />
          <Skeleton className="w-12 h-4" />
        </div>
      </div>
      
      <div>
        <Skeleton className="w-full bg-surface-container h-1 rounded-full mb-4" />
        
        <div className="flex justify-between items-center mt-4 pt-4 border-t border-outline-variant">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-5 h-5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// 5. Live Activity Feed Skeleton
export function LiveActivityFeedSkeleton() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col h-96">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0 rounded-t-xl">
        <h3 className="font-label-caps text-label-caps text-primary font-bold">Live Activity Feed</h3>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Skeleton className="w-4 h-4 rounded-full" />
              <Skeleton className="w-16 h-3" />
            </div>
            <Skeleton className="w-11/12 h-4" />
            <Skeleton className="w-5/6 h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}

// 6. Moderator Requests Widget Skeleton
export function ModeratorRequestsSkeleton() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col h-96">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0 rounded-t-xl">
        <h3 className="font-label-caps text-label-caps text-primary font-bold">Moderator Requests</h3>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="p-3 border border-outline-variant rounded-lg bg-surface flex flex-col gap-3 shadow-sm">
            <div className="w-full">
              <div className="flex justify-between items-start w-full mb-2">
                <Skeleton className="w-20 h-3" />
                <Skeleton className="w-12 h-3" />
              </div>
              <Skeleton className="w-28 h-4 mb-2" />
              <div className="bg-surface-container-lowest p-2 rounded border border-outline-variant mt-1 space-y-1.5">
                <Skeleton className="w-11/12 h-3" />
                <Skeleton className="w-5/6 h-3" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-6 rounded" />
              <Skeleton className="flex-1 h-6 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 7. Generic Table Row Skeleton for loading tabular lists
export function TableRowSkeleton({ cols = 4 }: { cols?: number }) {
  return (
    <tr className="hover:bg-surface-container-low transition-colors">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton 
            className={`h-5 ${
              i === 0 ? "w-32" : i === 1 ? "w-48" : i === 2 ? "w-24" : "w-16 ml-auto"
            }`} 
          />
        </td>
      ))}
    </tr>
  );
}

// 8. Ring Manager Card Skeleton (Ring Management Page)
export function RingManagerCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm flex flex-col justify-between h-[216px]">
      <div>
        <div className="flex justify-between items-start mb-4">
          <Skeleton className="w-24 h-6" />
          <Skeleton className="w-16 h-4" />
        </div>
        
        <div className="p-4 bg-surface-container-low border border-outline-variant rounded-lg mb-6 flex flex-col items-center">
          <Skeleton className="w-36 h-3 mb-2" />
          <Skeleton className="w-20 h-7" />
        </div>
      </div>
      
      <div className="flex gap-3">
        <Skeleton className="flex-1 h-8 rounded" />
      </div>
    </div>
  );
}

// 9. Public Dashboard Ring Card Skeleton
export function PublicRingCardSkeleton() {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
      <div className="bg-surface-container-highest text-on-surface px-5 py-3 flex justify-between items-center">
        <Skeleton className="w-24 h-6" />
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
      
      <div className="p-5">
        <div className="mb-4">
          <Skeleton className="w-48 h-6 mb-2" />
          <Skeleton className="w-36 h-4" />
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <Skeleton className="w-28 h-3" />
            <Skeleton className="w-32 h-3" />
          </div>
          <Skeleton className="h-1.5 w-full bg-surface-container rounded-full" />
        </div>
        
        <div className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-3" />
            <Skeleton className="w-24 h-4" />
          </div>
          <Skeleton className="w-5 h-5 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// 10. Moderator Category Queue Item Skeleton
export function ModeratorQueueSkeleton() {
  return (
    <div className="p-4 bg-surface-container-lowest border border-outline-variant rounded-lg flex items-center justify-between shadow-sm">
      <div className="space-y-2">
        <Skeleton className="w-40 h-5" />
        <Skeleton className="w-24 h-4" />
      </div>
      <Skeleton className="w-12 h-6 rounded" />
    </div>
  );
}
