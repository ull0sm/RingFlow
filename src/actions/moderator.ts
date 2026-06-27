"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
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

export async function requestModeratorAccess(accessCode: string, moderatorName?: string, deviceInfo?: any, turnstileToken?: string) {
  if (!turnstileToken) {
    return { success: false, error: "Security check is required." };
  }

  const { verifyTurnstileToken } = await import("./turnstile");
  const verification = await verifyTurnstileToken(turnstileToken);
  
  if (!verification.success) {
    return { success: false, error: verification.error || "Security check failed." };
  }

  const supabase = await createClient();

  // Try to get IP
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  let ip = "Unknown";
  if (forwardedFor) {
    ip = forwardedFor.split(',')[0];
  } else {
    ip = headersList.get('x-real-ip') || "Unknown";
  }

  // Merge IP if not set by client
  const finalDeviceInfo = {
    ...deviceInfo,
    ip: deviceInfo?.ip && deviceInfo.ip !== "Unknown" ? deviceInfo.ip : ip
  };

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
      moderator_name: moderatorName || "Unknown",
      device_info: finalDeviceInfo,
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
  
  const { data: latestRequest } = await supabase
    .from("moderator_requests")
    .select("id, session_token, status, moderator_name")
    .eq("ring_id", ringId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latestRequest) return false;
  
  // Exclusivity: 1 ring = 1 active moderator. 
  // Must match the *latest* approved session token.
  if (latestRequest.session_token === token) {
    return latestRequest;
  }
  return false;
}

export async function startCategory(assignmentId: string, ringId: string) {
  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;
  if (!modToken || !(await validateModeratorSession(ringId, modToken))) {
    throw new Error("Unauthorized: Session is not the active moderator.");
  }

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
  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;
  if (!modToken || !(await validateModeratorSession(ringId, modToken))) {
    throw new Error("Unauthorized: Session is not the active moderator.");
  }

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
  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;
  if (!modToken || !(await validateModeratorSession(ringId, modToken))) {
    throw new Error("Unauthorized: Session is not the active moderator.");
  }

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
  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;
  if (!modToken || !(await validateModeratorSession(ringId, modToken))) {
    throw new Error("Unauthorized: Session is not the active moderator.");
  }

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

export async function pauseCurrentRingAssignment(ringId: string) {
  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;
  if (!modToken || !(await validateModeratorSession(ringId, modToken))) {
    throw new Error("Unauthorized: Session is not the active moderator.");
  }

  const supabase = await createClient();
  
  const { data: assignment } = await supabase
    .from("category_assignments")
    .select("*")
    .eq("ring_id", ringId)
    .in("status", ["running"])
    .maybeSingle();

  if (assignment) {
    // Re-use setRingStatus to pause it
    await setRingStatus(assignment.id, ringId, true);
  }
}

export async function logRingEvent(ringId: string, actionName: "EMERGENCY_ALERT" | "PAUSE_RING" | "REQUEST_ASSISTANCE", metadata?: any) {
  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;
  if (!modToken || !(await validateModeratorSession(ringId, modToken))) {
    throw new Error("Unauthorized: Session is not the active moderator.");
  }

  const supabase = await createClient();

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

export async function returnCategoryToQueue(assignmentId: string, ringId: string) {
  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;
  if (!modToken || !(await validateModeratorSession(ringId, modToken))) {
    throw new Error("Unauthorized: Session is not the active moderator.");
  }

  const supabase = await createClient();
  
  const { data: assignment } = await supabase
    .from("category_assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();
    
  if (!assignment) throw new Error("Assignment not found");

  const { error: updateError } = await supabase
    .from("category_assignments")
    .update({ status: "pending", queue_order: 0 })
    .eq("id", assignmentId);

  if (updateError) throw new Error("Update failed: " + updateError.message);

  await supabase
    .from("event_log")
    .insert({
      tournament_id: assignment.tournament_id,
      ring_id: ringId,
      category_id: assignment.category_id,
      action: "RETURNED_TO_QUEUE",
      moderator_session_id: modToken?.includes("-") ? modToken : null
    });
}

export async function reorderCategory(assignmentId: string, ringId: string, direction: "up" | "down") {
  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;
  if (!modToken || !(await validateModeratorSession(ringId, modToken))) {
    throw new Error("Unauthorized: Session is not the active moderator.");
  }

  const supabase = await createClient();

  const { data: assignments } = await supabase
    .from("category_assignments")
    .select("*")
    .eq("ring_id", ringId)
    .eq("status", "pending")
    .order("queue_order", { ascending: true });

  if (!assignments || assignments.length === 0) return;

  const currentIndex = assignments.findIndex(a => a.id === assignmentId);
  if (currentIndex === -1) return;

  if (direction === "up" && currentIndex > 0) {
    const prev = assignments[currentIndex - 1];
    const curr = assignments[currentIndex];
    
    await supabase.from("category_assignments").update({ queue_order: prev.queue_order }).eq("id", curr.id);
    await supabase.from("category_assignments").update({ queue_order: curr.queue_order }).eq("id", prev.id);
  } else if (direction === "down" && currentIndex < assignments.length - 1) {
    const next = assignments[currentIndex + 1];
    const curr = assignments[currentIndex];
    
    await supabase.from("category_assignments").update({ queue_order: next.queue_order }).eq("id", curr.id);
    await supabase.from("category_assignments").update({ queue_order: curr.queue_order }).eq("id", next.id);
  }
}

export async function logoutModerator() {
  const cookieStore = await cookies();
  cookieStore.delete("mod_token");
}

export async function updateModeratorName(requestId: string, newName: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("moderator_requests")
    .update({ moderator_name: newName })
    .eq("id", requestId);
    
  if (error) {
    throw new Error(error.message);
  }
}
