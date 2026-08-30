"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import "./public-spectator.css";

interface Tournament {
  id: string;
  name: string;
  event_date?: string;
  venue?: string;
  city?: string;
  status?: string;
}

interface Ring {
  id: string;
  name: string;
  ring_order: number;
  mat_name?: string;
  access_code?: string;
  tournament_id: string;
}

interface CategoryAssignment {
  id: string;
  ring_id: string;
  category_id: string;
  queue_order: number;
  status: "pending" | "running" | "paused" | "completed";
  matches_completed: number;
  completed_at?: string;
  categories?: {
    name: string;
    athletes_count: number;
    expected_matches: number;
  };
}

interface AthleteSearchResult {
  id: string;
  name: string;
  chest_number?: string;
  category_id?: string;
  categories?: any;
}

const statusMeta = {
  run: { cls: "spectator-status-run", label: "LIVE" },
  pause: { cls: "spectator-status-pause", label: "PAUSED" },
  idle: { cls: "spectator-status-idle", label: "IDLE" },
  queued: { cls: "spectator-status-queued", label: "QUEUED" },
  unscheduled: { cls: "spectator-status-unscheduled", label: "UNSCHEDULED" },
};

function tileMarkup(completed: number, total: number) {
  const safeTotal = Math.max(1, total);
  const safeCompleted = Math.min(safeTotal, Math.max(0, completed));
  const pct = Math.round((safeCompleted / safeTotal) * 100);
  const filled = Math.min(10, Math.round((safeCompleted / safeTotal) * 10));
  return { pct, filled };
}

const SEARCH_PHRASES = [
  "Search by athlete name...",
  "Search by athlete chest number...",
  "Search by #241, division, or mat...",
];

export default function PublicEventClient({
  tournament,
  initialRings,
  initialAssignments,
  categories,
}: {
  tournament: Tournament;
  initialRings: Ring[];
  initialAssignments: CategoryAssignment[];
  categories: any[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [rings, setRings] = useState<Ring[]>(initialRings);
  const [assignments, setAssignments] = useState<CategoryAssignment[]>(initialAssignments);
  const [flashingMatId, setFlashingMatId] = useState<string | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<AthleteSearchResult[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);

  // Animated typewriter placeholder with blinking cursor
  const [typedPlaceholder, setTypedPlaceholder] = useState("");
  const [isCursorBlinking, setIsCursorBlinking] = useState(true);

  // Realtime sync timer
  const [secondsAgo, setSecondsAgo] = useState(0);

  const searchWrapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const matCardsRef = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Blinking cursor
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const cursorInterval = setInterval(() => {
      setIsCursorBlinking((prev) => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  // Typewriter effect
  useEffect(() => {
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let timer: NodeJS.Timeout;

    const tick = () => {
      const fullPhrase = SEARCH_PHRASES[phraseIdx];

      if (!isDeleting) {
        charIdx++;
        setTypedPlaceholder(fullPhrase.substring(0, charIdx));

        if (charIdx >= fullPhrase.length) {
          isDeleting = true;
          timer = setTimeout(tick, 1800);
          return;
        }
        timer = setTimeout(tick, 70);
      } else {
        charIdx--;
        setTypedPlaceholder(fullPhrase.substring(0, charIdx));

        if (charIdx <= 0) {
          isDeleting = false;
          phraseIdx = (phraseIdx + 1) % SEARCH_PHRASES.length;
          timer = setTimeout(tick, 350);
          return;
        }
        timer = setTimeout(tick, 35);
      }
    };

    timer = setTimeout(tick, 200);
    return () => clearTimeout(timer);
  }, []);

  // Sync Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsAgo((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const syncTimeText = useMemo(() => {
    if (secondsAgo <= 2) return "just now";
    return `${secondsAgo}s ago`;
  }, [secondsAgo]);

  // Flash card trigger
  const triggerFlash = (matId: string, duration = 1200) => {
    setFlashingMatId(matId);
    setTimeout(() => {
      setFlashingMatId((prev) => (prev === matId ? null : prev));
    }, duration);
  };

  // Realtime Subscriptions
  useEffect(() => {
    const channel = supabase
      .channel(`public_dashboard_${tournament.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rings", filter: `tournament_id=eq.${tournament.id}` },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setRings((prev) => prev.map((r) => (r.id === payload.new.id ? { ...r, ...payload.new } : r)));
            setSecondsAgo(0);
            triggerFlash(payload.new.id);
          } else if (payload.eventType === "INSERT") {
            setRings((prev) => [...prev, payload.new as Ring].sort((a, b) => a.ring_order - b.ring_order));
            setSecondsAgo(0);
          } else if (payload.eventType === "DELETE") {
            setRings((prev) => prev.filter((r) => r.id !== payload.old.id));
            setSecondsAgo(0);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "category_assignments" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setAssignments((prev) => {
              const copy = [...prev];
              const idx = copy.findIndex((a) => a.id === payload.new.id);
              if (idx > -1) {
                copy[idx] = { ...copy[idx], ...payload.new };
              } else {
                copy.push(payload.new as CategoryAssignment);
              }
              return copy;
            });
            setSecondsAgo(0);
            if (payload.new.ring_id) {
              triggerFlash(payload.new.ring_id);
            }
          } else if (payload.eventType === "INSERT") {
            setAssignments((prev) => [...prev, payload.new as CategoryAssignment]);
            setSecondsAgo(0);
          } else if (payload.eventType === "DELETE") {
            setAssignments((prev) => prev.filter((a) => a.id !== payload.old.id));
            setSecondsAgo(0);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, tournament.id]);

  // Athlete Search Query
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    setIsSearching(true);
    const cleanQ = q.replace(/^#/, "");

    const fetchAthletes = async () => {
      const { data, error } = await supabase
        .from("athletes")
        .select("id, name, chest_number, category_id, categories(name)")
        .eq("tournament_id", tournament.id)
        .or(`name.ilike.%${cleanQ}%,chest_number.ilike.%${cleanQ}%`)
        .limit(8);

      if (!error && data) {
        setSearchResults(data as unknown as AthleteSearchResult[]);
      } else {
        setSearchResults([]);
      }
      setIsSearching(false);
      setIsSearchOpen(true);
      setActiveIndex(-1);
    };

    const debounce = setTimeout(fetchAthletes, 200);
    return () => clearTimeout(debounce);
  }, [searchQuery, tournament.id, supabase]);

  // Outside click listener for search
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Compute ring assignment for athlete
  const getAthleteRingStatus = (categoryId?: string) => {
    if (!categoryId) {
      return { status: "unscheduled" as const, matLabel: "Not yet allocated", ringId: null };
    }
    const assignment = assignments.find((a) => a.category_id === categoryId);
    if (!assignment) {
      return { status: "unscheduled" as const, matLabel: "Not yet allocated", ringId: null };
    }
    const ring = rings.find((r) => r.id === assignment.ring_id);
    if (!ring) {
      return { status: "unscheduled" as const, matLabel: "Not yet allocated", ringId: null };
    }

    const ringOrderNum = String(ring.ring_order || 1).padStart(2, "0");
    const matLabel = ring.mat_name
      ? `Tatami ${ringOrderNum} · ${ring.mat_name}`
      : `Tatami ${ringOrderNum}`;

    if (assignment.status === "running") {
      return { status: "run" as const, matLabel, ringId: ring.id };
    }
    if (assignment.status === "paused") {
      return { status: "pause" as const, matLabel, ringId: ring.id };
    }
    if (assignment.status === "pending") {
      return { status: "queued" as const, matLabel, ringId: ring.id };
    }
    return { status: "idle" as const, matLabel, ringId: ring.id };
  };

  const selectMatch = (matId: string | null) => {
    setIsSearchOpen(false);
    if (!matId) return;
    const card = matCardsRef.current[matId];
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
      triggerFlash(matId, 1600);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchOpen || searchResults.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && searchResults[activeIndex]) {
        const athlete = searchResults[activeIndex];
        const { ringId } = getAthleteRingStatus(athlete.category_id);
        selectMatch(ringId);
      }
    } else if (e.key === "Escape") {
      setIsSearchOpen(false);
    }
  };

  const runningCount = useMemo(() => {
    return rings.filter((ring) => {
      const active = assignments.find((a) => a.ring_id === ring.id && a.status === "running");
      return !!active;
    }).length;
  }, [rings, assignments]);

  const { isEventLive, isEventPast } = useMemo(() => {
    if (tournament.status === "completed" || tournament.status === "archived") {
      return { isEventLive: false, isEventPast: true };
    }
    if (tournament.status === "live") {
      return { isEventLive: true, isEventPast: false };
    }

    if (tournament.event_date) {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const day = String(now.getDate()).padStart(2, "0");
      const todayStr = `${year}-${month}-${day}`;

      const d = new Date(tournament.event_date);
      let dateKey = "";
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const dt = String(d.getDate()).padStart(2, "0");
        dateKey = `${y}-${m}-${dt}`;
      }
      const rawKey = String(tournament.event_date).split("T")[0];

      if (dateKey === todayStr || rawKey === todayStr) {
        return { isEventLive: true, isEventPast: false };
      } else if (dateKey > todayStr || rawKey > todayStr) {
        return { isEventLive: false, isEventPast: false };
      } else {
        return { isEventLive: false, isEventPast: true };
      }
    }

    if (runningCount > 0) {
      return { isEventLive: true, isEventPast: false };
    }

    return { isEventLive: false, isEventPast: false };
  }, [tournament, runningCount]);

  // Eyebrow text
  const eyebrowText = useMemo(() => {
    if (tournament.venue && tournament.city) {
      return `${tournament.venue}, ${tournament.city}`;
    }
    if (tournament.event_date) {
      return new Date(tournament.event_date).toLocaleDateString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
    return "TOURNAMENT FLOOR";
  }, [tournament]);

  return (
    <div className="spectator-root">
      <div className="spectator-page">
        {/* ---------- Header ---------- */}
        <header className="spectator-header">
          <div className="spectator-header__top">
            <Link href="/" className="spectator-back-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              All events
            </Link>
            {isEventLive ? (
              <span className="spectator-live-chip">
                <span className="spectator-beacon"></span>LIVE
              </span>
            ) : isEventPast ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ECE9DF] text-[#7A756B] border border-[#E1DDCF] text-[11px] font-bold tracking-wider uppercase font-['Inter',sans-serif]">
                <span className="w-2 h-2 rounded-full bg-[#8C877C]"></span>OVER
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2563EB]/10 text-[#1D4ED8] border border-[#2563EB]/20 text-[11px] font-extrabold tracking-wider uppercase font-['Inter',sans-serif]">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]"></span>UPCOMING
              </span>
            )}
          </div>
          <p className="spectator-eyebrow">{eyebrowText}</p>
          <h1 className="spectator-header__title">{tournament.name}</h1>
        </header>

        {/* ---------- Search Box ---------- */}
        <div className="spectator-search-wrap" ref={searchWrapRef}>
          <div className="spectator-search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              id="search-input"
              placeholder={typedPlaceholder ? `${typedPlaceholder}${isCursorBlinking ? "|" : " "}` : "Search..."}
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchQuery.trim().length > 0 && searchResults.length > 0) {
                  setIsSearchOpen(true);
                }
              }}
            />
            {searchQuery.length > 0 && (
              <button
                className="spectator-search-clear"
                id="search-clear"
                aria-label="Clear search"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setIsSearchOpen(false);
                  searchInputRef.current?.focus();
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Search Dropdown Results */}
          <div
            className={`spectator-search-results ${isSearchOpen ? "open" : ""}`}
            id="search-results"
            role="listbox"
          >
            {isSearching ? (
              <div className="spectator-no-results">Searching athletes...</div>
            ) : searchResults.length === 0 ? (
              <div className="spectator-no-results">No athletes match that search.</div>
            ) : (
              searchResults.map((a, i) => {
                const { status, matLabel, ringId } = getAthleteRingStatus(a.category_id);
                const meta = statusMeta[status];
                const parts = matLabel.match(/(Tatami \d+)(.*)/);

                return (
                  <div
                    key={a.id}
                    className={`spectator-result-row ${activeIndex === i ? "active" : ""}`}
                    role="option"
                    aria-selected={activeIndex === i}
                    data-index={i}
                    data-mat-id={ringId || ""}
                    onClick={() => selectMatch(ringId)}
                  >
                    <div className="spectator-result-main">
                      <div className="spectator-result-name-row">
                        <span className="spectator-result-chest mono">
                          #{a.chest_number || "-"}
                        </span>
                        <span className="spectator-result-name">{a.name}</span>
                      </div>
                      <div className="spectator-result-division">
                        {(Array.isArray(a.categories) ? a.categories[0]?.name : a.categories?.name) || "Uncategorized"}
                      </div>
                    </div>
                    <div className="spectator-result-side">
                      <div className="spectator-result-mat">
                        {parts ? (
                          <>
                            <strong>{parts[1]}</strong>
                            {parts[2]}
                          </>
                        ) : (
                          matLabel
                        )}
                      </div>
                      <span className={`spectator-status ${meta.cls}`}>
                        <span className="dot"></span>
                        {meta.label}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* ---------- Section Head ---------- */}
        <div className="spectator-section-head">
          <span className="spectator-section-title">Tournament floor</span>
          <div className="spectator-legend">
            <span className="spectator-legend-item">
              <span className="spectator-legend-dot run"></span>Running
            </span>
            <span className="spectator-legend-item">
              <span className="spectator-legend-dot pause"></span>Paused
            </span>
            <span className="spectator-legend-item">
              <span className="spectator-legend-dot idle"></span>Idle
            </span>
          </div>
        </div>

        {/* ---------- Mat Grid ---------- */}
        <div className="spectator-mat-grid" id="mat-grid">
          {rings.map((ring) => {
            const activeAssignment = assignments.find(
              (a) => a.ring_id === ring.id && (a.status === "running" || a.status === "paused")
            );
            const nextAssignment = assignments.find(
              (a) => a.ring_id === ring.id && a.status === "pending"
            );

            const state: "run" | "pause" | "idle" =
              activeAssignment?.status === "running"
                ? "run"
                : activeAssignment?.status === "paused"
                  ? "pause"
                  : "idle";

            const statusLabel =
              state === "run" ? "RUNNING" : state === "pause" ? "PAUSED" : "IDLE";

            const matNum = ring.ring_order
              ? String(ring.ring_order).padStart(2, "0")
              : ring.name.replace(/[^0-9]/g, "").padStart(2, "0") || "01";

            const subLabel = ring.mat_name || (ring.name.toLowerCase().includes("ring") ? `Mat ${ring.name.replace(/[^0-9]/g, "")}` : ring.name);

            const completed = activeAssignment?.matches_completed || 0;
            const total = activeAssignment?.categories?.expected_matches || 1;
            const { pct, filled } = tileMarkup(completed, total);

            const isFlashing = flashingMatId === ring.id;

            return (
              <div
                key={ring.id}
                ref={(el) => {
                  matCardsRef.current[ring.id] = el;
                }}
                className={`spectator-mat-card spectator-state-${state} ${isFlashing ? "flash" : ""
                  }`}
                data-mat-id={ring.id}
              >
                {/* Scoreboard Band */}
                <div className="spectator-mat-card__band">
                  <div className="spectator-mat-id">
                    <span className="spectator-mat-num scoreboard">{matNum}</span>
                    {subLabel && <span className="spectator-mat-sub">{subLabel}</span>}
                  </div>
                  <span className="spectator-band-status">
                    <span className="dot"></span>
                    {statusLabel}
                  </span>
                </div>

                {/* Perforation Notches */}
                <div className="spectator-notch left"></div>
                <div className="spectator-notch right"></div>

                {/* Card Inner */}
                <div className="spectator-mat-card__inner">
                  <div className="spectator-mat-card__body">
                    {state === "run" && activeAssignment && (
                      <>
                        <p className="spectator-division">
                          {activeAssignment.categories?.name}
                        </p>
                        <div className="spectator-progress-block">
                          <div className="spectator-tiles">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div
                                key={i}
                                className={`spectator-tile ${i < filled ? "filled" : ""}`}
                              />
                            ))}
                          </div>
                          <div className="spectator-progress-label">
                            <span>
                              Match <span className="mono">{completed}</span> of{" "}
                              <span className="mono">{total}</span>
                            </span>
                            <span className="spectator-progress-pct mono">{pct}%</span>
                          </div>
                        </div>
                      </>
                    )}

                    {state === "pause" && activeAssignment && (
                      <>
                        <div className="spectator-alert-row">
                          <svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <circle cx="12" cy="12" r="9" />
                            <path d="M12 8v4M12 16h.01" />
                          </svg>
                          Ring paused / Timeout
                        </div>
                        <p className="spectator-division">
                          {activeAssignment.categories?.name}
                        </p>
                        <div className="spectator-progress-block">
                          <div className="spectator-tiles">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div
                                key={i}
                                className={`spectator-tile ${i < filled ? "filled" : ""}`}
                              />
                            ))}
                          </div>
                          <div className="spectator-progress-label">
                            <span>
                              Match <span className="mono">{completed}</span> of{" "}
                              <span className="mono">{total}</span>
                            </span>
                            <span className="spectator-progress-pct mono">{pct}%</span>
                          </div>
                        </div>
                      </>
                    )}

                    {state === "idle" && (
                      <p className="spectator-standby-msg">
                        Mat is clear. Ready for the next scheduled division.
                      </p>
                    )}
                  </div>

                  {/* Foot / Next Queue */}
                  <div className="spectator-mat-card__foot">
                    {nextAssignment?.categories?.name ? (
                      <>
                        <span className="spectator-next-label">NEXT</span>
                        <span className="spectator-next-value">
                          {nextAssignment.categories.name}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="spectator-next-label">NEXT</span>
                        <span className="spectator-next-value muted">
                          No upcoming division queued
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---------- Empty State ---------- */}
        <div
          className={`spectator-empty-state ${rings.length === 0 ? "open" : ""
            }`}
          id="empty-state"
        >
          <div className="spectator-empty-icon">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>
          <p className="spectator-empty-title">No tatamis configured</p>
          <p className="spectator-empty-body">
            Once mats are added to this tournament, live status and match progress
            will appear here automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
