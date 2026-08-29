import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import PublicStats from "@/components/public/PublicStats";
import { RingFlowLogo } from "@/components/ui/ringflow-logo";

export default async function PublicHome() {
  const supabase = await createClient();
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select(`
      *,
      rings (id),
      categories (id)
    `)
    .order("event_date", { ascending: true });

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  const isLive = (t: any) => {
    if (t.status === "completed") return false;
    if (!t.event_date) return false;
    const eventDateStr = String(t.event_date).split("T")[0];
    return eventDateStr === todayStr;
  };

  const allTournaments = (tournaments || [])
    .filter((t) => t.status !== "completed")
    .sort((a, b) => {
      const aLive = isLive(a) ? 1 : 0;
      const bLive = isLive(b) ? 1 : 0;
      if (aLive !== bLive) return bLive - aLive;
      return new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime();
    });

  return (
    <>
      {/* Top Navigation Bar */}
      <header className="w-full top-0 sticky z-50 bg-[#F5F3EC]/90 backdrop-blur-md border-b border-[#E1DDCF] transition-all font-['Inter',sans-serif]">
        <div className="max-w-7xl mx-auto flex justify-between items-center h-16 px-4 md:px-margin-desktop">
          <Link href="/" className="flex items-center gap-2.5 group">
            <RingFlowLogo className="h-[34px] w-[34px] text-[#1B1815] group-hover:scale-105 transition-transform shrink-0" />
            <span className="text-[23px] font-black text-[#1B1815] tracking-[-0.02em] leading-none font-['Plus_Jakarta_Sans',sans-serif]">
              RingFlow
            </span>
          </Link>

          <nav className="flex items-center">
            <Link
              href="#events"
              className="inline-flex items-center px-4 py-2 bg-[#1B1815] hover:bg-black text-[#F5F3EC] rounded-lg text-[13.5px] font-bold font-['Plus_Jakarta_Sans',sans-serif] transition-all shadow-sm hover:shadow"
            >
              <span>Tournaments</span>
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow font-['Inter',sans-serif]">
        {/* Hero Section */}
        <section className="relative min-h-[480px] md:h-[520px] overflow-hidden bg-[#F5F3EC] border-b border-[#E1DDCF] flex items-center">
          <div className="absolute inset-0 bg-[url('/hero-section.jpg')] bg-cover bg-right md:bg-center opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F5F3EC] via-[#F5F3EC]/80 to-transparent md:via-[#F5F3EC]/50" />
          <div className="relative max-w-7xl mx-auto px-margin-desktop w-full py-16">
            <div className="max-w-2xl">
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-[40px] md:text-[54px] font-black tracking-[-0.03em] leading-[1.08] mb-4 text-[#1B1815]">
                Find Your Next Championship
              </h1>
              <p className="text-[#68645A] font-['Inter',sans-serif] font-normal mb-8 text-lg md:text-xl max-w-xl leading-relaxed">
                Track live tatami rings, category assignments, and athlete queue status in real time.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="#events" className="px-8 py-3.5 bg-[#1B1815] text-[#F5F3EC] font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[15px] rounded-lg hover:bg-black transition-all shadow-md hover:shadow-lg inline-block">
                  View Events
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <PublicStats />

        {/* Unified Events Grid */}
        <section id="events" className="max-w-7xl mx-auto px-margin-desktop py-14 scroll-mt-20">
          <div className="mb-8">
            <h2 className="font-['Plus_Jakarta_Sans',sans-serif] text-[28px] md:text-[32px] font-black tracking-[-0.02em] text-[#1B1815] mb-2">
              Tournaments
            </h2>
            <p className="text-[#68645A] text-[15px]">
              Live floor operations, tatami status, and category allocations.
            </p>
          </div>

          {allTournaments.length === 0 ? (
            <div className="bg-white border border-[#E1DDCF] rounded-2xl p-12 text-center max-w-lg mx-auto">
              <p className="text-[#68645A] text-[15px] font-medium">No tournaments currently scheduled.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allTournaments.map((t) => {
                const live = isLive(t);
                const eventDateStr = t.event_date
                  ? new Date(t.event_date).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "DATE TBD";

                return (
                  <Link
                    key={t.id}
                    href={`/public/event/${t.id}`}
                    scroll={true}
                    className={`rounded-2xl p-6 md:p-7 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden ${
                      live
                        ? "bg-white border-2 border-[#1B1815] shadow-[0_8px_30px_rgba(27,24,21,0.08)] hover:shadow-[0_16px_40px_rgba(27,24,21,0.14)] hover:-translate-y-1"
                        : "bg-white border border-[#E1DDCF] shadow-[0_4px_24px_rgba(27,24,21,0.03)] hover:shadow-[0_12px_36px_rgba(27,24,21,0.08)] hover:-translate-y-0.5"
                    }`}
                  >
                    <div>
                      {/* Top Status Bar */}
                      <div className="flex items-center justify-between mb-4">
                        {live ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2E7A4F]/10 text-[#2E7A4F] border border-[#2E7A4F]/20 text-[11px] font-extrabold tracking-wider uppercase font-['Inter',sans-serif]">
                            <span className="w-2 h-2 rounded-full bg-[#2E7A4F] animate-pulse"></span>
                            Live Tatamis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ECE9DF] text-[#68645A] border border-[#E1DDCF] text-[11px] font-bold tracking-wider uppercase font-['Inter',sans-serif]">
                            Upcoming
                          </span>
                        )}
                        <span className="font-mono text-[12px] text-[#8C877C] font-semibold">
                          {eventDateStr}
                        </span>
                      </div>

                      {/* Tournament Title */}
                      <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-[22px] text-[#1B1815] mb-4 tracking-tight leading-snug group-hover:text-black transition-colors">
                        {t.name}
                      </h3>

                      {/* Details List */}
                      <div className="space-y-2.5 mb-2">
                        <div className="flex items-center gap-2.5 text-[#68645A] text-[14px]">
                          <svg className="w-4 h-4 text-[#8C877C] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                            <circle cx="12" cy="9" r="2.5" />
                          </svg>
                          <span className="truncate font-medium">{t.venue || t.city || "Championship Arena"}</span>
                        </div>

                        <div className="flex items-center gap-2.5 text-[#68645A] text-[14px]">
                          <svg className="w-4 h-4 text-[#8C877C] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          <span className="font-medium">
                            {live ? "Active Tatami Rings & Categories" : "Tatami Schedule & Category Allocation"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-6 pt-4 border-t border-[#E1DDCF]/60 flex items-center justify-between">
                      <span className={`text-[12.5px] ${live ? "font-semibold text-[#68645A]" : "font-medium text-[#8C877C]"}`}>
                        {live ? "Tatami Status & Athlete Queue" : "Category & Tatami Routing"}
                      </span>
                      {live ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B1815] text-[#F5F3EC] rounded-xl text-[13.5px] font-bold group-hover:bg-black transition-colors shadow-sm">
                          <span>Enter Floor</span>
                          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ECE9DF] text-[#1B1815] rounded-xl text-[13.5px] font-bold group-hover:bg-[#1B1815] group-hover:text-[#F5F3EC] transition-all">
                          <span>View Details</span>
                          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
