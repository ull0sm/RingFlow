"use client";

import React, { useState } from "react";
import Link from "next/link";

interface Tournament {
  id: string;
  name: string;
  venue?: string;
  city?: string;
  event_date?: string;
  status?: string;
  rings?: { id: string }[];
  categories?: { id: string }[];
}

interface PublicTournamentGridProps {
  tournaments: Tournament[];
  todayStr: string;
}

export default function PublicTournamentGrid({ tournaments, todayStr }: PublicTournamentGridProps) {
  const [selectedUpcoming, setSelectedUpcoming] = useState<Tournament | null>(null);

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

  const getEventStatus = (t: Tournament): "live" | "upcoming" | "past" => {
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

  const formatDate = (dateVal?: string) => {
    if (!dateVal) return "DATE TBD";
    return new Date(dateVal).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (tournaments.length === 0) {
    return (
      <div className="bg-white border border-[#E1DDCF] rounded-2xl p-12 text-center max-w-lg mx-auto">
        <p className="text-[#68645A] text-[15px] font-medium">No tournaments currently scheduled.</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((t) => {
          const status = getEventStatus(t);
          const isLiveEvent = status === "live";
          const isUpcoming = status === "upcoming";
          const isPast = status === "past";
          const eventDateStr = formatDate(t.event_date);

          // 1. LIVE EVENT CARD (Redirects directly to event floor)
          if (isLiveEvent) {
            return (
              <Link
                key={t.id}
                href={`/public/event/${t.id}`}
                scroll={true}
                className="rounded-2xl p-6 md:p-7 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden bg-white border-2 border-[#1B1815] shadow-[0_8px_30px_rgba(27,24,21,0.08)] hover:shadow-[0_16px_40px_rgba(27,24,21,0.14)] hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2E7A4F]/10 text-[#2E7A4F] border border-[#2E7A4F]/20 text-[11px] font-extrabold tracking-wider uppercase font-['Inter',sans-serif]">
                      <span className="w-2 h-2 rounded-full bg-[#2E7A4F] animate-pulse" />
                      Live
                    </span>
                    <span className="font-mono text-[12px] text-[#8C877C] font-semibold">
                      {eventDateStr}
                    </span>
                  </div>

                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-[22px] text-[#1B1815] mb-4 tracking-tight leading-snug group-hover:text-black transition-colors">
                    {t.name}
                  </h3>

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
                      <span className="font-medium">Active Tatami Rings & Categories</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E1DDCF]/60 flex items-center justify-between gap-2">
                  <span className="text-[12px] sm:text-[12.5px] truncate font-semibold text-[#68645A]">
                    Tatami Status & Queues
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#1B1815] text-[#F5F3EC] rounded-xl text-[12.5px] sm:text-[13.5px] font-bold group-hover:bg-black transition-colors shadow-sm whitespace-nowrap shrink-0">
                    <span>Enter Floor</span>
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </div>
              </Link>
            );
          }

          // 2. UPCOMING EVENT CARD (Opens notification modal informing user of the date)
          if (isUpcoming) {
            return (
              <div
                key={t.id}
                onClick={() => setSelectedUpcoming(t)}
                className="rounded-2xl p-6 md:p-7 transition-all duration-300 flex flex-col justify-between group cursor-pointer relative overflow-hidden bg-white border border-[#E1DDCF] shadow-[0_4px_24px_rgba(27,24,21,0.03)] hover:shadow-[0_12px_36px_rgba(27,24,21,0.08)] hover:-translate-y-0.5"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2563EB]/10 text-[#1D4ED8] border border-[#2563EB]/20 text-[11px] font-extrabold tracking-wider uppercase font-['Inter',sans-serif]">
                      <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                      Upcoming
                    </span>
                    <span className="font-mono text-[12px] text-[#8C877C] font-semibold">
                      {eventDateStr}
                    </span>
                  </div>

                  <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-[22px] text-[#1B1815] mb-4 tracking-tight leading-snug group-hover:text-black transition-colors">
                    {t.name}
                  </h3>

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
                      <span className="font-medium">Tatami Schedule & Category Allocation</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E1DDCF]/60 flex items-center justify-between gap-2">
                  <span className="text-[12px] sm:text-[12.5px] truncate font-medium text-[#8C877C]">
                    Schedule & Routing
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedUpcoming(t);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-[#ECE9DF] text-[#1B1815] rounded-xl text-[12.5px] sm:text-[13.5px] font-bold group-hover:bg-[#1B1815] group-hover:text-[#F5F3EC] transition-all whitespace-nowrap shrink-0"
                  >
                    <span>View Details</span>
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          }

          // 3. OVER / PAST EVENT CARD (Static info card only, no results text, no redirect, no action button)
          return (
            <div
              key={t.id}
              className="rounded-2xl p-6 md:p-7 flex flex-col justify-between relative overflow-hidden bg-[#FAF9F5] border border-[#E1DDCF]/80 shadow-[0_2px_12px_rgba(27,24,21,0.02)] opacity-85 cursor-default"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ECE9DF] text-[#7A756B] border border-[#E1DDCF] text-[11px] font-bold tracking-wider uppercase font-['Inter',sans-serif]">
                    <span className="w-2 h-2 rounded-full bg-[#8C877C]" />
                    Over
                  </span>
                  <span className="font-mono text-[12px] text-[#8C877C] font-semibold">
                    {eventDateStr}
                  </span>
                </div>

                <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[22px] text-[#1B1815]/90 mb-4 tracking-tight leading-snug">
                  {t.name}
                </h3>

                <div className="space-y-2.5 mb-2">
                  <div className="flex items-center gap-2.5 text-[#7A756B] text-[14px]">
                    <svg className="w-4 h-4 text-[#8C877C] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                    <span className="truncate font-medium">{t.venue || t.city || "Championship Arena"}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[#7A756B] text-[14px]">
                    <svg className="w-4 h-4 text-[#8C877C] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 12l2 2 4-4" />
                      <circle cx="12" cy="12" r="10" />
                    </svg>
                    <span className="font-medium">Tournament concluded</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#E1DDCF]/60 flex items-center justify-between">
                <span className="text-[12px] sm:text-[12.5px] font-medium text-[#8C877C]">
                  Event concluded
                </span>
                <span className="text-[11.5px] font-semibold text-[#8C877C] bg-[#ECE9DF]/80 px-2.5 py-1 rounded-md border border-[#E1DDCF]/60">
                  Completed
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Upcoming Tournament Notification Modal ── */}
      {selectedUpcoming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setSelectedUpcoming(null)}
        >
          <div
            className="bg-[#F5F3EC] border border-[#E1DDCF] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Icon */}
            <button
              type="button"
              onClick={() => setSelectedUpcoming(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#E1DDCF]/60 hover:bg-[#E1DDCF] flex items-center justify-center text-[#1B1815] transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2563EB]/10 text-[#1D4ED8] border border-[#2563EB]/20 text-[11px] font-extrabold tracking-wider uppercase font-['Inter',sans-serif]">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                Upcoming Tournament
              </span>
            </div>

            <h3 className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-[22px] text-[#1B1815] mb-3 leading-snug">
              {selectedUpcoming.name}
            </h3>

            {/* Date & Venue Box */}
            <div className="bg-white border border-[#E1DDCF] rounded-xl p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2.5 text-[#1B1815] text-[14px] font-semibold">
                <svg className="w-4 h-4 text-[#2563EB] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>{formatDate(selectedUpcoming.event_date)}</span>
              </div>
              <div className="flex items-center gap-2.5 text-[#68645A] text-[13.5px]">
                <svg className="w-4 h-4 text-[#8C877C] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                <span className="truncate">{selectedUpcoming.venue || selectedUpcoming.city || "Championship Arena"}</span>
              </div>
            </div>

            <p className="text-[#68645A] text-[14px] leading-relaxed mb-6">
              This tournament is scheduled for{" "}
              <strong className="text-[#1B1815] font-bold">{formatDate(selectedUpcoming.event_date)}</strong> and is not live yet.
              Please check back on that day to follow live tatami rings, category assignments, and athlete queue progression in real time!
            </p>

            <button
              type="button"
              onClick={() => setSelectedUpcoming(null)}
              className="w-full py-3 bg-[#1B1815] hover:bg-black text-[#F5F3EC] font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[14.5px] rounded-xl transition-colors shadow-sm"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
}
