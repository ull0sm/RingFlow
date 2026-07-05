import React from "react";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import RingBalancingClient from "./RingBalancingClient";

export default async function RingBalancingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const supabase = await createClient();

  const [
    { data: tournament, error: tournamentError },
    { data: categories },
    { data: rings }
  ] = await Promise.all([
    supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
    supabase.from("categories").select("id, name, age_bracket, weight_class, athletes_count, expected_matches, belt, age_min, age_max, sex, day").eq("tournament_id", tournamentId).order("created_at", { ascending: false }),
    supabase.from("rings").select("*").eq("tournament_id", tournamentId).order("ring_order", { ascending: true })
  ]);

  if (tournamentError || !tournament) {
    redirect("/admin");
  }

  // Fetch assignments for these rings
  const ringIds = rings?.map(r => r.id) || [];
  let assignments: any[] = [];
  let completedTimes: Record<string, string> = {};
  
  if (ringIds.length > 0) {
    const { data: assignmentData } = await supabase
      .from("category_assignments")
      .select("*")
      .in("ring_id", ringIds);
      
    if (assignmentData) assignments = assignmentData;

    // Fetch completion times from event_log
    const { data: eventLogData } = await supabase
      .from("event_log")
      .select("category_id, created_at")
      .eq("action", "FINISH_CATEGORY")
      .in("ring_id", ringIds);
      
    if (eventLogData) {
      eventLogData.forEach(log => {
        if (log.category_id) {
          completedTimes[log.category_id] = log.created_at;
        }
      });
    }
  }

  return (
    <RingBalancingClient 
      tournamentId={tournamentId}
      tournamentName={tournament.name}
      initialCategories={categories || []}
      initialRings={rings || []}
      initialAssignments={assignments}
      completedTimes={completedTimes}
    />
  );
}
