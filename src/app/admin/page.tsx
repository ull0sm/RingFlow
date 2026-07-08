import React from "react";
import Link from "next/link";
import AdminHeader from "@/components/layout/AdminHeader";
import { createClient } from "@/utils/supabase/server";
import { ensureAdmin } from "@/actions/admin";

export default async function EventSelectionPage() {
  let adminId;
  let adminErrorStr = "";
  let tournaments: any[] = [];

  try {
    adminId = await ensureAdmin();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("tournaments")
      .select("*")
      .eq("admin_id", adminId)
      .order("created_at", { ascending: false });
      
    if (error) {
      console.error("Error fetching tournaments:", error);
    } else if (data) {
      tournaments = data;
    }
  } catch (err: any) {
    adminErrorStr = err.message;
  }

  return (
    <>
      <AdminHeader title="Select Tournament" />
      <div className="flex-1 overflow-y-auto p-margin-desktop bg-surface">
        <div className="max-w-7xl mx-auto w-full">
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="font-headline-lg text-headline-lg text-on-surface mb-2">Welcome back, Director</h1>
          </div>
          
          {adminErrorStr && (
            <div className="mb-8 p-4 bg-error/10 border border-error/20 rounded-lg text-error">
              <p className="font-bold">Error provisioning admin account:</p>
              <p>{adminErrorStr}</p>
            </div>
          )}

          {/* Primary Action Grid */}
          <div className="flex justify-center mb-16">
            <Link href="/admin/create" className="group relative overflow-hidden bg-primary-container text-white p-8 rounded-xl flex flex-col justify-between items-start transition-all hover:scale-[1.01] active:scale-[0.99] text-left w-full max-w-2xl">
              <div className="z-10">
                <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-white text-3xl">add_circle</span>
                </div>
                <h2 className="font-headline-sm text-headline-sm mb-2">Create New Tournament</h2>
                <p className="font-body-sm text-body-sm text-primary-fixed-dim max-w-xs opacity-80">
                  Configure categories, and set up tatamis for a new event.
                </p>
              </div>
              <div className="mt-8 flex items-center gap-2 font-label-caps text-label-caps uppercase tracking-widest text-secondary-fixed">
                Launch Setup Wizard <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </Link>
          </div>

          {/* Section Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-on-surface-variant">history</span>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">Select an Active Tournament</h3>
            </div>
          </div>

          {/* Tournament Grid */}
          <div className="flex justify-center mb-16 gap-6 flex-wrap">
            {tournaments.length === 0 && !adminErrorStr && (
              <div className="w-full text-center p-12 border border-dashed border-outline-variant rounded-xl text-on-surface-variant">
                <p>No tournaments found. Create one to get started!</p>
              </div>
            )}
            
            {tournaments.map((tournament) => (
              <Link key={tournament.id} href={`/admin/event/${tournament.id}/dashboard`} className="group w-full max-w-sm bg-surface-container-lowest border border-outline-variant hover:border-secondary transition-all cursor-pointer rounded-lg overflow-hidden flex flex-col">
                <div className="p-card-padding flex-grow">
                  <div className="flex justify-between items-start mb-4">
                    <span className={`px-2 py-1 font-label-caps text-label-caps rounded flex items-center gap-1 ${
                      tournament.status === 'active' ? 'bg-error-container text-on-error-container' : 
                      tournament.status === 'draft' ? 'bg-surface-container-highest text-on-surface-variant' : 
                      'bg-tertiary-fixed text-on-tertiary-fixed'
                    }`}>
                      {tournament.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></span>}
                      {tournament.status.toUpperCase()}
                    </span>
                    <span className="font-data-mono text-data-mono text-on-surface-variant">ID: {tournament.id.split('-')[0]}</span>
                  </div>
                  <h4 className="font-headline-sm text-headline-sm text-on-surface mb-1 group-hover:text-secondary transition-colors">{tournament.name}</h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">{tournament.event_date ? new Date(tournament.event_date).toLocaleDateString() : 'No date'} • {tournament.venue || 'No venue'}</p>
                </div>
                <div className="px-card-padding py-4 bg-surface-container-low border-t border-outline-variant flex justify-between items-center">
                  <span className="font-label-caps text-label-caps text-on-surface-variant">Enter Dashboard</span>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
