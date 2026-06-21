"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { ensureAdmin } from "./admin";
import { CategoryInput } from "./tournament";

export async function addCategory(tournamentId: string, input: CategoryInput) {
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

  const expectedMatches = (2 * (input.athletes_count > 0 ? input.athletes_count : 1)) - 1;

  const { data, error } = await supabase
    .from("categories")
    .insert({
      tournament_id: tournamentId,
      name: input.name,
      age_bracket: input.age_bracket,
      weight_class: input.weight_class,
      athletes_count: input.athletes_count,
      expected_matches: expectedMatches,
      has_full_roster: false,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/categories`);
  return data;
}

export async function bulkAddCategories(tournamentId: string, categories: any[]) {
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

  const toInsert = categories.map(cat => ({
    tournament_id: tournamentId,
    name: cat.name,
    age_bracket: cat.age_bracket,
    weight_class: cat.weight_class,
    athletes_count: cat.athletes_count,
    expected_matches: (2 * (cat.athletes_count > 0 ? cat.athletes_count : 1)) - 1,
    has_full_roster: false,
    belt: cat.belt || null,
    age_min: cat.age_min || null,
    age_max: cat.age_max || null,
    sex: cat.sex || null,
    day: cat.day || null,
  }));

  if (toInsert.length > 0) {
    // Break into chunks if necessary, but Supabase handles up to a few thousand easily
    const { error } = await supabase.from("categories").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  revalidatePath(`/admin/event/${tournamentId}/categories`);
  return { success: true, count: toInsert.length };
}

export async function updateCategory(categoryId: string, tournamentId: string, updates: Partial<CategoryInput> & { expected_matches?: number }) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  // Verification
  const { data: cat } = await supabase
    .from("categories")
    .select("tournament_id")
    .eq("id", categoryId)
    .single();

  if (!cat || cat.tournament_id !== tournamentId) throw new Error("Category not found");

  const { error } = await supabase
    .from("categories")
    .update(updates)
    .eq("id", categoryId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/categories`);
}

export async function deleteCategory(categoryId: string, tournamentId: string) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("tournament_id", tournamentId);

  if (error) throw new Error(error.message);

  revalidatePath(`/admin/event/${tournamentId}/categories`);
}
