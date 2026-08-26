"use server";

import { createClient } from "@/utils/supabase/server";

export type CategoryInput = {
  name: string;
  age_bracket?: string;
  weight_class?: string;
  athletes_count: number;
  belt?: string;
  age_min?: number;
  age_max?: number;
  sex?: string;
  day?: string;
};

export async function addCategory(tournamentId: string, input: CategoryInput) {
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id")
    .eq("id", tournamentId)
    .single();

  if (!tournament) throw new Error("Unauthorized or tournament not found");

  const expectedMatches = Math.max(0, input.athletes_count - 1);

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
      belt: input.belt || null,
      age_min: input.age_min || null,
      age_max: input.age_max || null,
      sex: input.sex || null,
      day: input.day || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding category:", error);
    throw new Error("Failed to add category");
  }

  return data;
}

export async function bulkAddCategories(tournamentId: string, categories: any[]) {
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("id")
    .eq("id", tournamentId)
    .single();

  if (!tournament) throw new Error("Unauthorized or tournament not found");

  const toInsert = categories.map((cat) => ({
    tournament_id: tournamentId,
    name: cat.name,
    age_bracket: cat.age_bracket,
    weight_class: cat.weight_class,
    athletes_count: cat.athletes_count,
    expected_matches: Math.max(0, (cat.athletes_count || 0) - 1),
    has_full_roster: false,
    belt: cat.belt || null,
    age_min: cat.age_min || null,
    age_max: cat.age_max || null,
    sex: cat.sex || null,
    day: cat.day || null,
  }));

  const { error } = await supabase.from("categories").insert(toInsert);

  if (error) {
    console.error("Error bulk adding categories:", error);
    throw new Error("Failed to bulk add categories");
  }

  return { success: true };
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    console.error("Error deleting category:", error);
    throw new Error("Failed to delete category");
  }

  return { success: true };
}
