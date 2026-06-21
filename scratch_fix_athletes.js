const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function fix() {
  const tournamentId = "bdc17ee0-e6e6-4038-ba88-f4cd8b67a086";

  const { data: categories } = await supabase.from('categories').select('*').eq('tournament_id', tournamentId);
  const { data: athletes } = await supabase.from('athletes').select('*').eq('tournament_id', tournamentId).is('category_id', null);

  console.log(`Found ${categories.length} categories and ${athletes.length} uncategorized athletes.`);

  const updates = [];
  let matchCount = 0;

  for (const a of athletes) {
    if (a.belt && a.sex) {
      const athleteAge = parseInt(a.age) || 0;
      const aBelt = a.belt.trim().toLowerCase();
      const aSex = a.sex.trim().toLowerCase();
      const aDay = a.day ? a.day.trim().toLowerCase() : null;

      const matchedCat = categories.find(c => {
        const cBelt = c.belt ? c.belt.trim().toLowerCase() : null;
        const cSex = c.sex ? c.sex.trim().toLowerCase() : null;
        const cDay = c.day ? c.day.trim().toLowerCase() : null;

        return cBelt === aBelt &&
               cSex === aSex &&
               (!cDay || cDay === aDay) &&
               (c.age_min === null || athleteAge >= c.age_min) &&
               (c.age_max === null || athleteAge <= c.age_max);
      });

      if (matchedCat) {
        updates.push({
          ...a,
          category_id: matchedCat.id
        });
        matchCount++;
      }
    }
  }

  console.log(`Found matches for ${matchCount} athletes.`);

  if (updates.length > 0) {
    const { error } = await supabase.from('athletes').upsert(updates);
    if (error) {
      console.error("Error updating:", error);
    } else {
      console.log("Successfully updated athletes.");
    }
  }
}

fix();
