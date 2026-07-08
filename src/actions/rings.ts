"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "./admin";

function generateAccessCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function addRing(tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  // Verify tournament ownership
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id")
    .eq("id", tournamentId)
    .eq("admin_id", adminId)
    .single();

  if (!tournament) throw new Error("Unauthorized or tournament not found");

  // Get current ring count to determine order
  const { count } = await supabase
    .from("rings")
    .select("*", { count: "exact", head: true })
    .eq("tournament_id", tournamentId);

  const newOrder = (count || 0) + 1;
  const newName = `Tatami ${String(newOrder).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("rings")
    .insert({
      tournament_id: tournamentId,
      name: newName,
      ring_order: newOrder,
      access_code: generateAccessCode(),
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/rings`);
  return data;
}

export async function regenerateRingCode(ringId: string, tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  // Basic ownership check
  const { data: ring } = await supabase
    .from("rings")
    .select("tournament_id")
    .eq("id", ringId)
    .single();

  if (!ring || ring.tournament_id !== tournamentId) throw new Error("Ring not found");

  const { error } = await supabase
    .from("rings")
    .update({ access_code: generateAccessCode() })
    .eq("id", ringId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/rings`);
}

export async function deleteRing(ringId: string, tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  // Delete ring
  const { error } = await supabase
    .from("rings")
    .delete()
    .eq("id", ringId)
    .eq("tournament_id", tournamentId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/rings`);
}
