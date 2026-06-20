"use client";

import React, { useState } from "react";
import { updateTournamentSettings, deleteTournament } from "@/actions/settings";

interface Tournament {
  id: string;
  name: string;
  event_date: string | null;
  status: string;
  venue: string | null;
  city: string | null;
}

interface Props {
  tournament: Tournament;
}

export default function SettingsClient({ tournament }: Props) {
  const [form, setForm] = useState({
    name: tournament.name,
    event_date: tournament.event_date || "",
    status: tournament.status,
    venue: tournament.venue || "",
    city: tournament.city || "",
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // 0 = closed, 1 = typing "delete", 2 = typing "tournament name"
  const [deletePhase, setDeletePhase] = useState(0);
  const [deleteInput, setDeleteInput] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateTournamentSettings(tournament.id, form);
      alert("Settings saved successfully.");
    } catch (err) {
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextDeletePhase = () => {
    if (deletePhase === 1) {
      if (deleteInput.trim().toLowerCase() !== "delete") {
        alert("Please type exactly 'delete' to proceed.");
        return;
      }
      setDeletePhase(2);
      setDeleteInput("");
    } else if (deletePhase === 2) {
      if (deleteInput.trim() !== tournament.name) {
        alert("Tournament name did not match.");
        return;
      }
      executeDelete();
    }
  };

  const executeDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTournament(tournament.id);
    } catch (err) {
      alert("Failed to delete tournament.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-margin-desktop space-y-8 bg-surface">
      <div className="max-w-3xl">
        <div className="mb-8">
          <h2 className="font-headline-sm text-headline-sm text-primary">Tournament Configuration</h2>
          <p className="text-body-sm text-on-surface-variant">Update the core details of your event.</p>
        </div>

        <div className="space-y-8">
          {/* General Info */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-sm">
            <h3 className="font-label-caps text-label-caps text-secondary mb-6">General Information</h3>
            
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <label className="font-label-caps text-[10px] text-on-surface-variant">TOURNAMENT NAME</label>
                <input 
                  type="text" 
                  value={form.name}
                  onChange={e => setForm({...form, name: e.target.value})}
                  className="w-full p-3 border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md" 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant">EVENT DATE</label>
                  <input 
                    type="date" 
                    value={form.event_date}
                    onChange={e => setForm({...form, event_date: e.target.value})}
                    className="w-full p-3 border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant">STATUS</label>
                  <select 
                    value={form.status}
                    onChange={e => setForm({...form, status: e.target.value})}
                    className="w-full p-3 border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md bg-transparent"
                  >
                    <option value="draft">Draft (Setup Phase)</option>
                    <option value="active">Active (Live Event)</option>
                    <option value="completed">Completed (Archived)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant">VENUE NAME</label>
                  <input 
                    type="text" 
                    value={form.venue}
                    onChange={e => setForm({...form, venue: e.target.value})}
                    className="w-full p-3 border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md" 
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="font-label-caps text-[10px] text-on-surface-variant">CITY</label>
                  <input 
                    type="text" 
                    value={form.city}
                    onChange={e => setForm({...form, city: e.target.value})}
                    className="w-full p-3 border border-outline-variant rounded focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md" 
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2 bg-primary text-white font-label-caps text-label-caps rounded hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSaving ? "SAVING..." : "SAVE CHANGES"}
              </button>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="border border-outline-variant rounded-xl p-8 bg-surface-container-lowest">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-2">Advanced Settings</h3>
                <p className="text-body-sm text-on-surface-variant">Irreversible actions are hidden here.</p>
              </div>
              <button 
                onClick={() => { setDeletePhase(1); setDeleteInput(""); }}
                className="w-10 h-10 rounded-full border border-outline-variant flex items-center justify-center hover:bg-error/10 hover:text-error hover:border-error transition-colors"
                title="Delete Tournament"
              >
                <span className="material-symbols-outlined text-[20px]">settings</span>
              </button>
            </div>

            {deletePhase > 0 && (
              <div className="mt-6 p-6 border border-error/30 bg-error/5 rounded-lg animate-fade-in">
                <h4 className="font-bold text-error mb-2">Delete Tournament</h4>
                
                {deletePhase === 1 && (
                  <>
                    <p className="text-sm text-on-surface-variant mb-4">To proceed, please type <strong className="text-error">delete</strong> below.</p>
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={deleteInput}
                        onChange={e => setDeleteInput(e.target.value)}
                        placeholder="delete"
                        className="flex-1 p-2 border border-error/30 rounded focus:border-error outline-none"
                      />
                      <button onClick={handleNextDeletePhase} className="px-4 py-2 bg-error text-white font-bold text-xs rounded hover:opacity-90">NEXT</button>
                      <button onClick={() => setDeletePhase(0)} className="px-4 py-2 border border-outline rounded text-xs">CANCEL</button>
                    </div>
                  </>
                )}

                {deletePhase === 2 && (
                  <>
                    <p className="text-sm text-on-surface-variant mb-4">Final step. Type the exact tournament name: <strong className="text-error font-data-mono">{tournament.name}</strong></p>
                    <div className="flex gap-4">
                      <input 
                        type="text" 
                        value={deleteInput}
                        onChange={e => setDeleteInput(e.target.value)}
                        placeholder={tournament.name}
                        className="flex-1 p-2 border border-error/30 rounded focus:border-error outline-none"
                      />
                      <button 
                        onClick={handleNextDeletePhase} 
                        disabled={isDeleting}
                        className="px-4 py-2 bg-error text-white font-bold text-xs rounded hover:opacity-90 disabled:opacity-50"
                      >
                        {isDeleting ? "DELETING..." : "PERMANENTLY DELETE"}
                      </button>
                      <button onClick={() => setDeletePhase(0)} disabled={isDeleting} className="px-4 py-2 border border-outline rounded text-xs">CANCEL</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
