import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import { TournamentCardSkeleton } from "@/components/ui/Skeleton";

export default function SelectTournamentLoading() {
  return (
    <>
      <AdminHeader title="Select Tournament" />
      <div className="flex-1 overflow-y-auto p-margin-desktop bg-surface">
        <div className="max-w-7xl mx-auto w-full">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Welcome back, Director</h1>
          </div>
          
          {/* Primary Action Grid (Static and interactive immediately) */}
          <div className="flex justify-center mb-16">
            <div className="relative overflow-hidden bg-primary-container text-white p-8 rounded-xl flex flex-col justify-between items-start text-left w-full max-w-2xl opacity-80 select-none">
              <div>
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-white text-3xl">add_circle</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm mb-2">Create New Tournament</h2>
                <p className="font-body-sm text-body-sm text-primary-fixed-dim max-w-xs opacity-80">
                  Configure categories, and set up rings for a new event.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 font-label-caps text-label-caps uppercase tracking-widest text-secondary-fixed">
                Launch Setup Wizard <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">history</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Select an Active Tournament</h3>
            </div>
          </div>

          {/* Tournament Grid Skeletons */}
          <div className="flex justify-center mb-16 gap-6 flex-wrap">
            <TournamentCardSkeleton />
            <TournamentCardSkeleton />
            <TournamentCardSkeleton />
          </div>
        </div>
      </div>
    </>
  );
}
