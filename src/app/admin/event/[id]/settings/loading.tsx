import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import { Skeleton } from "@/components/ui/Skeleton";

export default function SettingsLoading() {
  return (
    <>
      <AdminHeader title="Settings" />
      
      <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8 bg-surface">
        <div className="max-w-3xl">
          <div className="mb-8">
            <h2 className="font-headline-sm text-headline-sm text-primary">Tournament Configuration</h2>
            <p className="text-body-sm text-on-surface-variant">Update the core details of your event.</p>
          </div>

          <div className="space-y-8">
            {/* General Info Skeleton */}
            <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm space-y-6">
              <Skeleton className="w-48 h-5 mb-6" />
              
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <Skeleton className="w-32 h-3" />
                  <Skeleton className="w-full h-11" />
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-full h-11" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-full h-11" />
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
