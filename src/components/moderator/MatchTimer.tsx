"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY_PREFIX = "ringflow_timer_duration_ms_";
const DEFAULT_DURATION_MS = 3 * 60 * 1000; // 3 minutes in milliseconds

interface MatchTimerProps {
  ringId: string;
  isPaused: boolean; // ring is paused – timer auto-pauses too
}

type TimerState = "idle" | "running" | "paused_timer" | "finished";

// Synthesise a double-blast referee whistle programmatically using the Web Audio API
const playBuzzerSound = () => {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();

    const playBlast = (startTime: number, duration: number) => {
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      // Dual high frequencies create a beating vibrato effect simulating a real whistle
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(1800, ctx.currentTime + startTime);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1840, ctx.currentTime + startTime);

      gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
      // Quick linear fade-in
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + startTime + 0.05);
      // Steady hold
      gainNode.gain.setValueAtTime(0.2, ctx.currentTime + startTime + duration - 0.1);
      // Exponential decay
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(ctx.currentTime + startTime);
      osc2.start(ctx.currentTime + startTime);

      osc1.stop(ctx.currentTime + startTime + duration);
      osc2.stop(ctx.currentTime + startTime + duration);
    };

    // Play two sets of referee double-blasts (let it ring twice!)
    // First set
    playBlast(0, 0.45);
    playBlast(0.55, 0.75);

    // Second set (after 1.8 seconds)
    playBlast(1.8, 0.45);
    playBlast(2.35, 0.75);
    
  } catch (e) {
    console.error("Web Audio API error playing sound:", e);
  }
};

export default function MatchTimer({ ringId, isPaused }: MatchTimerProps) {
  const storageKey = `${STORAGE_KEY_PREFIX}${ringId}`;

  // --- Initial client-side mounting tracking to prevent hydration mismatch ---
  const [isMounted, setIsMounted] = useState(false);

  // --- Persistent configured duration (milliseconds) ---
  const [configuredDuration, setConfiguredDuration] = useState<number>(DEFAULT_DURATION_MS);

  // --- Live timer state (milliseconds) ---
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_DURATION_MS);
  const [timerState, setTimerState] = useState<TimerState>("idle");

  // --- Settings panel state ---
  const [showSettings, setShowSettings] = useState(false);
  const [editMinutes, setEditMinutes] = useState<string>(
    String(Math.floor(DEFAULT_DURATION_MS / 60000))
  );
  const [editSeconds, setEditSeconds] = useState<string>(
    String(Math.floor((DEFAULT_DURATION_MS % 60000) / 1000)).padStart(2, "0")
  );
  const [editMilliseconds, setEditMilliseconds] = useState<string>(
    String(DEFAULT_DURATION_MS % 1000).padStart(3, "0")
  );

  const prevIsPausedRef = useRef(isPaused);

  // --- Gestures State ---
  const [isPressing, setIsPressing] = useState(false);
  const longPressTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLongPressedRef = useRef(false);

  // Sync configured duration from localStorage on mount (handles SSR/hydration)
  useEffect(() => {
    setIsMounted(true);
    const stored = localStorage.getItem(storageKey);
    const val = stored ? parseInt(stored, 10) : DEFAULT_DURATION_MS;
    
    setConfiguredDuration(val);
    setTimeLeft(val);
    setEditMinutes(String(Math.floor(val / 60000)));
    setEditSeconds(String(Math.floor((val % 60000) / 1000)).padStart(2, "0"));
    setEditMilliseconds(String(val % 1000).padStart(3, "0"));
  }, [storageKey]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    };
  }, []);

  // Auto-pause timer when ring is paused; resume when ring resumes
  useEffect(() => {
    if (prevIsPausedRef.current === isPaused) return;
    prevIsPausedRef.current = isPaused;

    if (isPaused && timerState === "running") {
      setTimerState("paused_timer");
    } else if (!isPaused && timerState === "paused_timer") {
      setTimerState("running");
    }
  }, [isPaused, timerState]);

  // High-precision drift-free countdown interval running at ~30 FPS
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (timerState === "running") {
      const start = Date.now() - (configuredDuration - timeLeft);
      interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = configuredDuration - elapsed;
        if (remaining <= 0) {
          setTimeLeft(0);
          setTimerState("finished");
          playBuzzerSound(); // Trigger double whistle sound when time is up
        } else {
          setTimeLeft(remaining);
        }
      }, 33); // ~30fps for smooth milliseconds rendering
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, configuredDuration, timeLeft]);

  const handleStart = useCallback(() => {
    if (timerState === "idle" || timerState === "finished") {
      setTimeLeft(configuredDuration);
    }
    setTimerState("running");
  }, [timerState, configuredDuration]);

  const handlePauseTimer = useCallback(() => {
    setTimerState("paused_timer");
  }, []);

  const handleResetTimer = useCallback(() => {
    setTimerState("idle");
    setTimeLeft(configuredDuration);
  }, [configuredDuration]);

  // Pointer event handlers for tap-and-hold to Reset, short tap to Play/Pause
  const handlePointerDown = (e: React.PointerEvent) => {
    e.currentTarget.releasePointerCapture(e.pointerId);

    hasLongPressedRef.current = false;
    setIsPressing(true);

    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);

    longPressTimeoutRef.current = setTimeout(() => {
      handleResetTimer();
      hasLongPressedRef.current = true;
      setIsPressing(false);
      
      // Vibrate mobile device if supported
      if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 850); // 850ms hold to reset
  };

  const handlePointerUp = () => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    setIsPressing(false);

    if (!hasLongPressedRef.current) {
      // Short tap: Play/Pause toggler
      if (isPaused && timerState !== "running") {
        return;
      }
      if (timerState === "running") {
        handlePauseTimer();
      } else {
        handleStart();
      }
    }
    hasLongPressedRef.current = false;
  };

  const handlePointerLeave = () => {
    if (longPressTimeoutRef.current) clearTimeout(longPressTimeoutRef.current);
    setIsPressing(false);
  };

  const handleSaveConfig = useCallback(() => {
    const mins = parseInt(editMinutes, 10) || 0;
    const secs = parseInt(editSeconds, 10) || 0;
    const ms = parseInt(editMilliseconds, 10) || 0;
    const totalMs = Math.max(10, mins * 60 * 1000 + secs * 1000 + ms);
    
    if (timerState === "idle") {
      // Save permanently
      setConfiguredDuration(totalMs);
      localStorage.setItem(storageKey, String(totalMs));
      setTimeLeft(totalMs);
    } else {
      // Adjust session-only time
      setTimeLeft(totalMs);
      if (timerState === "finished") {
        setTimerState("paused_timer"); // Let them resume with added time
      }
    }
    
    setShowSettings(false);
  }, [editMinutes, editSeconds, editMilliseconds, timerState, storageKey]);

  const handleResetConfig = useCallback(() => {
    if (timerState === "idle") {
      localStorage.removeItem(storageKey);
      setConfiguredDuration(DEFAULT_DURATION_MS);
      setTimeLeft(DEFAULT_DURATION_MS);
      setEditMinutes(String(Math.floor(DEFAULT_DURATION_MS / 60000)));
      setEditSeconds(String(Math.floor((DEFAULT_DURATION_MS % 60000) / 1000)).padStart(2, "0"));
      setEditMilliseconds(String(DEFAULT_DURATION_MS % 1000).padStart(3, "0"));
    } else {
      // Reset the current active run to the default configured baseline
      setTimeLeft(configuredDuration);
      setTimerState("idle");
      setEditMinutes(String(Math.floor(configuredDuration / 60000)));
      setEditSeconds(String(Math.floor((configuredDuration % 60000) / 1000)).padStart(2, "0"));
      setEditMilliseconds(String(configuredDuration % 1000).padStart(3, "0"));
    }
    setShowSettings(false);
  }, [timerState, storageKey, configuredDuration]);

  // Constraints helpers
  const handleSecondsChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) { setEditSeconds(""); return; }
    setEditSeconds(String(Math.min(59, Math.max(0, num))));
  };

  const handleMsChange = (val: string) => {
    const num = parseInt(val, 10);
    if (isNaN(num)) { setEditMilliseconds(""); return; }
    setEditMilliseconds(String(Math.min(999, Math.max(0, num))));
  };

  // Formatting display (Minutes:Seconds.Milliseconds)
  const displayMinutes = Math.floor(timeLeft / 60000);
  const displaySeconds = Math.floor((timeLeft % 60000) / 1000);
  const displayMs = timeLeft % 1000;
  
  const formattedTime = `${String(displayMinutes).padStart(2, "0")}:${String(displaySeconds).padStart(2, "0")}.${String(displayMs).padStart(3, "0")}`;
  const progress = configuredDuration > 0 ? ((configuredDuration - timeLeft) / configuredDuration) * 100 : 0;

  const isFinished = timerState === "finished";
  const isRunning = timerState === "running";
  const isTimerPaused = timerState === "paused_timer";
  const isIdle = timerState === "idle";

  const ringColor = isFinished
    ? "text-error"
    : isRunning
    ? "text-secondary"
    : isTimerPaused
    ? "text-amber-600"
    : "text-on-surface-variant";

  const progressColor = isFinished
    ? "bg-error"
    : isRunning
    ? "bg-secondary"
    : isTimerPaused
    ? "bg-amber-500"
    : "bg-outline";

  return (
    <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden mb-10">
      {/* Header */}
      <div className="flex justify-between items-center px-5 pt-5 pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">timer</span>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant tracking-widest">MATCH TIMER</h3>
          {isRunning && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-label-caps text-[9px] tracking-wider animate-pulse">
              LIVE
            </span>
          )}
          {isFinished && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-error/10 text-error font-label-caps text-[9px] tracking-wider animate-pulse">
              TIME UP
            </span>
          )}
          {isTimerPaused && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-label-caps text-[9px] tracking-wider">
              PAUSED
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setShowSettings((prev) => {
              if (!prev) {
                // If active/paused, load the remaining timeLeft into inputs
                const targetTime = timerState === "idle" ? configuredDuration : timeLeft;
                setEditMinutes(String(Math.floor(targetTime / 60000)));
                setEditSeconds(String(Math.floor((targetTime % 60000) / 1000)).padStart(2, "0"));
                setEditMilliseconds(String(targetTime % 1000).padStart(3, "0"));
              }
              return !prev;
            });
          }}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          title="Configure timer"
        >
          <span className="material-symbols-outlined text-[18px]">tune</span>
        </button>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mx-5 mb-4 p-4 bg-surface-container-low border border-outline-variant rounded-xl space-y-4">
          <p className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">
            {timerState === "idle" ? "SET DEFAULT TIMER DURATION" : "EDIT ACTIVE SESSION TIMER"}
          </p>
          
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1 flex-1">
              <label className="font-label-caps text-[9px] text-on-surface-variant tracking-wider">MINUTES</label>
              <input
                type="number"
                min={0}
                max={99}
                value={editMinutes}
                onChange={(e) => setEditMinutes(e.target.value)}
                className="w-full text-center bg-surface-container-lowest border border-outline-variant rounded-lg p-3 font-data-mono text-lg font-bold text-primary outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>
            <span className="font-data-mono text-xl text-on-surface-variant mt-4">:</span>
            <div className="flex flex-col gap-1 flex-1">
              <label className="font-label-caps text-[9px] text-on-surface-variant tracking-wider">SECONDS</label>
              <input
                type="number"
                min={0}
                max={59}
                value={editSeconds}
                onChange={(e) => handleSecondsChange(e.target.value)}
                className="w-full text-center bg-surface-container-lowest border border-outline-variant rounded-lg p-3 font-data-mono text-lg font-bold text-primary outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>
            <span className="font-data-mono text-xl text-on-surface-variant mt-4">.</span>
            <div className="flex flex-col gap-1 flex-1">
              <label className="font-label-caps text-[9px] text-on-surface-variant tracking-wider">MILLIS</label>
              <input
                type="number"
                min={0}
                max={999}
                value={editMilliseconds}
                onChange={(e) => handleMsChange(e.target.value)}
                className="w-full text-center bg-surface-container-lowest border border-outline-variant rounded-lg p-3 font-data-mono text-lg font-bold text-primary outline-none focus:border-secondary focus:ring-1 focus:ring-secondary"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2 border-t border-outline-variant/30">
            <button
              onClick={handleSaveConfig}
              className="flex-1 py-2.5 bg-primary text-white font-label-caps text-label-caps rounded-lg hover:opacity-90 active:scale-95 transition-all"
            >
              SAVE
            </button>
            <button
              onClick={handleResetConfig}
              title={timerState === "idle" ? "Restore default (3:00.000)" : "Reset session back to configured duration"}
              className="px-4 py-2.5 border border-outline-variant text-on-surface-variant font-label-caps text-[10px] rounded-lg hover:bg-surface-container-high active:scale-95 transition-all flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[14px]">restart_alt</span>
              RESET
            </button>
            <button
              onClick={() => setShowSettings(false)}
              className="px-4 py-2.5 border border-outline-variant text-on-surface-variant font-label-caps text-[10px] rounded-lg hover:bg-surface-container active:scale-95 transition-all"
            >
              CANCEL
            </button>
          </div>
          
          <p className="text-[10px] text-on-surface-variant opacity-60 font-body-sm">
            {timerState === "idle" 
              ? "This sets the default starting time for all future matches." 
              : "This adjusts the remaining time for the current match only. A tap-and-hold reset on the clock will restore the default configured duration."}
          </p>
        </div>
      )}

      {/* Timer Display */}
      <div className="px-5 pb-5 space-y-4">
        {/* Big Clock */}
        <div className="flex flex-col items-center justify-center py-4">
          <span
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className={`cursor-pointer select-none font-data-mono text-4xl sm:text-5xl font-black tracking-wider transition-all duration-300 ${ringColor} ${isFinished ? "animate-pulse" : ""} ${isPressing ? "scale-90 opacity-70" : ""} flex items-baseline`}
            title="Tap to Play/Pause • Hold to Reset"
          >
            {/* Prevent rendering text during hydration to avoid mismatch error */}
            {isMounted ? (
              <>
                <span>{String(displayMinutes).padStart(2, "0")}:{String(displaySeconds).padStart(2, "0")}</span>
                <span className="text-xl sm:text-2xl font-bold opacity-70 ml-0.5">.{String(displayMs).padStart(3, "0")}</span>
              </>
            ) : (
              // Matching fallback matching server SSR render exactly
              <>
                <span>03:00</span>
                <span className="text-xl sm:text-2xl font-bold opacity-70 ml-0.5">.000</span>
              </>
            )}
          </span>
          <span className="text-[9px] text-on-surface-variant font-label-caps opacity-50 tracking-wider mt-2 select-none pointer-events-none">
            TAP TO PLAY/PAUSE • HOLD TO RESET
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${progressColor}`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </section>
  );
}
