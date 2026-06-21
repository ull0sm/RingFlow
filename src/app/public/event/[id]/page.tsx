import React from "react";
import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import PublicEventClient from "@/components/public/PublicEventClient";

export default async function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const supabase = await createClient();

  const { data: rings } = await supabase
    .from("rings")
    .select("*")
    .eq("tournament_id", tournamentId)
    .order("ring_order", { ascending: true });

  const ringIds = rings?.map(r => r.id) || [];

  const [
    { data: tournament },
    { data: assignments },
    { data: categories }
  ] = await Promise.all([
    supabase.from("tournaments").select("*").eq("id", tournamentId).single(),
    supabase.from("category_assignments").select(`
      *,
      categories(name, athletes_count, expected_matches)
    `).in("ring_id", ringIds).order("queue_order", { ascending: true }),
    supabase.from("categories").select("*").eq("tournament_id", tournamentId)
  ]);

  if (!tournament) return notFound();

  return (
    <PublicEventClient 
      tournament={tournament} 
      initialRings={rings || []} 
      initialAssignments={assignments || []} 
      categories={categories || []}
    />
  );
}
