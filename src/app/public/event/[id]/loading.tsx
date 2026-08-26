import React from "react";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-[#E1DDCF]/80 rounded-md ${className}`} />;
}

export default function PublicEventLoading() {
  return (
    <div className="min-h-screen bg-[#F5F3EC] py-10 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="mb-8 border-b border-[#E1DDCF] pb-6">
        <Skeleton className="w-24 h-4 mb-4" />
        <Skeleton className="w-3/4 max-w-md h-9 mb-3" />
        <div className="flex gap-4">
          <Skeleton className="w-28 h-4" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>

      {/* Search Bar Skeleton */}
      <Skeleton className="w-full h-12 rounded-xl mb-8 bg-[#E1DDCF]/60" />

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white border border-[#E1DDCF] rounded-xl p-5 flex flex-col justify-between h-64 shadow-sm"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="w-20 h-5" />
                <Skeleton className="w-14 h-5 rounded-full" />
              </div>
              <Skeleton className="w-full h-6 mb-2" />
              <Skeleton className="w-2/3 h-4 mb-6" />
              <Skeleton className="w-full h-2 rounded-full mb-2" />
            </div>
            <Skeleton className="w-full h-10 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
