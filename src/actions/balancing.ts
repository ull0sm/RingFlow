"use server";

import { createClient } from "@/utils/supabase/server";

export type AssignmentInput = {
  category_id: string;
  ring_id: string | null; // null means unassigned
  queue_order: number;
};

export async function saveAssignments(tournamentId: string, assignments: AssignmentInput[]) {
  const supabase = await createClient();

  // 1. Fetch all ring IDs for this tournament to clear existing assignments
  const { data: rings, error: ringsError } = await supabase
    .from("rings")
    .select("id")
    .eq("tournament_id", tournamentId);

  if (ringsError) {
    console.error("Error fetching rings:", ringsError);
    throw new Error("Failed to save assignments");
  }

  const ringIds = rings.map((r) => r.id);

  if (ringIds.length > 0) {
    // 2. Clear existing assignments for these rings
    const { error: deleteError } = await supabase
      .from("category_assignments")
      .delete()
      .in("ring_id", ringIds);

    if (deleteError) {
      console.error("Error clearing assignments:", deleteError);
      throw new Error("Failed to save assignments");
    }
  }

  // 3. Insert new assignments
  const validAssignments = assignments.filter((a) => a.ring_id !== null);

  if (validAssignments.length > 0) {
    const { error: insertError } = await supabase
      .from("category_assignments")
      .insert(
        validAssignments.map((a) => ({
          ring_id: a.ring_id,
          category_id: a.category_id,
          queue_order: a.queue_order,
          status: "pending", // default status
        }))
      );

    if (insertError) {
      console.error("Error inserting assignments:", insertError);
      throw new Error("Failed to save assignments");
    }
  }

  return { success: true };
}
