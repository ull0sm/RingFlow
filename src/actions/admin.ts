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

  // If the authenticated user is not in the admins table, throw an error
  throw new Error("Unauthorized: Your account does not have administrator privileges.");
}
