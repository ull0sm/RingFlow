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

  // 3. Perform upsert operations first. If this fails, the delete step is never reached.
  if (validAssignments.length > 0) {
    const { error: upsertError } = await supabase
      .from("category_assignments")
      .upsert(
        validAssignments.map((a) => ({
          ring_id: a.ring_id,
          category_id: a.category_id,
          queue_order: a.queue_order,
          status: a.status || "pending",
          completed_at: a.completed_at || null,
          tournament_id: tournamentId,
        })),
        { onConflict: "category_id" }
      );

    if (upsertError) {
      console.error("Error upserting assignments:", upsertError);
      throw new Error("Failed to save assignments");
    }
  }

  // 4. Remove assignments that were unassigned or moved out of the rings
  if (ringIds.length > 0) {
    const assignedIds = validAssignments.map((a) => a.category_id);
    let query = supabase.from("category_assignments").delete().in("ring_id", ringIds);
    if (assignedIds.length > 0) {
      query = query.not("category_id", "in", `(${assignedIds.join(",")})`);
    }

    const { error: deleteError } = await query;
    if (deleteError) {
      console.error("Error clearing old assignments:", deleteError);
      throw new Error("Failed to save assignments");
    }
  }

  return { success: true };
}
