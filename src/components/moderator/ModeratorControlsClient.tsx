"use client";

import React, { useState } from "react";
import { logRingEvent } from "@/actions/moderator";

export default function ModeratorControlsClient({ ringId }: { ringId: string }) {
  const [loading, setLoading] = useState(false);

  const handleEmergency = async () => {
    if (!confirm("Are you sure you want to trigger an EMERGENCY alert? This notifies the entire tournament staff instantly.")) return;
    setLoading(true);
    try {
      await logRingEvent(ringId, "EMERGENCY_ALERT", { reason: "Manual trigger" });
      alert("Emergency alert dispatched.");
    } catch (e) {
      console.error(e);
      alert("Failed to trigger emergency.");
    } finally {
      setLoading(false);
    }
  };

  const requestAssistance = async (type: string) => {
    setLoading(true);
    try {
      if (type === "Doctor") {
        const { pauseCurrentRingAssignment } = await import('@/actions/moderator');
        await pauseCurrentRingAssignment(ringId);
        await logRingEvent(ringId, "REQUEST_ASSISTANCE", { message: `Requested: ${type}`, type });
        alert(`Requested assistance: ${type}. Ring has been paused.`);
      } else {
        await logRingEvent(ringId, "REQUEST_ASSISTANCE", { message: `Requested: ${type}`, type });
        alert(`Requested assistance: ${type}.`);
      }
    } catch (e) {
      console.error(e);
      alert("Failed to request assistance.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="mb-4 flex flex-col md:flex-row md:items-end justify-between gap-4 items-start">
        <div>
          <h1 className="font-headline-lg text-headline-lg text-primary mb-1">Ring Controls</h1>
          <p className="text-on-surface-variant font-body-sm">Tournament Control Center</p>
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="font-headline-sm text-headline-sm text-on-surface px-1">Request Assistance</h2>
        <div className="grid grid-cols-2 gap-4">
          <button disabled={loading} onClick={() => requestAssistance("Doctor")} className="bg-white border border-outline-variant p-6 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-secondary-container/5 hover:border-secondary transition-all active:scale-95 group disabled:opacity-50">
            <span className="material-symbols-outlined text-secondary text-3xl transition-transform group-hover:scale-110">medical_information</span>
            <span className="font-label-caps text-label-caps">Doctor</span>
          </button>
          <button disabled={loading} onClick={() => requestAssistance("Technical Support")} className="bg-white border border-outline-variant p-6 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-secondary-container/5 hover:border-secondary transition-all active:scale-95 group disabled:opacity-50">
            <span className="material-symbols-outlined text-secondary text-3xl transition-transform group-hover:scale-110">engineering</span>
            <span className="font-label-caps text-label-caps">Technical Support</span>
          </button>
          <button disabled={loading} onClick={() => requestAssistance("Admin")} className="bg-white border border-outline-variant p-6 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-secondary-container/5 hover:border-secondary transition-all active:scale-95 group disabled:opacity-50">
            <span className="material-symbols-outlined text-secondary text-3xl transition-transform group-hover:scale-110">badge</span>
            <span className="font-label-caps text-label-caps">Admin</span>
          </button>
          <button disabled={loading} onClick={() => requestAssistance("Security")} className="bg-white border border-outline-variant p-6 rounded-xl flex flex-col items-center justify-center gap-3 hover:bg-secondary-container/5 hover:border-secondary transition-all active:scale-95 group disabled:opacity-50">
            <span className="material-symbols-outlined text-secondary text-3xl transition-transform group-hover:scale-110">security</span>
            <span className="font-label-caps text-label-caps">Security</span>
          </button>
        </div>
      </section>

      <div className="mt-16 flex justify-center">
        <button 
          onClick={handleEmergency}
          disabled={loading}
          className="text-error font-label-caps text-xs opacity-70 hover:opacity-100 flex items-center gap-1 transition-opacity"
        >
          <span className="material-symbols-outlined text-[14px]">warning</span>
          TRIGGER EMERGENCY
        </button>
      </div>
    </div>
  );
}
