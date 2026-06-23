import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import RingCard from "@/components/admin/RingCard";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";
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

  // Fetch Category Assignments
  const { data: assignments } = await supabase
    .from("category_assignments")
    .select("*, categories(name, expected_matches)")
    .in("ring_id", ringIds)
    .in("status", ["running", "paused", "pending"])
    .order("queue_order", { ascending: true });

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

  // Prepare assignments data joined with categories for client
  const fullAssignments = await Promise.all(assignments?.map(async (a) => {
    const { data: cat } = await supabase.from("categories").select("*").eq("id", a.category_id).single();
    return { ...a, categories: cat };
  }) || []);

  return (
    <AdminDashboardClient 
      tournament={tournament}
      categoryCount={categoryCount}
      initialRings={rings}
      initialAssignments={fullAssignments}
      initialModRequests={modRequests}
      initialLogs={logs}
    />
  );
}

