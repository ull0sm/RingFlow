import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AthletesClient from "@/components/admin/AthletesClient";

export default async function AdminAthletes({ params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const supabase = await createClient();

  const [
    { data: tournament },
    { data: athletes },
    { data: categories }
  ] = await Promise.all([
    supabase.from("tournaments").select("name").eq("id", tournamentId).single(),
    supabase.from("athletes").select("*, categories(name)").eq("categories.tournament_id", tournamentId).order("created_at", { ascending: false }),
    supabase.from("categories").select("id, name").eq("tournament_id", tournamentId).order("name", { ascending: true })
  ]);

  if (!tournament) redirect("/admin");

  // Supabase filtering on foreign tables can sometimes return athletes where categories is null if they don't match.
  // We'll filter them just in case.
  const validAthletes = athletes?.filter(a => a.categories !== null) || [];

  return (
    <>
      <AdminHeader title="Athletes Roster" eventName={tournament.name} />
      <AthletesClient 
        tournamentId={tournamentId} 
        initialAthletes={validAthletes} 
        categories={categories || []} 
      />
    </>
  );
}
