"use server";

import { createClient } from "@/utils/supabase/server";
import { ensureAdmin } from "./admin";

export type CategoryInput = {
  name: string;
  age_bracket: string;
  weight_class: string;
  athletes_count: number;
};

export type TournamentInput = {
  name: string;
  event_date: string;
  venue: string;
  city: string;
  categories: CategoryInput[];
  ringCount: number;
};

export async function createTournament(input: TournamentInput) {
  const adminId = await ensureAdmin();
  const supabase = await createClient();

  // 1. Create Tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .insert({
      admin_id: adminId,
      name: input.name,
      event_date: input.event_date || null,
      venue: input.venue || null,
      city: input.city || null,
      status: "draft",
    })
    .select("id")
    .single();

  if (tournamentError) {
    console.error("Failed to create tournament:", tournamentError);
    throw new Error("Failed to create tournament");
  }

  const tournamentId = tournament.id;

  // 2. Create Categories
  if (input.categories.length > 0) {
    const categoriesToInsert = input.categories.map((c) => {
      // expected_matches = 2n - 1
      const count = c.athletes_count > 0 ? c.athletes_count : 1;
      const expectedMatches = (2 * count) - 1;

      return {
        tournament_id: tournamentId,
        name: c.name,
        age_bracket: c.age_bracket,
        weight_class: c.weight_class,
        athletes_count: c.athletes_count,
        expected_matches: expectedMatches,
        has_full_roster: false,
      };
    });

    const { error: categoriesError } = await supabase
      .from("categories")
      .insert(categoriesToInsert);

    if (categoriesError) {
      console.error("Failed to create categories:", categoriesError);
      throw new Error("Failed to create categories");
    }
  }

  // 3. Create Rings
  const ringsToInsert = Array.from({ length: input.ringCount }).map((_, i) => {
    // Generate a random 6-digit string
    const accessCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    return {
      tournament_id: tournamentId,
      name: `Tatami ${String(i + 1).padStart(2, "0")}`,
      ring_order: i + 1,
      access_code: accessCode,
    };
  });

  const { error: ringsError } = await supabase
    .from("rings")
    .insert(ringsToInsert);

  if (ringsError) {
    console.error("Failed to create rings:", ringsError);
    throw new Error("Failed to create rings");
  }

  return tournamentId;
}
