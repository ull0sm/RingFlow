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
    supabase.from("categories").select("*").eq("tournament_id", tournamentId),
    supabase.from("rings").select("*").eq("tournament_id", tournamentId).order("ring_order", { ascending: true })
  ]);

  if (tournamentError || !tournament) {
    redirect("/admin");
  }

  // Fetch assignments for these rings
  const ringIds = rings?.map(r => r.id) || [];
  let assignments: any[] = [];
  
  if (ringIds.length > 0) {
    const { data: assignmentData } = await supabase
      .from("category_assignments")
      .select("*")
      .in("ring_id", ringIds);
      
    if (assignmentData) assignments = assignmentData;
  }

  return (
    <RingBalancingClient 
      tournamentId={tournamentId}
      tournamentName={tournament.name}
      initialCategories={categories || []}
      initialRings={rings || []}
      initialAssignments={assignments}
    />
  );
}
