const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const match = line.match(/^([A-Z_]+)=(.*)$/);
  if (match) acc[match[1].trim()] = match[2].trim().replace(/^"|"$/g, '');
  return acc;
}, {});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data: assignment, error: selErr } = await supabase
    .from('category_assignments')
    .select('*')
    .limit(1)
    .single();

  if (selErr) {
    console.error("SELECT ERROR:", selErr);
    return;
  }
  
  console.log("Found assignment:", assignment.id);

  const { data, error } = await supabase
    .from('category_assignments')
    .update({ status: 'running' })
    .eq('id', assignment.id)
    .select();

  if (error) {
    console.error("UPDATE ERROR:", error);
  } else {
    console.log("UPDATE SUCCESS:", data);
  }
}

test();
