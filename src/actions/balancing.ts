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

  // 1. Validate payload for duplicate category IDs
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

  // 3. Fetch current live assignments to preserve matches_completed and guard running categories
  const { data: currentAssignments } = await supabase
    .from("category_assignments")
    .select("category_id, ring_id, status, matches_completed, completed_at")
    .in("ring_id", ringIds);

  const currentMap = new Map<string, { status: string; matches_completed: number; completed_at: string | null }>();
  (currentAssignments || []).forEach((a: any) => {
    currentMap.set(a.category_id, {
      status: a.status,
      matches_completed: a.matches_completed || 0,
      completed_at: a.completed_at || null,
    });
  });

  // 4. Guard: reject if a running/paused category is not at queue_order 0
  //    (means something was inserted above it, which would interrupt the moderator)
  for (const a of validAssignments) {
    const live = currentMap.get(a.category_id);
    if (live && (live.status === "running" || live.status === "paused")) {
      if (a.queue_order !== 0) {
        throw new Error(`RUNNING_CATEGORY_DISPLACED:${a.category_id}`);
      }
    }
  }

  // 5. Remove categories that were moved out of all rings (now unassigned)
  const incomingCategoryIds = new Set(validAssignments.map((a) => a.category_id));
  const toDelete = Array.from(currentMap.keys()).filter((catId) => !incomingCategoryIds.has(catId));

  if (toDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from("category_assignments")
      .delete()
      .in("category_id", toDelete);

    if (deleteError) {
      console.error("Error deleting removed assignments:", deleteError);
      throw new Error("Failed to save assignments");
    }
  }

  // 6. Non-destructive update/insert: update existing rows by category_id to PRESERVE assignment ID UUIDs!
  if (validAssignments.length > 0) {
    const rows = validAssignments.map((a) => {
      const live = currentMap.get(a.category_id);
      return {
        ring_id: a.ring_id,
        category_id: a.category_id,
        queue_order: a.queue_order,
        status:
          live?.status === "running" || live?.status === "paused"
            ? live.status
            : (a.status === "completed" ? "completed" : (live?.status || a.status || "pending")),
        matches_completed: live?.matches_completed ?? 0,
        completed_at:
          a.status === "completed"
            ? (live?.completed_at || a.completed_at || new Date().toISOString())
            : (live?.completed_at || null),
      };
    });

    const existingRows = rows.filter((r) => currentMap.has(r.category_id));
    const newRows = rows.filter((r) => !currentMap.has(r.category_id));

    // Stage A: Set negative temporary queue_order for existing rows to avoid transient (ring_id, queue_order) unique constraint conflicts
    if (existingRows.length > 0) {
      await Promise.all(
        existingRows.map((r, idx) =>
          supabase
            .from("category_assignments")
            .update({ queue_order: -(idx + 5000) })
            .eq("category_id", r.category_id)
        )
      );

      // Stage B: Update existing rows with final values by category_id in-place
      await Promise.all(
        existingRows.map((r) =>
          supabase
            .from("category_assignments")
            .update({
              ring_id: r.ring_id,
              queue_order: r.queue_order,
              status: r.status,
              matches_completed: r.matches_completed,
              completed_at: r.completed_at,
            })
            .eq("category_id", r.category_id)
        )
      );
    }

    // Stage C: Insert new rows for newly assigned categories
    if (newRows.length > 0) {
      const { error: insertError } = await supabase
        .from("category_assignments")
        .insert(newRows);

      if (insertError) {
        console.error("Error inserting new assignments:", insertError);
        throw new Error("Failed to save assignments");
      }
    }
  }

  return { success: true };
}
