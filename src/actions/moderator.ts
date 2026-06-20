"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "./admin";

export async function approveModeratorRequest(requestId: string, ringId: string, tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  // 1. Mark request as approved
  const { error: updateError } = await supabase
    .from("moderator_requests")
    .update({ status: "approved" })
    .eq("id", requestId);

  if (updateError) throw new Error(updateError.message);

  // 2. Generate a session token for the moderator
  // In a real app we might use JWTs, but for MVP we can use a secure random string stored in a session table
  // or we can just let the client poll for 'approved' status and store it in their local storage.
  // The PRD mentions they get an encrypted session cookie.
  // For now, approving it is enough for the client to proceed if they are polling or listening to Realtime!

  revalidatePath(`/admin/event/${tournamentId}/dashboard`);
}

export async function rejectModeratorRequest(requestId: string, tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  const { error: updateError } = await supabase
    .from("moderator_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);

  if (updateError) throw new Error(updateError.message);

  revalidatePath(`/admin/event/${tournamentId}/dashboard`);
}
