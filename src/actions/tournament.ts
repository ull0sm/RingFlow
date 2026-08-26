"use server";

import { createClient } from "@/utils/supabase/server";

export type CategoryInput = {
  name: string;
  age_bracket?: string;
  weight_class?: string;
  athletes_count: number;
};

export type TournamentInput = {
  name: string;
  event_date: string;
  venue: string;
  city: string;
  num_rings?: number;
  ringCount?: number;
  categories: CategoryInput[];
};

export async function createTournament(input: TournamentInput): Promise<string> {
  const supabase = await createClient();

  // Get Current Admin User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  // 1. Create Tournament
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .insert({
      admin_id: user.id,
      name: input.name,
      event_date: input.event_date ? input.event_date : null,
      venue: input.venue,
      city: input.city,
      status: "draft",
    })
    .select()
    .single();

  if (tournamentError || !tournament) {
    console.error("Error creating tournament:", tournamentError);
    throw new Error("Failed to create tournament");
  }

  const tournamentId = tournament.id;

  // 2. Create Categories
  if (input.categories.length > 0) {
    const categoriesToInsert = input.categories.map((c) => {
      // expected_matches = n - 1
      const expectedMatches = Math.max(0, c.athletes_count - 1);

      return {
        tournament_id: tournamentId,
        name: c.name,
        age_bracket: c.age_bracket || "",
        weight_class: c.weight_class || "",
        athletes_count: c.athletes_count,
        expected_matches: expectedMatches,
        has_full_roster: false,
      };
    });

    const { error: catError } = await supabase
      .from("categories")
      .insert(categoriesToInsert);

    if (catError) {
      console.error("Error creating categories:", catError);
      throw new Error("Failed to create categories");
    }
  }

  // 3. Create Rings
  const ringTotal = input.num_rings || input.ringCount || 0;
  if (ringTotal > 0) {
    const ringsToInsert = Array.from({ length: ringTotal }).map(
      (_, index) => {
        const ringNumber = index + 1;
        const accessCode = Math.random().toString(36).substring(2, 6).toUpperCase();
        return {
          tournament_id: tournamentId,
          name: `Tatami ${ringNumber}`,
          ring_order: ringNumber,
          access_code: accessCode,
        };
      }
    );

    const { error: ringsError } = await supabase
      .from("rings")
      .insert(ringsToInsert);

    if (ringsError) {
      console.error("Error creating rings:", ringsError);
      throw new Error("Failed to create rings");
    }
  }

  return tournamentId;
}
