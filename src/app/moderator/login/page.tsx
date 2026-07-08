"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { requestModeratorAccess } from "@/actions/moderator";
import { v4 as uuidv4 } from "uuid";
import { Turnstile } from "@marsidev/react-turnstile";

// Simple user-agent parser
function parseUserAgent(ua: string) {
  let browser = "Unknown";
  let os = "Unknown";
  let deviceType = /Mobile|Android|iP(ad|hone)/.test(ua) ? "Mobile" : "Desktop";

  if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  if (ua.includes("Win")) os = "Windows";
  else if (ua.includes("Mac")) os = "MacOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS") || ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Linux")) os = "Linux";

  return { browser, os, deviceType };
}

export default function ModeratorLogin() {
  const [accessCode, setAccessCode] = useState("");
  const [moderatorName, setModeratorName] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    if (val.length > 6) val = val.slice(0, 6);
    setAccessCode(val);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.length < 6) {
      setError("Please enter a 6-digit access code.");
      return;
    }
    if (!turnstileToken) {
      setError("Please complete the security check.");
      return;
    }

    setLoading(true);

    try {
      // 1. Get or create persistent device ID
      let deviceId = localStorage.getItem("ringflow_mod_device_id");
      if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem("ringflow_mod_device_id", deviceId);
      }

      // 2. Parse User Agent
      const { browser, os, deviceType } = parseUserAgent(navigator.userAgent);

      // 3. Fetch approx location and IP
      let ip = "Unknown";
      let location = "Unknown";
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          ip = data.ip;
          location = `${data.city}, ${data.region}`;
        }
      } catch (e) {
        console.error("Failed to fetch IP info", e);
      }

      const deviceInfo = {
        deviceId,
        browser,
        os,
        deviceType,
        ip,
        location,
      };

      const result = await requestModeratorAccess(accessCode, moderatorName, deviceInfo, turnstileToken);
      if (result.success && result.requestId) {
        router.push(`/moderator/waiting/${result.requestId}`);
      } else {
        setError(result.error || "Failed to request access");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const percentage = (accessCode.length / 6) * 100;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md">
      <header className="w-full px-4 md:px-8 py-6 flex items-center z-10 justify-center">
        <div className="flex items-center gap-2">
          <span className="text-headline-sm font-headline-sm font-extrabold text-primary tracking-tighter">Ring Flow</span>
          <div className="h-1.5 w-1.5 rounded-full bg-secondary-container"></div>
          <span className="text-label-caps font-label-caps text-on-surface-variant uppercase">Moderator login</span>
        </div>
      </header>

      <main className="flex-grow flex items-center justify-center px-4 relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-10 blur-[120px] rounded-full bg-secondary-container"></div>
          <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] opacity-5 blur-[100px] rounded-full bg-primary-container"></div>
        </div>

        <div className="w-full max-w-md z-10">
          <div className="bg-white/80 backdrop-blur-xl border border-outline-variant/30 rounded-xl shadow-lg flex flex-col items-center px-4 py-8">
            <div className="w-16 h-16 rounded-full bg-primary-container flex items-center justify-center mb-8">
              <span className="material-symbols-outlined text-on-secondary text-3xl" style={{fontVariationSettings: '"FILL" 1'}}>lock</span>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-headline-lg font-headline-lg text-primary mb-2">Access Portal</h1>
              <p className="text-body-md text-on-surface-variant">Enter your Tatami Access Code to begin</p>
            </div>

            <form className="w-full space-y-8" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="relative">
                  <label className="font-label-caps text-label-caps text-on-surface-variant mb-1 block">Your Name (Optional)</label>
                  <input 
                    type="text"
                    className="w-full bg-surface-container border border-outline-variant text-on-surface px-4 py-3 rounded-lg focus:outline-none focus:border-secondary transition-all"
                    placeholder="E.g., Rahul"
                    value={moderatorName}
                    onChange={e => setModeratorName(e.target.value)}
                  />
                </div>

                <div className="relative group pt-2">
                  <input 
                    autoComplete="off" 
                    className="w-full bg-surface-container-lowest border border-outline-variant text-center font-data-mono tracking-[0.5em] px-4 rounded-lg focus:outline-none focus:border-secondary transition-all uppercase placeholder:opacity-20 text-headline-lg py-5" 
                    id="access-code" 
                    maxLength={6}
                    placeholder="••••••" 
                    type="text"
                    value={accessCode}
                    onChange={handleInput}
                  />
                  <div className="absolute bottom-0 left-0 h-0.5 bg-secondary-container transition-all duration-700" style={{ width: `${percentage}%` }}></div>
                </div>
                
                <div className="flex justify-between items-center px-1">
                  <span className={`text-label-caps font-label-caps transition-colors ${accessCode.length === 6 ? 'text-secondary' : 'text-on-surface-variant'}`}>
                    {accessCode.length} / 6 Characters
                  </span>
                  {error && <span className="text-error text-label-caps font-label-caps">{error}</span>}
                </div>
              </div>

              <div className="flex justify-center min-h-[65px]">
                <Turnstile 
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ""} 
                  onSuccess={(token) => {
                    setTurnstileToken(token);
                    setError("");
                  }}
                  options={{
                    theme: "light",
                  }}
                />
              </div>

              <div className="space-y-4 pt-4">
                <button 
                  disabled={loading || !turnstileToken}
                  className="w-full bg-primary-container text-on-secondary font-headline-sm py-5 rounded-lg hover:bg-black disabled:opacity-50 transition-all flex items-center justify-center gap-2 group" 
                  type="submit"
                >
                  {loading ? "Verifying..." : "Verify Access"}
                  {!loading && <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
