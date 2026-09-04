"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { adjustMatchCount, finishCategory, setRingStatus, returnCategoryToQueue, logRingEvent, logoutModerator } from "@/actions/moderator";
import MatchTimer from "@/components/moderator/MatchTimer";

export default function ModeratorCurrentClient({ ringId, initialAssignments, allAthletes }: { ringId: string, initialAssignments: any[], allAthletes: any[] }) {
  const [assignments, setAssignments] = useState(initialAssignments);
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAssistanceModal, setShowAssistanceModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnConfirmText, setReturnConfirmText] = useState("");
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [syncErrorModal, setSyncErrorModal] = useState<{ title: string; message: string; isUnauthorized: boolean } | null>(null);
  const [showAdvancedModalOptions, setShowAdvancedModalOptions] = useState(false);
  const [isUpdatingMatch, setIsUpdatingMatch] = useState(false);
  const [activeDelta, setActiveDelta] = useState<number | null>(null);
  const [clickTimestamps, setClickTimestamps] = useState<number[]>([]);
  const [spamNotice, setSpamNotice] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel(`current_${ringId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'category_assignments',
        filter: `ring_id=eq.${ringId}`
      }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setAssignments(prev => {
            const idx = prev.findIndex(a => a.id === payload.new.id);
            if (idx > -1) {
              const copy = [...prev];
              copy[idx] = { ...copy[idx], ...payload.new };
              return copy;
            }
            return prev;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ringId, supabase]);

  const activeAssignment = assignments.find(a => a.status === 'running' || a.status === 'paused');

  if (!activeAssignment) {
    return (
      <section className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-24 h-24 bg-surface-container rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-outlined text-4xl text-outline" style={{ fontVariationSettings: '"FILL" 1' }}>event_busy</span>
        </div>
        <h2 className="font-headline-sm text-headline-sm mb-2">No category running</h2>
        <p className="text-on-surface-variant mb-8 max-w-sm">Please initialize the next category from the Queue to begin.</p>
        <button
          onClick={() => router.push(`/moderator/ring/${ringId}/queue`)}
          className="bg-primary text-on-primary px-8 py-3 rounded-lg font-bold flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>queue</span>
          Go to Queue
        </button>
      </section>
    );
  }

  const handleAdjustMatch = async (delta: number) => {
    if (isUpdatingMatch || loading) return;

    const now = Date.now();
    const windowMs = 2500;
    const recent = clickTimestamps.filter(t => now - t < windowMs);

    if (recent.length >= 2) {
      setClickTimestamps([]);
      setSpamNotice("One click = 😎 | 20 clicks = 🤡");
      setTimeout(() => setSpamNotice(null), 3500);
      return;
    }

    setClickTimestamps([...recent, now]);
    setIsUpdatingMatch(true);
    setActiveDelta(delta);

    try {
      const res = await adjustMatchCount(activeAssignment.id, ringId, delta);
      if (res && typeof res.matches_completed === 'number') {
        setAssignments(prev => {
          const idx = prev.findIndex(a => a.id === activeAssignment.id);
          if (idx > -1) {
            const copy = [...prev];
            copy[idx] = { ...copy[idx], matches_completed: res.matches_completed };
            return copy;
          }
          return prev;
        });
      }
    } catch (e: any) {
      console.error(e);
      if (e?.message?.includes("Too many rapid attempts")) {
        setSpamNotice("Too many rapid clicks. Action rejected.");
        setTimeout(() => setSpamNotice(null), 3500);
      } else if (e?.message?.includes("Unauthorized") || e?.message?.includes("Session")) {
        setSyncErrorModal({
          title: "Session Expired",
          message: "Your moderator session is no longer active. Please re-login with your access code or reload the page.",
          isUnauthorized: true
        });
      } else {
        setSyncErrorModal({
          title: "Failed to Update Score",
          message: "💀 Score update failed. The app and server might be out of sync (or your access changed). Refresh the page, check your match count, and try again.",
          isUnauthorized: false
        });
      }
    } finally {
      setIsUpdatingMatch(false);
      setActiveDelta(null);
    }
  };

  const handleTogglePause = async () => {
    setLoading(true);
    try {
      await setRingStatus(activeAssignment.id, ringId, activeAssignment.status === 'running');
    } catch (e) {
      console.error(e);
      alert("Failed to pause/resume ring");
    } finally {
      setLoading(false);
    }
  };

  const executeCompleteCategory = async (fillExpected: boolean) => {
    setLoading(true);
    try {
      if (fillExpected) {
        const totalMatches = activeAssignment.categories?.expected_matches || 0;
        const diff = totalMatches - activeAssignment.matches_completed;
        if (diff > 0) {
          await adjustMatchCount(activeAssignment.id, ringId, diff);
        }
      }
      await finishCategory(activeAssignment.id, ringId);
      setShowCompleteModal(false);
      router.push(`/moderator/ring/${ringId}/queue`);
    } catch (e) {
      console.error(e);
      alert("Failed to complete category");
    } finally {
      setLoading(false);
    }
  };

  const executeReturnToQueue = async () => {
    if (returnConfirmText !== "CONFIRM") return;
    setLoading(true);
    try {
      await returnCategoryToQueue(activeAssignment.id, ringId);
      setShowReturnModal(false);
      setReturnConfirmText("");
      router.push(`/moderator/ring/${ringId}/queue`);
    } catch (e) {
      console.error(e);
      alert("Failed to return category to queue");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAssistance = async (type: string) => {
    try {
      await logRingEvent(ringId, "REQUEST_ASSISTANCE", { assistanceType: type });
      setShowAssistanceModal(false);
      alert(`Assistance request sent: ${type}`);
    } catch (e) {
      console.error(e);
      alert("Failed to send assistance request");
    }
  };

  const handleEmergency = async () => {
    if (!confirm("TRIGGER EMERGENCY ALERT? This alerts all admins.")) return;
    try {
      await logRingEvent(ringId, "EMERGENCY_ALERT", { reason: "Moderator button pressed" });
      alert("EMERGENCY ALERT BROADCASTED");
    } catch (e) {
      console.error(e);
      alert("Failed to trigger emergency");
    }
  };

  const currentCompleted = activeAssignment.matches_completed || 0;
  const totalMatches = activeAssignment.categories?.expected_matches || 0;
  const isPaused = activeAssignment.status === 'paused';
  const progressPercent = totalMatches > 0 ? (currentCompleted / totalMatches) * 100 : 0;
  const currentCategoryAthletes = allAthletes.filter(a => a.category_id === activeAssignment.category_id);

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-8">
      {/* Category Header Card */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-secondary"></div>
        <div className="flex justify-between items-start mb-2">
          <span className="text-xs font-bold text-secondary tracking-widest uppercase">CURRENT ACTIVE CATEGORY</span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-label-caps uppercase flex items-center gap-1.5 ${
            isPaused ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isPaused ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
            {isPaused ? 'PAUSED' : 'RUNNING'}
          </span>
        </div>
        <h2 className="font-headline-md text-2xl font-black text-primary mb-2">{activeAssignment.categories?.name}</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant font-data-mono">
          {activeAssignment.categories?.belt && (
            <span className="px-2 py-0.5 bg-surface-container rounded font-medium text-primary">
              {activeAssignment.categories.belt}
            </span>
          )}
          {activeAssignment.categories?.age_bracket && (
            <span className="px-2 py-0.5 bg-surface-container rounded font-medium text-on-surface-variant">
              Age {activeAssignment.categories.age_bracket}
            </span>
          )}
          {activeAssignment.categories?.weight_class && (
            <span className="px-2 py-0.5 bg-surface-container rounded font-medium text-on-surface-variant">
              {activeAssignment.categories.weight_class}
            </span>
          )}
          <span className="px-2 py-0.5 bg-surface-container-high rounded font-bold text-primary">
            {currentCategoryAthletes.length} Athletes
          </span>
        </div>
      </div>

      {/* Spam Notice Toast */}
      {spamNotice && (
        <div className="bg-amber-50 border border-amber-300 text-amber-900 p-3 rounded-xl text-center text-xs font-bold shadow-sm animate-bounce">
          {spamNotice}
        </div>
      )}

      {/* Progress & Quick Actions */}
      <div className="bg-surface-container-lowest p-6 rounded-2xl border border-outline-variant shadow-sm space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-[10px] font-label-caps font-bold text-on-surface-variant block mb-1">MATCH PROGRESS</span>
            <span className="font-data-mono text-4xl font-black text-primary">{currentCompleted} <span className="text-lg text-outline font-normal">/ {totalMatches}</span></span>
          </div>
          <span className="font-data-mono text-xl font-bold text-secondary">{progressPercent.toFixed(0)}%</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-surface-container-high h-3 rounded-full overflow-hidden">
          <div 
            className="bg-secondary h-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, progressPercent)}%` }}
          ></div>
        </div>

        {/* Quick Increment Controls */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          <button 
            onClick={() => handleAdjustMatch(-1)}
            disabled={isUpdatingMatch || currentCompleted <= 0}
            className="py-3 bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all rounded-xl font-data-mono font-bold text-primary disabled:opacity-40"
          >
            {activeDelta === -1 ? "..." : "-1"}
          </button>
          <button 
            onClick={() => handleAdjustMatch(1)}
            disabled={isUpdatingMatch}
            className="py-3 bg-primary text-on-primary hover:opacity-90 active:scale-95 transition-all rounded-xl font-data-mono font-bold text-base shadow-sm col-span-2 disabled:opacity-40"
          >
            {activeDelta === 1 ? "Saving..." : "+1 Match"}
          </button>
          <button 
            onClick={() => handleAdjustMatch(5)}
            disabled={isUpdatingMatch}
            className="py-3 bg-surface-container hover:bg-surface-container-high active:scale-95 transition-all rounded-xl font-data-mono font-bold text-primary disabled:opacity-40"
          >
            {activeDelta === 5 ? "..." : "+5"}
          </button>
        </div>
      </div>

      {/* Match Timer */}
      <MatchTimer ringId={ringId} isPaused={isPaused} />

      {/* Ring Controls */}
      <div className="grid grid-cols-2 gap-3">
        <button 
          onClick={handleTogglePause}
          disabled={loading}
          className={`py-4 rounded-xl font-bold font-body-sm flex items-center justify-center gap-2 border transition-colors ${
            isPaused 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 hover:bg-emerald-500/20' 
              : 'bg-amber-500/10 border-amber-500/30 text-amber-800 hover:bg-amber-500/20'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{isPaused ? 'play_arrow' : 'pause'}</span>
          {isPaused ? 'Resume Tatami' : 'Pause Tatami'}
        </button>

        <button 
          onClick={() => setShowCompleteModal(true)}
          disabled={loading}
          className="py-4 bg-secondary text-on-secondary rounded-xl font-bold font-body-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          Complete Category
        </button>
      </div>

      {/* Advanced Drawer / Action Bar */}
      <div className="flex justify-between items-center pt-4 border-t border-outline-variant">
        <button 
          onClick={() => setShowAssistanceModal(true)}
          className="text-xs font-bold font-label-caps text-on-surface-variant hover:text-primary flex items-center gap-1 py-2 px-3 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">support_agent</span>
          Need Assistance
        </button>

        <button 
          onClick={() => setShowReturnModal(true)}
          className="text-xs font-bold font-label-caps text-on-surface-variant hover:text-error flex items-center gap-1 py-2 px-3 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">keyboard_return</span>
          Return to Queue
        </button>

        <button 
          onClick={handleEmergency}
          className="text-xs font-bold font-label-caps text-error hover:bg-error/10 flex items-center gap-1 py-2 px-3 rounded-lg transition-colors"
        >
          <span className="material-symbols-outlined text-[16px]">emergency</span>
          Alert
        </button>
      </div>

      {/* Modals */}
      {showAssistanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface-container-lowest p-6 rounded-2xl max-w-sm w-full space-y-4 border border-outline-variant shadow-xl">
            <h3 className="font-headline-sm text-base font-bold text-primary">Request Staff Assistance</h3>
            <p className="text-body-sm text-on-surface-variant">Select the type of assistance required on this Tatami:</p>
            <div className="grid grid-cols-1 gap-2">
              {['Doctor / Medical', 'Technical Support', 'Security / Crowd', 'Official Referee'].map(type => (
                <button
                  key={type}
                  onClick={() => handleRequestAssistance(type)}
                  className="bg-surface-container hover:bg-surface-container-high py-3 px-4 rounded-xl font-bold text-sm border border-outline-variant text-left transition-colors"
                >
                  {type}
                </button>
              ))}
            </div>
            <button onClick={() => setShowAssistanceModal(false)} className="w-full py-2.5 border border-outline-variant rounded-xl font-bold text-sm mt-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface-container-lowest p-6 rounded-2xl max-w-sm w-full space-y-4 border border-outline-variant shadow-xl">
            <h3 className="font-headline-sm text-base font-bold text-error">Return Category to Queue</h3>
            <p className="text-body-sm text-on-surface-variant">This will pull the category off the mat and return it to the queue without marking it complete.</p>
            <div>
              <label className="text-[10px] font-bold text-on-surface-variant mb-1 block uppercase tracking-wider">Type CONFIRM to proceed</label>
              <input
                type="text"
                value={returnConfirmText}
                onChange={(e) => setReturnConfirmText(e.target.value)}
                className="w-full bg-surface-container border border-outline-variant p-3 rounded-xl text-on-surface font-bold text-center uppercase"
                placeholder="CONFIRM"
              />
            </div>
            <div className="flex gap-2">
              <button onClick={() => setShowReturnModal(false)} className="flex-1 py-3 bg-surface-container rounded-xl font-bold text-sm">Cancel</button>
              <button
                onClick={executeReturnToQueue}
                disabled={returnConfirmText !== "CONFIRM" || loading}
                className="flex-1 py-3 bg-error text-white rounded-xl font-bold text-sm disabled:opacity-50"
              >
                Return
              </button>
            </div>
          </div>
        </div>
      )}

      {showCompleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface-container-lowest p-6 rounded-2xl max-w-sm w-full space-y-4 border border-outline-variant shadow-xl">
            <h3 className="font-headline-sm text-base font-bold text-secondary">Complete Category</h3>
            <p className="text-body-sm text-on-surface-variant">How would you like to record this category's completion?</p>
            <div className="space-y-3">
              <button
                onClick={() => executeCompleteCategory(false)}
                disabled={loading}
                className="w-full text-left p-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl flex flex-col gap-1 transition-colors"
              >
                <span className="font-bold text-primary text-sm">Complete at Current State</span>
                <span className="text-xs text-on-surface-variant">Finish with {currentCompleted} matches recorded.</span>
              </button>
              <button
                onClick={() => executeCompleteCategory(true)}
                disabled={loading}
                className="w-full text-left p-4 bg-surface-container hover:bg-surface-container-high border border-outline-variant rounded-xl flex flex-col gap-1 transition-colors"
              >
                <span className="font-bold text-secondary text-sm">Fill All Expected & Complete</span>
                <span className="text-xs text-on-surface-variant">Set count to {totalMatches} matches and complete.</span>
              </button>
            </div>
            <button onClick={() => setShowCompleteModal(false)} className="w-full py-2.5 border border-outline-variant rounded-xl font-bold text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {syncErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-surface-container-lowest p-6 rounded-xl max-w-sm w-full space-y-4 shadow-xl border border-outline-variant">
            <div className="flex items-center gap-3 text-error">
              <span className="material-symbols-outlined text-3xl">warning</span>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">{syncErrorModal.title}</h3>
            </div>
            <p className="text-body-sm text-on-surface-variant leading-relaxed">
              {syncErrorModal.message}
            </p>
            <div className="flex flex-col gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-3 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-sm"
              >
                <span className="material-symbols-outlined text-lg">refresh</span>
                Reload Page
              </button>

              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setShowAdvancedModalOptions(!showAdvancedModalOptions)}
                  className="text-xs text-on-surface-variant hover:text-on-surface flex items-center justify-center gap-1 mx-auto transition-colors font-medium py-1"
                >
                  <span>More Options</span>
                  <span className="material-symbols-outlined text-base">
                    {showAdvancedModalOptions ? 'expand_less' : 'expand_more'}
                  </span>
                </button>

                {showAdvancedModalOptions && (
                  <div className="mt-3 pt-3 border-t border-outline-variant animate-fadeIn">
                    <button
                      onClick={async () => {
                        try {
                          await logoutModerator();
                        } catch (err) {
                          console.error(err);
                        }
                        router.push("/moderator/login");
                      }}
                      className="w-full py-2.5 bg-error/10 hover:bg-error/20 text-error font-semibold rounded-xl flex items-center justify-center gap-2 text-xs transition-colors border border-error/20"
                    >
                      <span className="material-symbols-outlined text-base">logout</span>
                      Logout & Re-login
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
