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

  const getEventDateKey = (dateVal: any): string => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal).split("T")[0];
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dt = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${dt}`;
    } catch {
      return String(dateVal).split("T")[0];
    }
  };

  const getEventStatus = (t: any): "live" | "upcoming" | "past" => {
    if (t.status === "completed" || t.status === "archived") return "past";
    if (t.status === "live") return "live";
    if (!t.event_date) return "upcoming";
    const dateKey = getEventDateKey(t.event_date);
    const rawKey = String(t.event_date).split("T")[0];
    if (dateKey === todayStr || rawKey === todayStr) {
      return "live";
    } else if (dateKey > todayStr || rawKey > todayStr) {
      return "upcoming";
    } else {
      return "past";
    }
  };

  // Strictly Stacked: 1. Live Events on top -> 2. Upcoming Events in middle -> 3. Over Events at bottom
  const liveTournaments = (tournaments || [])
    .filter((t) => getEventStatus(t) === "live")
    .sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime());

  const upcomingTournaments = (tournaments || [])
    .filter((t) => getEventStatus(t) === "upcoming")
    .sort((a, b) => new Date(a.event_date || 0).getTime() - new Date(b.event_date || 0).getTime());

  const pastTournaments = (tournaments || [])
    .filter((t) => getEventStatus(t) === "past")
    .sort((a, b) => new Date(b.event_date || 0).getTime() - new Date(a.event_date || 0).getTime());

  const allTournaments = [...liveTournaments, ...upcomingTournaments, ...pastTournaments];

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
        <section className="relative min-h-[calc(100svh-4rem)] min-h-[calc(100dvh-4rem)] md:min-h-0 md:h-[580px] lg:h-[620px] overflow-hidden bg-[#F5F3EC] border-b border-[#E1DDCF] flex flex-col justify-between md:justify-center">
          <div className="absolute inset-0 bg-[url('/hero-section.jpg')] bg-cover bg-[position:82%_center] md:bg-center opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F5F3EC] via-[#F5F3EC]/90 to-transparent md:via-[#F5F3EC]/60" />

          {/* 📱 MOBILE VIEW ONLY (md:hidden) */}
          <div className="relative max-w-7xl mx-auto px-6 sm:px-8 w-full pt-3 sm:pt-6 pb-12 sm:pb-14 flex-1 flex flex-col justify-between z-10 md:hidden">
            {/* Top: Header Text */}
            <div className="max-w-2xl pt-5 sm:pt-6">
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-[32px] sm:text-[44px] font-black tracking-[-0.03em] leading-[1.08] mb-2 text-[#1B1815]">
                Find Your Next Championship
              </h1>
              <p className="text-[#68645A] font-['Inter',sans-serif] font-normal text-[14px] sm:text-lg max-w-md leading-relaxed">
                Track live tatami rings, category assignments, and athlete queue status in real time.
              </p>
            </div>

            {/* Bullet points: single column with the exact spacing */}
            <div className="mt-11 sm:mt-10 mb-auto max-w-2xl">
              <div className="space-y-6 sm:space-y-7 max-w-[270px] sm:max-w-sm">
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Live tatami ring status</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Real-time match queues</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Category allocations</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Athlete bullpen tracking</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Instant bracket progression</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Match schedule routing</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Referee floor assignments</span>
                </div>
                <div className="flex items-center gap-2.5 text-[13.5px] sm:text-[14.5px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Live spectator scoreboards</span>
                </div>
              </div>
            </div>

            {/* Bottom: Button positioned right above Explore */}
            <div className="max-w-2xl w-full flex flex-col items-center pb-3">
              <Link
                href="#events"
                className="w-full sm:w-auto text-center px-8 py-3.5 bg-[#1B1815]/75 hover:bg-[#1B1815]/90 backdrop-blur-md border border-[#F5F3EC]/25 text-[#F5F3EC] font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[15px] rounded-xl transition-all shadow-[0_8px_24px_rgba(27,24,21,0.12)] hover:shadow-[0_12px_28px_rgba(27,24,21,0.2)] inline-block active:scale-[0.98]"
              >
                View Events
              </Link>
            </div>
          </div>

          {/* 💻 DESKTOP & LAPTOP VIEW ONLY (hidden md:flex) */}
          <div className="relative max-w-7xl mx-auto px-margin-desktop w-full py-16 hidden md:flex md:flex-col md:justify-center z-10">
            <div className="max-w-2xl">
              <h1 className="font-['Plus_Jakarta_Sans',sans-serif] text-[46px] lg:text-[54px] font-black tracking-[-0.03em] leading-[1.08] mb-3 text-[#1B1815]">
                Find Your Next Championship
              </h1>
              <p className="text-[#68645A] font-['Inter',sans-serif] font-normal text-lg lg:text-xl max-w-xl leading-relaxed mb-6">
                Track live tatami rings, category assignments, and athlete queue status in real time.
              </p>

              {/* 2-Column Desktop Grid for Bullet Points */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 max-w-xl mb-8">
                <div className="flex items-center gap-2.5 text-[14px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Live tatami ring status</span>
                </div>
                <div className="flex items-center gap-2.5 text-[14px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Instant bracket progression</span>
                </div>
                <div className="flex items-center gap-2.5 text-[14px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Real-time match queues</span>
                </div>
                <div className="flex items-center gap-2.5 text-[14px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Match schedule routing</span>
                </div>
                <div className="flex items-center gap-2.5 text-[14px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Category allocations</span>
                </div>
                <div className="flex items-center gap-2.5 text-[14px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Referee floor assignments</span>
                </div>
                <div className="flex items-center gap-2.5 text-[14px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Athlete bullpen tracking</span>
                </div>
                <div className="flex items-center gap-2.5 text-[14px] text-[#3D3A33] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1B1815] shrink-0" />
                  <span>Live spectator scoreboards</span>
                </div>
              </div>

              {/* Desktop View Events Button */}
              <div className="flex items-center gap-4">
                <Link
                  href="#events"
                  className="px-8 py-3.5 bg-[#1B1815] hover:bg-black text-[#F5F3EC] font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[15px] rounded-lg transition-all shadow-md hover:shadow-lg inline-block active:scale-[0.98]"
                >
                  View Events
                </Link>
              </div>
            </div>
          </div>

          {/* Explore indicator pinned to the bottom of the screen on mobile only */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center text-[#8C877C] animate-bounce pointer-events-none md:hidden opacity-85">
            <span className="text-[10px] font-bold tracking-widest uppercase font-['Plus_Jakarta_Sans',sans-serif] mb-0.5">Explore</span>
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </section>

        {/* Stats Bar */}
        <PublicStats />

        {/* Unified Events Grid */}
        <section id="events" className="max-w-7xl mx-auto px-6 sm:px-8 md:px-margin-desktop py-14 scroll-mt-20">
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
                const status = getEventStatus(t);
                const isLiveEvent = status === "live";
                const isUpcoming = status === "upcoming";
                const isPast = status === "past";

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
                      isLiveEvent
                        ? "bg-white border-2 border-[#1B1815] shadow-[0_8px_30px_rgba(27,24,21,0.08)] hover:shadow-[0_16px_40px_rgba(27,24,21,0.14)] hover:-translate-y-1"
                        : isUpcoming
                        ? "bg-white border border-[#E1DDCF] shadow-[0_4px_24px_rgba(27,24,21,0.03)] hover:shadow-[0_12px_36px_rgba(27,24,21,0.08)] hover:-translate-y-0.5"
                        : "bg-[#FAF9F5] border border-[#E1DDCF]/80 shadow-[0_2px_12px_rgba(27,24,21,0.02)] hover:shadow-[0_8px_24px_rgba(27,24,21,0.06)] hover:-translate-y-0.5 opacity-90 hover:opacity-100"
                    }`}
                  >
                    <div>
                      {/* Top Status Bar */}
                      <div className="flex items-center justify-between mb-4">
                        {isLiveEvent ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2E7A4F]/10 text-[#2E7A4F] border border-[#2E7A4F]/20 text-[11px] font-extrabold tracking-wider uppercase font-['Inter',sans-serif]">
                            <span className="w-2 h-2 rounded-full bg-[#2E7A4F] animate-pulse"></span>
                            Live
                          </span>
                        ) : isUpcoming ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2563EB]/10 text-[#1D4ED8] border border-[#2563EB]/20 text-[11px] font-extrabold tracking-wider uppercase font-['Inter',sans-serif]">
                            <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>
                            Upcoming
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ECE9DF] text-[#7A756B] border border-[#E1DDCF] text-[11px] font-bold tracking-wider uppercase font-['Inter',sans-serif]">
                            <span className="w-2 h-2 rounded-full bg-[#8C877C]"></span>
                            Over
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
                            {isLiveEvent
                              ? "Active Tatami Rings & Categories"
                              : isUpcoming
                              ? "Tatami Schedule & Category Allocation"
                              : "Final Match Results & Standings"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action */}
                    <div className="mt-6 pt-4 border-t border-[#E1DDCF]/60 flex items-center justify-between">
                      <span className={`text-[12.5px] ${isLiveEvent ? "font-semibold text-[#68645A]" : "font-medium text-[#8C877C]"}`}>
                        {isLiveEvent
                          ? "Tatami Status & Athlete Queue"
                          : isUpcoming
                          ? "Category & Tatami Routing"
                          : "Tournament Archive & Results"}
                      </span>
                      {isLiveEvent ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1B1815] text-[#F5F3EC] rounded-xl text-[13.5px] font-bold group-hover:bg-black transition-colors shadow-sm">
                          <span>Enter Floor</span>
                          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      ) : isUpcoming ? (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ECE9DF] text-[#1B1815] rounded-xl text-[13.5px] font-bold group-hover:bg-[#1B1815] group-hover:text-[#F5F3EC] transition-all">
                          <span>View Details</span>
                          <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ECE9DF] text-[#68645A] rounded-xl text-[13.5px] font-bold group-hover:bg-[#1B1815] group-hover:text-[#F5F3EC] transition-all">
                          <span>View Results</span>
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
