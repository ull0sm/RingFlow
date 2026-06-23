import React from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateModeratorSession } from "@/actions/moderator";
import { createClient } from "@/utils/supabase/server";
import ModeratorBottomNav from "@/components/moderator/ModeratorBottomNav";
import ModeratorLogoutButton from "@/components/moderator/ModeratorLogoutButton";

export default async function ModeratorRingLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ ringId: string }>;
}) {
  const { ringId } = await params;

  // Validate Auth
  const cookieStore = await cookies();
  const token = cookieStore.get("mod_token")?.value;

  if (!token) {
    redirect("/moderator/login");
  }

  const isValid = await validateModeratorSession(ringId, token);
  if (!isValid) {
    redirect("/moderator/login");
  }

  // Fetch Ring Info
  const supabase = await createClient();
  const { data: ring } = await supabase
    .from("rings")
    .select("*")
    .eq("id", ringId)
    .single();

  if (!ring) {
    return <div>Ring not found.</div>;
  }

  return (
    <div className="bg-background text-on-background min-h-screen font-body-md flex flex-col pb-24">
      {/* Top Navigation Bar */}
      <header className="bg-surface-container-lowest text-primary full-width top-0 border-b border-outline-variant flex justify-between items-center w-full px-4 md:px-margin-desktop h-16 z-40 sticky">
        <div className="flex items-center gap-6">
          <span className="font-headline-sm text-headline-sm font-black text-primary tracking-tighter hidden md:inline">Ring Flow</span>
          <div className="h-6 w-[1px] bg-outline-variant hidden md:block"></div>
          <h1 className="font-body-md font-bold text-on-surface uppercase">{ring.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <ModeratorLogoutButton />
          <div className="w-8 h-8 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container">
            <span className="material-symbols-outlined text-[16px]">admin_panel_settings</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow p-4 md:p-margin-desktop max-w-5xl mx-auto w-full">
        {children}
      </main>

      {/* Bottom Navigation Bar */}
      <ModeratorBottomNav ringId={ringId} />
    </div>
  );
}
