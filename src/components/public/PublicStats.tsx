"use client";

import React, { useState, useEffect } from "react";

function CountUp({ end, duration = 1500 }: { end: number; duration?: number }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [end, duration]);

  return <>{count}</>;
}

export default function PublicStats() {
  return (
    <section className="bg-primary text-white py-6 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex items-center justify-center md:justify-start gap-4">
          <span className="text-headline-lg font-data-mono text-secondary-fixed min-w-[2.5rem]">
            <CountUp end={28} />
          </span>
          <span className="font-label-caps opacity-70 uppercase tracking-widest text-xs">Upcoming Events</span>
        </div>
        <div className="flex items-center justify-center gap-4 border-y md:border-y-0 md:border-x border-white/10 py-4 md:py-0">
          <span className="text-headline-lg font-data-mono text-secondary-fixed min-w-[2rem]">
            <CountUp end={12} />
          </span>
          <span className="font-label-caps opacity-70 uppercase tracking-widest text-xs">Active Cities</span>
        </div>
        <div className="flex items-center justify-center md:justify-end gap-4">
          <span className="text-headline-lg font-data-mono text-secondary-fixed min-w-[1.5rem]">
            <CountUp end={4} />
          </span>
          <span className="font-label-caps opacity-70 uppercase tracking-widest text-xs">Participating Countries</span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-margin-desktop mt-3 text-center md:text-left">
        <p className="text-[9px] text-white/40 tracking-wider">
          * Representative numbers displayed for branding illustration purposes.
        </p>
      </div>
    </section>
  );
}
