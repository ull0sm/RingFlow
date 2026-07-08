import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import { StatsCardSkeleton, RingCardSkeleton, LiveActivityFeedSkeleton, ModeratorRequestsSkeleton } from "@/components/ui/Skeleton";

export default function AdminDashboardLoading() {
  return (
    <>
      <AdminHeader title="Overview" />
      
      <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8">
        {/* Stats Grid Skeletons */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <StatsCardSkeleton />
          <StatsCardSkeleton />
          <StatsCardSkeleton hasProgress={true} />
        </section>

        {/* Main Grid: Rings Status & Sidebar Widgets */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Rings Grid Overview */}
          <div className="xl:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-primary font-bold">Live Tatami Status</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              <RingCardSkeleton />
              <RingCardSkeleton />
              <RingCardSkeleton />
              <RingCardSkeleton />
              <RingCardSkeleton />
              <RingCardSkeleton />
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-8">
            <LiveActivityFeedSkeleton />
            <ModeratorRequestsSkeleton />
          </div>
        </div>
      </div>
    </>
  );
}
