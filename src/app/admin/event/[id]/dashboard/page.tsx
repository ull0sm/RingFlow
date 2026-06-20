import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import RingCard from "@/components/admin/RingCard";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import LiveActivityFeed from "@/components/admin/LiveActivityFeed";
import ModeratorRequestsWidget from "@/components/admin/ModeratorRequestsWidget";

export default async function AdminDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const supabase = await createClient();

  // 1. Fetch Tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament) {
    redirect("/admin"); // or show error
  }

  // 2. Fetch Categories stats
  const { count: categoryCount } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  // 3. Fetch Rings
  const { data: rings } = await supabase
    .from("rings")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("ring_order", { ascending: true });

  const ringIds = rings?.map(r => r.id) || [];

  // 4. Fetch Moderator Requests
  let modRequests: any[] = [];
  if (ringIds.length > 0) {
    const { data: reqs } = await supabase
      .from("moderator_requests")
      .select("*, rings(name)")
      .in("ring_id", ringIds)
      .order("created_at", { ascending: false })
      .limit(20);
    if (reqs) modRequests = reqs;
  }

  // 5. Fetch Event Logs
  const { data: logs } = await supabase
    .from("event_log")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false })
    .limit(50);

  // For MVP: total matches logic
  // Since we don't have event_log fully populated yet, we'll use placeholder 0s for progress.
  const totalMatches = 0; // calculate later
  const completedMatches = 0; // calculate later
  const progressPercent = 0;

  return (
    <>
      <AdminHeader title="Overview" eventName={tournament.name} />
      
      <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8">
        {/* Global Tournament Stats */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          <div className="bg-surface-container-lowest p-card-padding border border-outline-variant rounded-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Total Categories</span>
              <span className="material-symbols-outlined text-secondary">category</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg">{categoryCount || 0}</span>
              <p className="text-body-sm text-on-surface-variant mt-1">Ready for deployment</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest p-card-padding border border-outline-variant rounded-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Completed Matches</span>
              <span className="material-symbols-outlined text-on-secondary-fixed-variant">check_circle</span>
            </div>
            <div className="mt-4">
              <span className="font-headline-lg text-headline-lg">{completedMatches} / {totalMatches}</span>
              <p className="text-body-sm text-on-surface-variant mt-1">~0% Completion rate</p>
            </div>
          </div>
          
          <div className="bg-surface-container-lowest p-card-padding border border-outline-variant rounded-lg">
            <div className="flex justify-between items-start">
              <span className="font-label-caps text-label-caps text-on-surface-variant">Overall Progress</span>
              <span className="material-symbols-outlined text-secondary">speed</span>
            </div>
            <div className="mt-6">
              <div className="w-full bg-surface-container-highest h-2 rounded-full overflow-hidden">
                <div className="bg-secondary h-full" style={{ width: `${progressPercent}%` }}></div>
              </div>
              <div className="flex justify-between mt-2">
                <span className="font-data-mono text-data-mono text-secondary">{progressPercent.toFixed(1)}%</span>
                <span className="font-data-mono text-data-mono text-on-surface-variant">{totalMatches - completedMatches} Remaining</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Rings Grid Overview */}
          <div className="xl:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-headline-sm text-headline-sm text-primary">Live Ring Status</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
              {rings?.map((ring) => (
                 <RingCard 
                   key={ring.id}
                   name={ring.name} 
                   status="Empty" 
                 />
              ))}
              
              {/* Add Ring Placeholder */}
              <button className="bg-surface-container border border-dashed border-outline-variant rounded flex flex-col items-center justify-center p-card-padding hover:bg-surface-container-high transition-colors group">
                <span className="material-symbols-outlined text-outline group-hover:text-secondary mb-2" style={{ fontSize: '32px' }}>add_circle</span>
                <span className="font-label-caps text-label-caps text-on-surface-variant">Deploy New Ring</span>
              </button>
            </div>
          </div>

          {/* Sidebar Widgets */}
          <div className="space-y-8">
            <ModeratorRequestsWidget tournamentId={tournamentId} initialRequests={modRequests} />
            <LiveActivityFeed tournamentId={tournamentId} initialLogs={logs || []} />
          </div>
        </div>
      </div>
    </>
  );
}
