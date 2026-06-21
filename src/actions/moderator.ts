"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { ensureAdmin } from "./admin";

export async function approveModeratorRequest(requestId: string, ringId: string, tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  const sessionToken = crypto.randomUUID();

  // 1. Mark request as approved
  const { error: updateError } = await supabase
    .from("moderator_requests")
    .update({ status: "approved", session_token: sessionToken })
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

export async function requestModeratorAccess(accessCode: string) {
  const supabase = await createClient();

  // 1. Find the ring by access code
  const { data: ring, error: ringError } = await supabase
    .from("rings")
    .select("id, name, tournament_id")
    .eq("access_code", accessCode)
    .single();

  if (ringError || !ring) {
    return { success: false, error: "Invalid access code." };
  }

  // 2. Create moderator_requests entry
  const { data: request, error: reqError } = await supabase
    .from("moderator_requests")
    .insert({
      ring_id: ring.id,
      access_code_used: accessCode,
      status: "pending",
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    })
    .select("id")
    .single();

  if (reqError || !request) {
    console.error("Failed to create request", reqError);
    return { success: false, error: "Failed to request access." };
  }

  return { success: true, requestId: request.id };
}

export async function checkModeratorStatus(requestId: string) {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("moderator_requests")
    .select("status, session_token, ring_id")
    .eq("id", requestId)
    .single();

  if (!request) return { status: "not_found" };
  
  return { 
    status: request.status, 
    sessionToken: request.session_token,
    ringId: request.ring_id 
  };
}

export async function validateModeratorSession(ringId: string, token: string) {
  const supabase = await createClient();
  const { data: request } = await supabase
    .from("moderator_requests")
    .select("status, ring_id")
    .eq("session_token", token)
    .single();

  if (request && request.status === "approved" && request.ring_id === ringId) {
    return true;
  }
  return false;
}

export async function startCategory(assignmentId: string, ringId: string) {
  const supabase = await createClient();
  
  const { data: assignment } = await supabase
    .from("category_assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();
    
  if (!assignment) throw new Error("Assignment not found");

  const { error: updateError } = await supabase
    .from("category_assignments")
    .update({ status: "running" })
    .eq("id", assignmentId);

  if (updateError) throw new Error("Update failed: " + updateError.message);

  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;

  await supabase
    .from("event_log")
    .insert({
      tournament_id: assignment.tournament_id,
      ring_id: ringId,
      category_id: assignment.category_id,
      action: "START_CATEGORY",
      moderator_session_id: modToken?.includes("-") ? modToken : null // Basic check if it's a UUID
    });
}

export async function adjustMatchCount(assignmentId: string, ringId: string, delta: number) {
  const supabase = await createClient();
  
  const { data: assignment } = await supabase
    .from("category_assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();
    
  if (!assignment) throw new Error("Assignment not found");

  const newCount = Math.max(0, assignment.matches_completed + delta);

  const { error: updateError } = await supabase
    .from("category_assignments")
    .update({ matches_completed: newCount })
    .eq("id", assignmentId);

  if (updateError) throw new Error("Update failed: " + updateError.message);

  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;

  await supabase
    .from("event_log")
    .insert({
      tournament_id: assignment.tournament_id,
      ring_id: ringId,
      category_id: assignment.category_id,
      action: delta > 0 ? "MATCH_COMPLETED_INCREMENT" : "MATCH_COMPLETED_DECREMENT",
      metadata: { delta },
      moderator_session_id: modToken?.includes("-") ? modToken : null
    });
}

export async function finishCategory(assignmentId: string, ringId: string) {
  const supabase = await createClient();
  
  const { data: assignment } = await supabase
    .from("category_assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();
    
  if (!assignment) throw new Error("Assignment not found");

  const { error: updateError } = await supabase
    .from("category_assignments")
    .update({ status: "completed" })
    .eq("id", assignmentId);

  if (updateError) throw new Error("Update failed: " + updateError.message);

  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;

  await supabase
    .from("event_log")
    .insert({
      tournament_id: assignment.tournament_id,
      ring_id: ringId,
      category_id: assignment.category_id,
      action: "FINISH_CATEGORY",
      moderator_session_id: modToken?.includes("-") ? modToken : null
    });
}

export async function setRingStatus(assignmentId: string, ringId: string, isPaused: boolean) {
  const supabase = await createClient();
  
  const { data: assignment } = await supabase
    .from("category_assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();
    
  if (!assignment) throw new Error("Assignment not found");

  const { error: updateError } = await supabase
    .from("category_assignments")
    .update({ status: isPaused ? "paused" : "running" })
    .eq("id", assignmentId);

  if (updateError) throw new Error("Update failed: " + updateError.message);

  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;

  await supabase
    .from("event_log")
    .insert({
      tournament_id: assignment.tournament_id,
      ring_id: ringId,
      category_id: assignment.category_id,
      action: isPaused ? "PAUSE_RING" : "RESUME_RING",
      moderator_session_id: modToken?.includes("-") ? modToken : null
    });
}

export async function logRingEvent(ringId: string, actionName: "EMERGENCY_ALERT" | "PAUSE_RING", metadata?: any) {
  const supabase = await createClient();
  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;

  const { data: ring } = await supabase.from("rings").select("tournament_id").eq("id", ringId).single();
  if (!ring) return;

  await supabase
    .from("event_log")
    .insert({
      tournament_id: ring.tournament_id,
      ring_id: ringId,
      action: actionName,
      metadata: metadata || null,
      moderator_session_id: modToken?.includes("-") ? modToken : null
    });
}
