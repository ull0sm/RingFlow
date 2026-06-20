"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "./admin";

export type AthleteInput = {
  name: string;
  chest_number: string;
  category_id: string;
};

export async function addAthlete(tournamentId: string, input: AthleteInput) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("athletes").insert({
    category_id: input.category_id,
    name: input.name,
    chest_number: input.chest_number
  });

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/athletes`);
}

export async function deleteAthlete(athleteId: string, tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  const { error } = await supabase.from("athletes").delete().eq("id", athleteId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/athletes`);
}

export async function bulkAddAthletes(tournamentId: string, categoryName: string, athletes: { no: string, name: string }[]) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  // Find or create category
  let { data: cat } = await supabase
    .from("categories")
    .select("id")
    .eq("tournament_id", tournamentId)
    .ilike("name", categoryName)
    .single();

  if (!cat) {
    // Auto-create category
    const expectedMatches = (2 * (athletes.length > 0 ? athletes.length : 1)) - 1;
    const { data: newCat, error: catError } = await supabase
      .from("categories")
      .insert({
        tournament_id: tournamentId,
        name: categoryName,
        athletes_count: athletes.length,
        expected_matches: expectedMatches,
        has_full_roster: true
      })
      .select("id")
      .single();

    if (catError || !newCat) throw new Error("Failed to auto-create category");
    cat = newCat;
  } else {
    // Update athlete count
    await supabase.rpc('increment_category_athletes', { category_id_param: cat.id, amount: athletes.length });
    // Or just manually update:
    // This is MVP, so a simple approach: fetch current, add, update.
    const { data: currentCat } = await supabase.from("categories").select("athletes_count").eq("id", cat.id).single();
    if (currentCat) {
      await supabase.from("categories").update({ athletes_count: currentCat.athletes_count + athletes.length }).eq("id", cat.id);
    }
  }

  const categoryId = cat.id;

  const toInsert = athletes.map(a => ({
    category_id: categoryId,
    name: a.name,
    chest_number: a.no ? String(a.no) : null
  }));

  if (toInsert.length > 0) {
    const { error } = await supabase.from("athletes").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/admin/event/${tournamentId}/athletes`);
  revalidatePath(`/admin/event/${tournamentId}/categories`);
  return { success: true, count: toInsert.length };
}
