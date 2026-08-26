"use server";

import { createClient } from "@/utils/supabase/server";
import { cookies, headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function ensureAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  return user.id;
}

export async function approveModeratorRequest(requestId: string, ringId: string, tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from("moderator_requests")
    .update({
      status: "approved",
      session_token: sessionToken,
      expires_at: expiresAt
    })
    .eq("id", requestId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/rings`);
  revalidatePath(`/admin/event/${tournamentId}/dashboard`);
}

export async function rejectModeratorRequest(requestId: string, tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("moderator_requests")
    .update({ status: "rejected" })
    .eq("id", requestId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/rings`);
  revalidatePath(`/admin/event/${tournamentId}/dashboard`);
}

export async function revokeActiveModeratorSession(ringId: string, tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("moderator_requests")
    .update({ status: "revoked", session_token: null })
    .eq("ring_id", ringId)
    .eq("status", "approved");

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/rings`);
  revalidatePath(`/admin/event/${tournamentId}/dashboard`);
}

export async function requestModeratorAccess(accessCode: string, moderatorName?: string, deviceInfo?: any, turnstileToken?: string) {
  if (!turnstileToken) {
    return { success: false, error: "Security check is required." };
  }

  const { verifyTurnstileToken } = await import("@/actions/turnstile");
  const verification = await verifyTurnstileToken(turnstileToken);
  if (!verification.success) {
    return { success: false, error: verification.error || "Security check failed." };
  }

  const supabase = await createClient();


  // Server-side IP extraction
  const headersList = await headers();
  const forwardedFor = headersList.get('x-forwarded-for');
  let ip = 'Unknown';
  if (forwardedFor) {
    ip = forwardedFor.split(',')[0].trim();
  } else {
    ip = headersList.get('x-real-ip') || 'Unknown';
  }
  const finalDeviceInfo = {
    ...deviceInfo,
    ip: deviceInfo?.ip && deviceInfo.ip !== 'Unknown' ? deviceInfo.ip : ip
  };

  const { data: ring } = await supabase
    .from("rings")
    .select("id, name, tournament_id")
    .eq("access_code", accessCode.trim().toUpperCase())
    .maybeSingle();

  if (!ring) {
    return { success: false, error: "Invalid access code. Please check with tournament admin." };
  }

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const { data: request, error } = await supabase
    .from("moderator_requests")
    .insert({
      ring_id: ring.id,
      access_code_used: accessCode.trim().toUpperCase(),
      status: "pending",
      expires_at: expiresAt,
      moderator_name: moderatorName || "Anonymous Official",
      device_info: finalDeviceInfo || {}
    })
    .select("id")
    .single();

  if (error || !request) {
    return { success: false, error: "Failed to submit request." };
  }

  return { success: true, requestId: request.id, ringName: ring.name };
}

export async function checkModeratorStatus(requestId: string) {
  const supabase = await createClient();

  const { data: request } = await supabase
    .from("moderator_requests")
    .select("status, session_token, ring_id")
    .eq("id", requestId)
    .single();

  if (!request) return { status: "not_found", ringId: undefined, sessionToken: undefined };

  if (request.status === "approved" && request.session_token) {
    const cookieStore = await cookies();
    cookieStore.set("mod_token", request.session_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 12 * 60 * 60,
      path: "/",
    });
    return { status: "approved", ringId: request.ring_id, sessionToken: request.session_token };
  }

  return { status: request.status, ringId: request.ring_id, sessionToken: undefined };
}

export async function validateModeratorSession(ringId: string, token: string) {
  const supabase = await createClient();
  
  // Exclusivity: 1 ring = 1 active moderator.
  // Always validate against the LATEST approved session for this ring.
  const { data: latestRequest } = await supabase
    .from("moderator_requests")
    .select("id, session_token, status, moderator_name")
    .eq("ring_id", ringId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latestRequest) return false;
  
  // Must match the *latest* approved session token exactly
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
  
  await supabase
    .from("category_assignments")
    .update({ status: "paused" })
    .eq("ring_id", ringId)
    .eq("status", "running");

  const { data: assignment, error: updateError } = await supabase
    .from("category_assignments")
    .update({ status: "running" })
    .eq("id", assignmentId)
    .select("*, categories(name)")
    .single();

  if (updateError || !assignment) throw new Error("Failed to start category");

  await supabase
    .from("event_log")
    .insert({
      tournament_id: assignment.tournament_id,
      ring_id: ringId,
      category_id: assignment.category_id,
      action: "START_CATEGORY",
      moderator_session_id: modToken?.includes("-") ? modToken : null
    });
}

const recentAdjustmentsMap = new Map<string, number[]>();

export async function adjustMatchCount(assignmentId: string, ringId: string, delta: number) {
  const cookieStore = await cookies();
  const modToken = cookieStore.get("mod_token")?.value;
  if (!modToken || !(await validateModeratorSession(ringId, modToken))) {
    throw new Error("Unauthorized: Session is not the active moderator.");
  }

  const now = Date.now();
  const windowMs = 2500;
  const history = (recentAdjustmentsMap.get(ringId) || []).filter(t => now - t < windowMs);

  if (history.length >= 2) {
    recentAdjustmentsMap.set(ringId, []);
    throw new Error("Too many rapid attempts detected. Action rejected.");
  }

  history.push(now);
  recentAdjustmentsMap.set(ringId, history);

  const supabase = await createClient();
  
  const { data: assignment } = await supabase
    .from("category_assignments")
    .select("*")
    .eq("id", assignmentId)
    .single();
    
  if (!assignment) throw new Error("Assignment not found");

  const newCount = Math.max(0, assignment.matches_completed + delta);

  let updateResult = await supabase
    .from("category_assignments")
    .update({ matches_completed: newCount })
    .eq("id", assignmentId);

  if (updateResult.error) {
    await new Promise(res => setTimeout(res, 200));
    updateResult = await supabase
      .from("category_assignments")
      .update({ matches_completed: newCount })
      .eq("id", assignmentId);
  }

  if (updateResult.error) throw new Error("Database error: " + updateResult.error.message);

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

  return { success: true, matches_completed: newCount };
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
    .update({ 
      status: "completed",
      completed_at: new Date().toISOString()
    })
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
    .update({ 
      status: "pending", 
      completed_at: null 
    })
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
    
    await supabase.from("category_assignments").update({ queue_order: -1 }).eq("id", curr.id);
    await supabase.from("category_assignments").update({ queue_order: curr.queue_order }).eq("id", prev.id);
    await supabase.from("category_assignments").update({ queue_order: prev.queue_order }).eq("id", curr.id);
  } else if (direction === "down" && currentIndex < assignments.length - 1) {
    const next = assignments[currentIndex + 1];
    const curr = assignments[currentIndex];
    
    await supabase.from("category_assignments").update({ queue_order: -1 }).eq("id", curr.id);
    await supabase.from("category_assignments").update({ queue_order: curr.queue_order }).eq("id", next.id);
    await supabase.from("category_assignments").update({ queue_order: next.queue_order }).eq("id", curr.id);
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
