import React from "react";
import { createClient } from "@/utils/supabase/server";
import ModeratorQueueClient from "@/components/moderator/ModeratorQueueClient";

export default async function ModeratorQueuePage({ params }: { params: Promise<{ ringId: string }> }) {
  const { ringId } = await params;
  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("category_assignments")
    .select("*, categories(name, expected_matches)")
    .eq("ring_id", ringId)
    .in("status", ["pending", "running", "paused"])
    .order("queue_order", { ascending: true });

  return <ModeratorQueueClient ringId={ringId} initialAssignments={assignments || []} />;
}
