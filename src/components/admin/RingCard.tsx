import React from "react";

type RingStatus = "Running" | "Paused" | "Empty";

interface RingCardProps {
  name: string;
  status: RingStatus;
  categoryName?: string;
  currentMatch?: number;
  totalMatches?: number;
  timer?: string;
  progressPercent?: number;
  estimatedFinish?: string;
  statusReason?: string;
}

export default function RingCard({
  name,
  status,
  categoryName = "Pending Next Category",
  currentMatch = 0,
  totalMatches = 0,
  timer = "Ready",
  progressPercent = 0,
  estimatedFinish = "--:--",
  statusReason
}: RingCardProps) {
  
  // Dynamic styling based on status
  let borderLeftColor = "border-outline";
  let badgeClasses = "bg-surface-container-highest text-on-surface-variant";
  let timerClasses = "text-on-surface-variant";
  let progressBarClasses = "bg-outline";

  if (status === "Running") {
    borderLeftColor = "border-secondary";
    badgeClasses = "bg-green-100 text-green-800";
    timerClasses = "text-secondary";
    progressBarClasses = "bg-secondary";
  } else if (status === "Paused") {
    borderLeftColor = "border-error";
    badgeClasses = "bg-error-container text-on-error-container";
    timerClasses = "text-error";
    progressBarClasses = "bg-error";
  }

  return (
    <div className={`bg-surface-container-lowest border-l-4 ${borderLeftColor} p-card-padding border border-outline-variant rounded shadow-sm hover:shadow-md transition-shadow ${status === 'Empty' ? 'opacity-70' : ''}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined drag-handle text-outline">drag_indicator</span>
          <span className="font-headline-sm text-headline-sm">{name}</span>
        </div>
        <span className={`px-2 py-1 rounded font-label-caps text-[10px] uppercase ${badgeClasses}`}>
          {status}
        </span>
      </div>
      
      <h4 className="font-body-md text-body-md font-bold mb-1">{categoryName}</h4>
      
      <div className="flex justify-between items-center text-on-surface-variant mb-4">
        <span className="font-body-sm">
          {status === "Empty" ? "-- / --" : `Match ${currentMatch}/${totalMatches}`}
        </span>
        <span className={`font-data-mono text-data-mono ${timerClasses}`}>
          {statusReason ? statusReason : timer}
        </span>
      </div>
      
      <div className="w-full bg-surface-container h-1 rounded-full mb-4">
        <div className={`${progressBarClasses} h-full`} style={{ width: `${progressPercent}%` }}></div>
      </div>
      
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-outline-variant">
        <span className="font-body-sm text-on-surface-variant italic">
          {status === "Empty" ? "Waiting for Assign" : `Est. Finish: ${estimatedFinish}`}
        </span>
        <button className="material-symbols-outlined text-outline hover:text-primary transition-colors">
          {status === "Empty" ? "add_circle" : "open_in_new"}
        </button>
      </div>
    </div>
  );
}
