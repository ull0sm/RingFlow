import React from "react";
import { createClient } from "@/utils/supabase/server";
import ModeratorCurrentClient from "@/components/moderator/ModeratorCurrentClient";

export default async function ModeratorCurrentPage({ params }: { params: Promise<{ ringId: string }> }) {
  const { ringId } = await params;
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("category_assignments")
    .select("*, categories(name, expected_matches)")
    .eq("ring_id", ringId)
    .in("status", ["pending", "running", "paused", "completed"])
    .order("queue_order", { ascending: true });

  const { data: allAthletes } = await supabase
    .from("athletes")
    .select("*");

  return <ModeratorCurrentClient ringId={ringId} initialAssignments={assignments || []} allAthletes={allAthletes || []} />;
}
