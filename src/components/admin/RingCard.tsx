import React from "react";

export type RingStatus = "Running" | "Paused" | "Completed" | "Empty";

export interface RingTimingData {
  startTime: number | null;
  isStarted: boolean;
  isRunning: boolean;
  isManuallyPaused: boolean;
  isAllCompleted: boolean;
  actualSeconds: number;
  expectedSeconds: number;
  diffSeconds: number;
}

interface RingCardProps {
  name: string;
  status: RingStatus;
  categoryName?: string;
  currentMatch?: number;
  totalMatches?: number;
  totalExpectedMatches?: number;
  divisionCount?: number;
  progressPercent?: number;
  estimatedFinish?: string;
  statusReason?: string;
  timing: RingTimingData;
  onTogglePause: () => void;
  formatTimeTook: (seconds: number) => string;
  formatTimeExpected: (seconds: number) => string;
}

export default function RingCard({
  name,
  status,
  categoryName = "Pending Next Category",
  currentMatch = 0,
  totalMatches = 0,
  totalExpectedMatches = 0,
  divisionCount = 0,
  progressPercent = 0,
  estimatedFinish = "--:--",
  statusReason,
  timing,
  onTogglePause,
  formatTimeTook,
  formatTimeExpected,
}: RingCardProps) {
  // Status resolution matching client-side spectator page
  const isPaused = timing.isManuallyPaused || status === "Paused";
  const isCompleted = !isPaused && (timing.isAllCompleted || status === "Completed");
  const isRunning = !isPaused && !isCompleted && (status === "Running" || timing.isRunning);
  const isIdle = !isPaused && !isCompleted && !isRunning;

  // Border accent color based on resolved status
  let borderLeftColor = "border-outline-variant";
  if (isPaused) {
    borderLeftColor = "border-amber-500";
  } else if (isCompleted) {
    borderLeftColor = "border-blue-600";
  } else if (isRunning) {
    borderLeftColor = "border-secondary";
  }

  return (
    <div
      className={`bg-surface-container-lowest border-l-4 ${borderLeftColor} p-4 md:p-5 border border-outline-variant rounded-xl shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
        isIdle ? "opacity-80" : ""
      }`}
    >
      <div>
        {/* Header: Tatami Name + Status Badge + Compact Pause Icon Button */}
        <div className="flex justify-between items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="material-symbols-outlined text-outline text-[18px] shrink-0">sports_martial_arts</span>
            <span className="font-headline-sm text-base md:text-lg font-bold text-primary whitespace-nowrap truncate">
              {name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {isPaused ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                PAUSED
              </span>
            ) : isCompleted ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
                COMPLETED
              </span>
            ) : isRunning ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                RUNNING
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full font-label-caps text-[10px] font-bold uppercase tracking-wider bg-surface-container text-on-surface-variant border border-outline-variant/60">
                IDLE
              </span>
            )}

            <button
              type="button"
              onClick={onTogglePause}
              title={timing.isManuallyPaused ? `Resume ${name} clock` : `Pause ${name} clock`}
              className={`w-7 h-7 rounded-md border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                timing.isManuallyPaused
                  ? "bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 shadow-2xs"
                  : "bg-surface-container hover:bg-surface-container-high border-outline-variant text-on-surface-variant hover:text-primary"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                {timing.isManuallyPaused ? "play_arrow" : "pause"}
              </span>
            </button>
          </div>
        </div>

        {/* Division Title & Match Status */}
        <div className="mb-3">
          <h4
            className="font-bold text-sm text-primary truncate leading-tight"
            title={categoryName}
          >
            {categoryName}
          </h4>
          <div className="flex items-center justify-between text-xs text-on-surface-variant mt-1.5">
            <span className="font-semibold text-primary font-data-mono">
              {status === "Empty" && currentMatch === 0 && totalMatches === 0
                ? "No active division"
                : `Match ${currentMatch} of ${totalMatches || 1}`}
            </span>
            <span className="text-[11px] font-data-mono text-on-surface-variant">
              {divisionCount} {divisionCount === 1 ? "division" : "divisions"} queued
            </span>
          </div>
        </div>

        {/* Time Elapsed / Expected & Pace Block */}
        <div className="bg-surface-container-low/60 rounded-lg p-3 mb-3 border border-outline-variant/40">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-label-caps text-on-surface-variant uppercase tracking-wider font-semibold">
              Time Elapsed / Expected
            </span>
            {timing.isStarted && (
              <span
                className={`font-label-caps text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  timing.diffSeconds > 60
                    ? "bg-amber-100 text-amber-800"
                    : timing.diffSeconds < -60
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-surface-container text-secondary"
                }`}
              >
                {timing.diffSeconds > 60
                  ? `+${Math.ceil(timing.diffSeconds / 60)}m Behind`
                  : timing.diffSeconds < -60
                  ? `${Math.floor(Math.abs(timing.diffSeconds) / 60)}m Ahead`
                  : "On Pace"}
              </span>
            )}
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className="font-data-mono text-xl md:text-2xl font-bold text-primary tracking-tight"
              suppressHydrationWarning
            >
              {timing.isStarted ? formatTimeTook(timing.actualSeconds) : "-- : --"}
            </span>
            <span className="font-data-mono text-xs text-on-surface-variant">
              / {timing.expectedSeconds > 0 ? formatTimeExpected(timing.expectedSeconds) : "--"}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden mb-3">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              timing.diffSeconds > 60
                ? "bg-amber-500"
                : isCompleted
                ? "bg-blue-600"
                : "bg-secondary"
            }`}
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2.5 border-t border-outline-variant/60 text-xs text-on-surface-variant">
        <span className="font-data-mono text-[11px] italic" suppressHydrationWarning>
          {isIdle ? "Waiting for Assign" : `Est. Finish: ${estimatedFinish}`}
        </span>
        <span className="font-label-caps text-[10px] uppercase font-bold text-outline">
          {totalMatches > 0 && currentMatch < totalMatches
            ? `${totalMatches - currentMatch} matches left`
            : isCompleted
            ? "Completed"
            : isIdle
            ? "Idle"
            : "Active"}
        </span>
      </div>
    </div>
  );
}
