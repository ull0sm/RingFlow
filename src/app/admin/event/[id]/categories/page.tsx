import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CategoriesClient from "@/components/admin/CategoriesClient";

export default async function AdminCategories({ params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const supabase = await createClient();

  const [
    { data: tournament },
    { data: categories }
  ] = await Promise.all([
    supabase.from("tournaments").select("name").eq("id", tournamentId).single(),
    supabase.from("categories").select("*").eq("tournament_id", tournamentId).order("created_at", { ascending: false })
  ]);

  if (!tournament) redirect("/admin");

  return (
    <>
      <AdminHeader title="Categories" eventName={tournament.name} />
      <CategoriesClient tournamentId={tournamentId} initialCategories={categories || []} />
    </>
  );
}
