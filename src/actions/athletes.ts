"use server";

import { createClient } from "@/utils/supabase/server";

export type AthleteInput = {
  name: string;
  chest_number: string;
  category_id: string;
  school?: string | null;
  school_code?: string | null;
  sports_id?: string | null;
  dojo?: string | null;
  belt?: string | null;
  age?: string | null;
  sex?: string | null;
  day?: string | null;
};

export async function addAthlete(tournamentId: string, input: AthleteInput) {
  const supabase = await createClient();

  const { error } = await supabase.from("athletes").insert({
    tournament_id: tournamentId,
    category_id: input.category_id || null,
    name: input.name,
    chest_number: input.chest_number,
    dojo: input.dojo || input.school || null,
    belt: input.belt || null,
    age: input.age || null,
    sex: input.sex || null,
    day: input.day || null,
  });

  if (error) throw new Error(error.message);

  if (input.category_id) {
    const { data: cat } = await supabase.from("categories").select("athletes_count").eq("id", input.category_id).single();
    if (cat) {
      const newCount = cat.athletes_count + 1;
      await supabase.from("categories").update({
        athletes_count: newCount,
        expected_matches: Math.max(0, newCount - 1)
      }).eq("id", input.category_id);
    }
  }

  return { success: true };
}

export async function updateAthlete(athleteId: string, updates: Partial<AthleteInput>) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("athletes")
    .update(updates)
    .eq("id", athleteId);

  if (error) throw new Error(error.message);
  return { success: true };
}

export async function updateAthleteCategory(athleteId: string, categoryId: string | null, tournamentId?: string) {
  const supabase = await createClient();

  const { data: oldAthlete } = await supabase.from("athletes").select("category_id").eq("id", athleteId).single();

  const { error } = await supabase
    .from("athletes")
    .update({ category_id: categoryId })
    .eq("id", athleteId);

  if (error) throw new Error(error.message);

  if (oldAthlete?.category_id) {
    const { data: oldCat } = await supabase.from("categories").select("athletes_count").eq("id", oldAthlete.category_id).single();
    if (oldCat && oldCat.athletes_count > 0) {
      const newCount = oldCat.athletes_count - 1;
      await supabase.from("categories").update({
        athletes_count: newCount,
        expected_matches: Math.max(0, newCount - 1)
      }).eq("id", oldAthlete.category_id);
    }
  }

  if (categoryId) {
    const { data: newCat } = await supabase.from("categories").select("athletes_count").eq("id", categoryId).single();
    if (newCat) {
      const newCount = newCat.athletes_count + 1;
      await supabase.from("categories").update({
        athletes_count: newCount,
        expected_matches: Math.max(0, newCount - 1)
      }).eq("id", categoryId);
    }
  }

  return { success: true };
}

export async function deleteAthlete(athleteId: string, tournamentId?: string) {
  const supabase = await createClient();

  const { data: athlete } = await supabase.from("athletes").select("category_id").eq("id", athleteId).single();

  const { error } = await supabase
    .from("athletes")
    .delete()
    .eq("id", athleteId);

  if (error) throw new Error(error.message);

  if (athlete && athlete.category_id) {
    const { data: cat } = await supabase.from("categories").select("athletes_count").eq("id", athlete.category_id).single();
    if (cat && cat.athletes_count > 0) {
      const newCount = cat.athletes_count - 1;
      await supabase.from("categories").update({
        athletes_count: newCount,
        expected_matches: Math.max(0, newCount - 1)
      }).eq("id", athlete.category_id);
    }
  }

  return { success: true };
}

export async function bulkAddAthletes(tournamentId: string, categoryName: string, athletes: any[]) {
  const supabase = await createClient();

  const { data: cat } = await supabase
    .from("categories")
    .select("id, athletes_count")
    .eq("tournament_id", tournamentId)
    .eq("name", categoryName)
    .maybeSingle();

  let categoryId = cat?.id;

  if (!cat) {
    const expectedMatches = Math.max(0, athletes.length - 1);
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

    if (catError || !newCat) throw new Error("Failed to create category");
    categoryId = newCat.id;
  } else {
    const { data: currentCat } = await supabase.from("categories").select("athletes_count").eq("id", cat.id).single();
    if (currentCat) {
      const newCount = currentCat.athletes_count + athletes.length;
      await supabase.from("categories").update({
        athletes_count: newCount,
        expected_matches: Math.max(0, newCount - 1)
      }).eq("id", cat.id);
    }
  }

  const toInsert = athletes.map(a => ({
    category_id: categoryId,
    name: a.name,
    chest_number: a.chest_number
  }));

  const { error } = await supabase.from("athletes").insert(toInsert);
  if (error) throw new Error(error.message);

  return { success: true };
}

export async function bulkAddMasterAthletes(tournamentId: string, athletes: any[]) {
  const supabase = await createClient();

  const { data: categories, error: catError } = await supabase
    .from("categories")
    .select("id, name, belt, age_min, age_max, sex, weight_class")
    .eq("tournament_id", tournamentId);

  if (catError) throw new Error(catError.message);

  const catMap = new Map<string, string>();
  if (categories) {
    for (const c of categories) {
      catMap.set(c.name.toLowerCase().trim(), c.id);
    }
  }

  const toInsert = athletes.map(a => {
    let matchedId = null;
    
    // 1. Match by Belt + Sex + Age (Shorinkai standard)
    if (a.belt && a.sex) {
      const athleteAge = parseInt(a.age) || 0;
      const aBelt = a.belt.trim().toLowerCase();
      const aSex = a.sex.trim().toLowerCase();

      const matchedCat = categories?.find(c => {
        if (!c.belt || !c.sex) return false;
        const catBelt = c.belt.trim().toLowerCase();
        const catSex = c.sex.trim().toLowerCase();
        
        const matchBelt = catBelt === aBelt || aBelt.includes(catBelt) || catBelt.includes(aBelt);
        const matchSex = catSex.startsWith(aSex.charAt(0)) || aSex.startsWith(catSex.charAt(0));
        const matchAge = c.age_min !== null && c.age_max !== null ? (athleteAge >= c.age_min && athleteAge <= c.age_max) : true;

        return matchBelt && matchSex && matchAge;
      });

      if (matchedCat) {
        matchedId = matchedCat.id;
      }
    }

    if (!matchedId && a.category_name) {
      matchedId = catMap.get(a.category_name.toLowerCase().trim()) || null;
    }
    if (!matchedId && a.category) {
      matchedId = catMap.get(a.category.toLowerCase().trim()) || null;
    }

    return {
      category_id: matchedId,
      tournament_id: tournamentId,
      name: a.name,
      chest_number: a.no || a.chest_number || null,
      belt: a.belt || null,
      age: a.age || null,
      sex: a.sex || null,
      dojo: a.dojo || a.school || null,
      day: a.day || null,
    };
  });

  const { error } = await supabase.from("athletes").insert(toInsert);
  if (error) throw new Error(error.message);

  if (categories && categories.length > 0) {
    for (const cat of categories) {
      const { count } = await supabase
        .from("athletes")
        .select("id", { count: 'exact', head: true })
        .eq("category_id", cat.id);
      
      const newCount = count || 0;
      await supabase.from("categories").update({
        athletes_count: newCount,
        expected_matches: Math.max(0, newCount - 1)
      }).eq("id", cat.id);
    }
  }

  return { success: true };
}
