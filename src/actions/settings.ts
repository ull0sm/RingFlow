"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ensureAdmin } from "./admin";

export async function updateTournamentSettings(
  tournamentId: string, 
  data: { name: string; event_date: string; status: string; venue: string; city: string; }
) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tournaments")
    .update(data)
    .eq("id", tournamentId)
    .eq("admin_id", adminId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/settings`);
  revalidatePath(`/admin/event/${tournamentId}/dashboard`);
  revalidatePath(`/admin`);
}

export async function deleteTournament(tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("tournaments")
    .delete()
    .eq("id", tournamentId)
    .eq("admin_id", adminId);

  if (error) throw new Error(error.message);

  redirect("/admin");
}
