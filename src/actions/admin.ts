"use server";

import { createClient } from "@/utils/supabase/server";

/**
 * Ensures the currently authenticated user exists in the public.admins table.
 * If not, it inserts them. Returns the admin's UUID.
 */
export async function ensureAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Not authenticated");
  }

  // Check if admin exists
  const { data: admin, error: adminError } = await supabase
    .from("admins")
    .select("id")
    .eq("id", user.id)
    .single();

  if (adminError && adminError.code !== "PGRST116") {
    // PGRST116 is the code for "no rows returned"
    console.error("Error fetching admin:", adminError);
    throw new Error("Failed to verify admin status.");
  }

  if (admin) {
    return admin.id;
  }

  // Auto-insert for MVP
  const { error: insertError } = await supabase
    .from("admins")
    .insert({
      id: user.id,
      email: user.email,
    });

  if (insertError) {
    console.error("Error creating admin record:", insertError);
    throw new Error(`Failed to provision admin account. Reason: ${insertError.message || insertError.details || JSON.stringify(insertError)}`);
  }

  return user.id;
}
