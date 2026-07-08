import React from "react";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import PublicStats from "@/components/public/PublicStats";

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
          <div className="absolute inset-0 bg-[url('/hero-section.png')] bg-cover bg-center" />
          <div className="absolute inset-0 hero-overlay flex items-center">
            <div className="max-w-7xl mx-auto px-margin-desktop w-full">
              <div className="max-w-2xl">
                <h1 className="font-display-lg text-display-lg mb-4 text-white">Find Your Next Tournament</h1>
                <p className="text-white/90 font-body-md mb-8 text-xl max-w-xl">
                  Browse upcoming martial arts competitions, kata events, and kumite championships.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Link href="#events" className="px-8 py-3 bg-secondary-container text-on-secondary-container font-headline-sm rounded-lg hover:bg-opacity-90 transition-all shadow-lg inline-block">
                    View Events
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <PublicStats />

        {/* Events Filter & Grid Section */}
        <section id="events" className="max-w-7xl mx-auto px-margin-desktop py-12 scroll-mt-20">
          <div className="mb-10">
            <h2 className="font-headline-lg text-headline-lg text-primary mb-6">Active &amp; Upcoming Events</h2>
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
