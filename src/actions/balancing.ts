"use server";

import { createClient } from "@/utils/supabase/server";

export type AssignmentInput = {
  category_id: string;
  ring_id: string | null; // null means unassigned
  queue_order: number;
  status?: string;
  completed_at?: string | null;
};

export async function saveAssignments(tournamentId: string, assignments: AssignmentInput[]) {
  const supabase = await createClient();

  // 1. Validate payload for duplicate category IDs to prevent constraints violations
  const seen = new Set<string>();
  const validAssignments = assignments.filter((a) => a.ring_id !== null);
  for (const a of validAssignments) {
    if (seen.has(a.category_id)) {
      console.error("Duplicate category_id in assignments payload:", a.category_id);
      throw new Error("Duplicate category assignment detected in payload");
    }
    seen.add(a.category_id);
  }

  // 2. Fetch all ring IDs for this tournament
  const { data: rings, error: ringsError } = await supabase
    .from("rings")
    .select("id")
    .eq("tournament_id", tournamentId);

  if (ringsError) {
    console.error("Error fetching rings:", ringsError);
    throw new Error("Failed to save assignments");
  }

  const ringIds = rings.map((r) => r.id);

  // 3. Delete existing assignments for these rings first to prevent (ring_id, queue_order) unique constraint violations on update/swap
  if (ringIds.length > 0) {
    const { error: deleteError } = await supabase
      .from("category_assignments")
      .delete()
      .in("ring_id", ringIds);

    if (deleteError) {
      console.error("Error clearing old assignments:", deleteError);
      throw new Error("Failed to save assignments");
    }
  }

  // 4. Insert new assignments
  if (validAssignments.length > 0) {
    const { error: insertError } = await supabase
      .from("category_assignments")
      .insert(
        validAssignments.map((a) => ({
          ring_id: a.ring_id,
          category_id: a.category_id,
          queue_order: a.queue_order,
          status: a.status || "pending",
          completed_at: a.completed_at || null,
        }))
      );

    if (insertError) {
      console.error("Error inserting assignments:", insertError);
      throw new Error("Failed to save assignments");
    }
  }

  return { success: true };
}
