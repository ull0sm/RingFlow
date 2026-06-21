const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: categories } = await supabase.from('categories').select('*').limit(5);
  console.log("CATEGORIES:");
  console.log(JSON.stringify(categories, null, 2));

  const { data: athletes } = await supabase.from('athletes').select('*').limit(5);
  console.log("ATHLETES:");
  console.log(JSON.stringify(athletes, null, 2));
}

check();
