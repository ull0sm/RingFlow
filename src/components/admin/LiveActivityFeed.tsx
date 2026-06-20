"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

interface LogEvent {
  id: string;
  ring_id: string | null;
  action_type: string;
  description: string;
  created_at: string;
}

export default function LiveActivityFeed({ tournamentId, initialLogs }: { tournamentId: string, initialLogs: LogEvent[] }) {
  const [logs, setLogs] = useState<LogEvent[]>(initialLogs);
  const supabase = createClient();

  useEffect(() => {
    // Subscribe to new event logs for this tournament
    const channel = supabase
      .channel('public:event_log')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_log', filter: `tournament_id=eq.${tournamentId}` },
        (payload) => {
          setLogs((current) => [payload.new as LogEvent, ...current]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, supabase]);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm flex flex-col h-96">
      <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center shrink-0 rounded-t-xl">
        <h3 className="font-label-caps text-label-caps text-primary font-bold">Live Activity Feed</h3>
        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
      </div>
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {logs.map((log) => (
          <div key={log.id} className="flex gap-3 text-sm">
            <span className="font-data-mono text-[10px] text-on-surface-variant shrink-0 mt-0.5">
              {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <p className="text-on-surface text-body-sm leading-tight">
              <span className="font-bold text-primary mr-1">{log.action_type}:</span> 
              {log.description}
            </p>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="text-body-sm text-on-surface-variant italic">No activity yet. Logs will appear here in real-time.</p>
        )}
      </div>
    </div>
  );
}
