"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function PublicEventClient({
  tournament,
  initialRings,
  initialAssignments,
  categories
}: {
  tournament: any;
  initialRings: any[];
  initialAssignments: any[];
  categories: any[];
}) {
  const supabase = createClient();
  const [rings, setRings] = useState(initialRings);
  const [assignments, setAssignments] = useState(initialAssignments);
  
  // Athlete Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Realtime Subscriptions
  useEffect(() => {
    const channel = supabase.channel('public_dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rings' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setRings(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_assignments' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          setAssignments(prev => {
            const copy = [...prev];
            const idx = copy.findIndex(a => a.id === payload.new.id);
            if (idx > -1) {
              // Merge the new data but keep the joined category data
              copy[idx] = { ...copy[idx], ...payload.new };
            }
            return copy;
          });
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  // Handle Search
  useEffect(() => {
    const fetchAthletes = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const { data } = await supabase
        .from('athletes')
        .select('*, categories(name)')
        .eq('tournament_id', tournament.id)
        .or(`name.ilike.%${searchQuery}%,chest_number.ilike.%${searchQuery}%`)
        .limit(5);
        
      setSearchResults(data || []);
      setIsSearching(false);
    };

    const debounce = setTimeout(fetchAthletes, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, tournament.id, supabase]);

  // Find ring assignment for a category
  const getCategoryRingAssignment = (categoryId: string) => {
    const assignment = assignments.find(a => a.category_id === categoryId);
    if (!assignment) return null;
    const ring = rings.find(r => r.id === assignment.ring_id);
    return { assignment, ring };
  };

  return (
    <div className="font-body-md text-on-background min-h-screen bg-surface">
      {/* Top Navigation Shell */}
      <header className="bg-surface-container-lowest border-b border-outline-variant fixed top-0 w-full z-50 flex justify-between items-center h-16 px-4 md:px-margin-desktop">
        <div className="flex items-center gap-3 py-2">
          <Link href="/">
            <span className="font-headline-lg text-headline-lg font-black text-primary tracking-tighter">Ring Flow</span>
          </Link>
        </div>
      </header>

      <main className="px-4 md:px-margin-desktop max-w-7xl mx-auto py-6 mt-16">
        {/* Search & Info Bar */}
        <div className="flex flex-col space-y-4 mb-6 relative">
          <div className="flex items-center gap-3 py-6">
            <div className="w-3 h-3 rounded-full bg-secondary animate-pulse"></div>
            <h1 className="font-headline-lg text-headline-lg text-primary uppercase tracking-tight font-black">{tournament.name}</h1>
          </div>
          
          <div className="relative group">
            <input 
              className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg py-4 pl-12 pr-4 focus:ring-2 focus:ring-secondary focus:border-transparent transition-all outline-none font-body-md" 
              placeholder="Search athlete by name or chest number..." 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">search</span>
          </div>

          {/* Search Results Dropdown */}
          {searchQuery.trim().length >= 2 && (
            <div className="absolute top-full left-0 w-full bg-surface-container-lowest border border-outline-variant shadow-lg rounded-lg mt-2 z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-on-surface-variant text-sm">Searching...</div>
              ) : searchResults.length > 0 ? (
                <div className="flex flex-col">
                  {searchResults.map(a => {
                    const ringInfo = a.category_id ? getCategoryRingAssignment(a.category_id) : null;
                    return (
                      <div key={a.id} className="p-4 border-b border-outline-variant last:border-b-0 hover:bg-surface-container-low transition-colors">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="font-bold text-primary text-lg">{a.name}</span>
                            <span className="ml-2 font-data-mono text-outline text-sm">#{a.chest_number || "N/A"}</span>
                            <div className="text-on-surface-variant text-sm mt-1 flex items-center gap-2">
                              <span className="material-symbols-outlined text-[16px]">sports_martial_arts</span>
                              {a.categories?.name || "Uncategorized"}
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {ringInfo ? (
                              <div className="flex flex-col items-end gap-1">
                                <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full font-label-caps text-xs">
                                  {ringInfo.ring ? ringInfo.ring.name.toUpperCase() : "UNASSIGNED"}
                                </span>
                                <span className={`text-[10px] font-label-caps tracking-widest ${
                                  ringInfo.assignment.status === 'running' ? 'text-secondary font-bold animate-pulse' :
                                  ringInfo.assignment.status === 'completed' ? 'text-outline' :
                                  'text-primary'
                                }`}>
                                  {ringInfo.assignment.status.toUpperCase()}
                                </span>
                              </div>
                            ) : (
                              <span className="bg-surface-container-high text-on-surface px-3 py-1 rounded-full font-label-caps text-xs">
                                PENDING
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-4 text-center text-on-surface-variant text-sm">No athletes found matching "{searchQuery}"</div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          {rings.map(ring => {
            const activeAssignment = assignments.find(a => a.ring_id === ring.id && (a.status === 'running' || a.status === 'paused'));
            const nextAssignment = assignments.find(a => a.ring_id === ring.id && a.status === 'pending');
            const ringStatus = activeAssignment ? activeAssignment.status : 'idle';
            
            return (
              <div key={ring.id} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <div className={`${
                  ringStatus === 'running' ? 'bg-secondary text-on-secondary' :
                  ringStatus === 'paused' ? 'bg-error-container text-on-error-container border-b border-error/20' :
                  'bg-surface-container-highest text-on-surface'
                } px-5 py-3 flex justify-between items-center transition-colors`}>
                  <div className="flex items-center gap-3">
                    <span className="font-headline-sm text-headline-sm uppercase">{ring.name}</span>
                    {ring.mat_name && (
                      <span className="bg-black/10 px-2 py-0.5 rounded font-label-caps text-[10px]">{ring.mat_name}</span>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${
                    ringStatus === 'running' ? 'bg-on-secondary text-secondary' :
                    ringStatus === 'paused' ? 'bg-error text-white' :
                    'bg-surface-container text-on-surface'
                  }`}>
                    <span className="material-symbols-outlined text-[16px]" style={{fontVariationSettings: '"FILL" 1'}}>
                      {ringStatus === 'running' ? 'play_arrow' : ringStatus === 'paused' ? 'pause' : 'stop'}
                    </span>
                    <span className="font-label-caps text-label-caps">{ringStatus.toUpperCase()}</span>
                  </div>
                </div>
                
                <div className={`p-5 transition-opacity ${ringStatus === 'paused' ? 'opacity-75' : ''}`}>
                  {activeAssignment ? (
                    <>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-headline-sm text-headline-sm text-primary mb-1">
                            {activeAssignment.categories?.name}
                          </h3>
                          <p className="font-body-sm text-on-surface-variant flex items-center gap-2">
                            <span className="material-symbols-outlined text-[16px]">groups</span>
                            {activeAssignment.matches_completed} of {activeAssignment.categories?.expected_matches || 0} Matches Completed
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress Section */}
                      <div className="mb-6">
                        <div className="flex justify-between text-label-caps font-label-caps text-on-surface-variant mb-2">
                          <span>MATCHES COMPLETED</span>
                          <span className={ringStatus === 'running' ? 'text-secondary' : ''}>
                            {Math.max(0, (activeAssignment.categories?.expected_matches || 0) - activeAssignment.matches_completed)} MATCHES REMAINING
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${ringStatus === 'running' ? 'bg-secondary' : 'bg-error/40'} transition-all duration-1000`} 
                            style={{ width: `${Math.min(100, (activeAssignment.matches_completed / Math.max(1, activeAssignment.categories?.expected_matches || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-on-surface-variant italic">
                      No active category. Ring is idle.
                    </div>
                  )}

                  {/* Upcoming */}
                  {nextAssignment && (
                    <div className="bg-surface-container-low rounded-lg p-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-label-caps text-label-caps text-outline">NEXT:</span>
                        <span className="font-body-sm text-on-surface font-semibold">{nextAssignment.categories?.name}</span>
                      </div>
                      <span className="material-symbols-outlined text-outline text-[20px]">chevron_right</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {rings.length === 0 && (
            <div className="text-center p-12 bg-surface-container-lowest border border-outline-variant rounded-xl text-on-surface-variant">
              No rings have been configured for this tournament yet.
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center p-6 border-t border-outline-variant">
          <p className="text-on-surface-variant font-body-sm">All match times are estimates based on current ring speed.</p>
          <p className="text-outline font-label-caps text-[10px] mt-2 tracking-widest">POWERED BY RING FLOW V2.4</p>
        </div>
      </main>
    </div>
  );
}
