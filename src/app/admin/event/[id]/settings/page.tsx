import React from "react";
import AdminHeader from "@/components/layout/AdminHeader";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "@/components/admin/SettingsClient";

export default async function AdminSettings({ params }: { params: Promise<{ id: string }> }) {
  const { id: tournamentId } = await params;
  const supabase = await createClient();

  const { data: tournament } = await supabase
    .from("tournaments")
    .select("*")
    .eq("id", tournamentId)
    .single();

  if (!tournament) redirect("/admin");

  return (
    <>
      <AdminHeader title="Settings" eventName={tournament.name} />
      <SettingsClient tournament={tournament} />
    </>
  );
}
