import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";

export default async function PublicHome() {
  const supabase = await createClient();
  const { data: tournaments } = await supabase
    .from("tournaments")
    .select("*")
    .order("event_date", { ascending: true });

  const activeTournaments = tournaments?.filter(t => t.status === "active") || [];
  const upcomingTournaments = tournaments?.filter(t => t.status === "draft") || [];

  return (
    <>
      {/* TopAppBar Section */}
      <header className="w-full top-0 sticky z-50 bg-white border-b border-outline-variant flex justify-between items-center h-16 px-margin-desktop mx-auto">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <span className="text-headline-sm font-bold text-primary tracking-tight">Ring Flow</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Admin link removed from public visibility */}
        </div>
      </header>
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative h-[500px] overflow-hidden bg-primary-container">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center mix-blend-overlay opacity-50" />
          <div className="absolute inset-0 hero-overlay flex items-center">
            <div className="max-w-7xl mx-auto px-margin-desktop w-full">
              <div className="max-w-2xl">
                <h1 className="font-display-lg text-display-lg mb-4 text-white">Find Your Next Tournament</h1>
                <p className="text-white/90 font-body-md mb-8 text-xl max-w-xl">
                  Browse upcoming martial arts competitions, kata events, and kumite championships.
                </p>
                <div className="flex flex-wrap gap-4">
                  <button className="px-8 py-3 bg-secondary-container text-on-secondary-container font-headline-sm rounded-lg hover:bg-opacity-90 transition-all shadow-lg">
                    View Events
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="bg-primary text-white py-6 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="text-headline-lg font-data-mono text-secondary-fixed">28</span>
              <span className="font-label-caps opacity-70 uppercase tracking-widest">Upcoming Events</span>
            </div>
            <div className="flex items-center justify-center gap-4 border-y md:border-y-0 md:border-x border-white/10 py-4 md:py-0">
              <span className="text-headline-lg font-data-mono text-secondary-fixed">12</span>
              <span className="font-label-caps opacity-70 uppercase tracking-widest">Active Cities</span>
            </div>
            <div className="flex items-center justify-center md:justify-end gap-4">
              <span className="text-headline-lg font-data-mono text-secondary-fixed">4</span>
              <span className="font-label-caps opacity-70 uppercase tracking-widest">Participating Countries</span>
            </div>
          </div>
        </section>

        {/* Events Filter & Grid Section */}
        <section className="max-w-7xl mx-auto px-margin-desktop py-12">
          <div className="mb-10">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-6">Active &amp; Upcoming Events</h2>
            {/* Search & Filters */}
            <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center bg-white p-4 rounded-xl shadow-sm border border-outline-variant">
              <div className="relative flex-grow">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">search</span>
                <input className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg focus:ring-2 focus:ring-secondary focus:border-transparent outline-none" placeholder="Search by name or keyword..." type="text" />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 lg:w-1/2">
                <div className="relative flex-grow">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">location_on</span>
                  <select className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg appearance-none focus:ring-2 focus:ring-secondary outline-none">
                    <option>All Locations</option>
                    <option>Chicago, IL</option>
                    <option>Los Angeles, CA</option>
                    <option>London, UK</option>
                  </select>
                </div>
                <div className="relative flex-grow">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">calendar_today</span>
                  <select className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant rounded-lg appearance-none focus:ring-2 focus:ring-secondary outline-none">
                    <option>All Dates</option>
                    <option>This Month</option>
                    <option>Next Month</option>
                    <option>Later This Year</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeTournaments.map(t => (
              <Link key={t.id} href={`/public/event/${t.id}`} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden event-card-hover transition-all duration-300 flex flex-col group cursor-pointer">
                <div className="relative h-56 overflow-hidden bg-primary-container">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-80 transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 bg-error text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg border border-white/20">
                    <span className="block w-2 h-2 bg-white rounded-full animate-pulse"></span>
                    <span className="font-label-caps text-[10px] uppercase font-black">LIVE</span>
                  </div>
                </div>
                <div className="p-6 flex-grow tatami-texture">
                  <h3 className="font-headline-sm text-primary mb-4">{t.name}</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary">calendar_today</span>
                      <span className="text-body-sm font-medium">{t.event_date ? new Date(t.event_date).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary">location_on</span>
                      <span className="text-body-sm font-medium">{t.venue || t.city || 'TBD'}</span>
                    </div>
                  </div>
                  <button className="w-full bg-secondary text-white py-3 rounded-lg font-headline-sm hover:bg-secondary/90 transition-colors shadow-md group-hover:shadow-lg">
                    Enter Arena
                  </button>
                </div>
              </Link>
            ))}

            {upcomingTournaments.map(t => (
              <Link key={t.id} href={`/public/event/${t.id}`} className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden event-card-hover transition-all duration-300 flex flex-col group cursor-pointer">
                <div className="relative h-56 overflow-hidden bg-primary-container">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1595078475328-1ab05d0a6a0e?q=80&w=600&auto=format&fit=crop')] bg-cover bg-center opacity-80 transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute top-4 left-4 bg-secondary text-white px-3 py-1 rounded-full flex items-center gap-2 shadow-lg border border-white/20">
                    <span className="font-label-caps text-[10px] uppercase font-black">UPCOMING</span>
                  </div>
                </div>
                <div className="p-6 flex-grow tatami-texture">
                  <h3 className="font-headline-sm text-primary mb-4">{t.name}</h3>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary">calendar_today</span>
                      <span className="text-body-sm font-medium">{t.event_date ? new Date(t.event_date).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-on-surface-variant">
                      <span className="material-symbols-outlined text-secondary">location_on</span>
                      <span className="text-body-sm font-medium">{t.venue || t.city || 'TBD'}</span>
                    </div>
                  </div>
                  <button className="w-full border-2 border-secondary text-secondary py-3 rounded-lg font-headline-sm hover:bg-secondary hover:text-white transition-all">
                    View Details
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

    </>
  );
}
