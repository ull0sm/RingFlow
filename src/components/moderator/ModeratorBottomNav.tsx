"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ModeratorBottomNav({ ringId }: { ringId: string }) {
  const pathname = usePathname();

  const isCurrent = pathname.includes(`/current`);
  const isQueue = pathname.includes(`/queue`);
  const isControls = pathname.includes(`/controls`);

  return (
    <nav className="fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-3 bg-surface-container-highest shadow-lg border-t border-outline-variant z-50 rounded-t-xl">
      <div className="flex justify-around items-center w-full max-w-md mx-auto">
        <Link 
          href={`/moderator/ring/${ringId}/current`} 
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
            isCurrent ? "text-secondary bg-secondary-container/30" : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className={`material-symbols-outlined size-6 ${isCurrent ? "active-tab" : ""}`} style={{fontVariationSettings: isCurrent ? '"FILL" 1' : '"FILL" 0'}}>grid_view</span>
          <span className={`font-label-caps text-[10px] mt-1 ${isCurrent ? "font-bold" : ""}`}>Current</span>
        </Link>

        <Link 
          href={`/moderator/ring/${ringId}/queue`} 
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
            isQueue ? "text-secondary bg-secondary-container/30" : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className={`material-symbols-outlined size-6 ${isQueue ? "active-tab" : ""}`} style={{fontVariationSettings: isQueue ? '"FILL" 1' : '"FILL" 0'}}>format_list_bulleted</span>
          <span className={`font-label-caps text-[10px] mt-1 ${isQueue ? "font-bold" : ""}`}>Queue</span>
        </Link>

        <Link 
          href={`/moderator/ring/${ringId}/controls`} 
          className={`flex flex-col items-center justify-center p-2 rounded-xl transition-colors ${
            isControls ? "text-secondary bg-secondary-container/30" : "text-on-surface-variant hover:bg-surface-container"
          }`}
        >
          <span className={`material-symbols-outlined size-6 ${isControls ? "active-tab" : ""}`} style={{fontVariationSettings: isControls ? '"FILL" 1' : '"FILL" 0'}}>settings_accessibility</span>
          <span className={`font-label-caps text-[10px] mt-1 ${isControls ? "font-bold" : ""}`}>Controls</span>
        </Link>
      </div>
    </nav>
  );
}
