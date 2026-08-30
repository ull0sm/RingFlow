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
    <section className="bg-[#1B1815] text-[#F5F3EC] py-7 border-b border-[#E1DDCF]/20 font-['Inter',sans-serif] relative">
      <div className="max-w-7xl mx-auto px-6 md:px-margin-desktop grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="flex items-center justify-center md:justify-start gap-4">
          <span className="font-['Bebas_Neue',sans-serif] text-[44px] text-[#F5F3EC] leading-none min-w-[2.5rem] tracking-wider">
            <CountUp end={28} />
          </span>
          <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#A19C90] uppercase tracking-widest text-[12px]">
            Upcoming Events
          </span>
        </div>
        <div className="flex items-center justify-center gap-4 border-y md:border-y-0 md:border-x border-white/10 py-4 md:py-0">
          <span className="font-['Bebas_Neue',sans-serif] text-[44px] text-[#F5F3EC] leading-none min-w-[2rem] tracking-wider">
            <CountUp end={12} />
          </span>
          <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#A19C90] uppercase tracking-widest text-[12px]">
            Active Cities
          </span>
        </div>
        <div className="flex items-center justify-center md:justify-end gap-4">
          <span className="font-['Bebas_Neue',sans-serif] text-[44px] text-[#F5F3EC] leading-none min-w-[1.5rem] tracking-wider">
            <CountUp end={4} />
          </span>
          <span className="font-['Plus_Jakarta_Sans',sans-serif] font-bold text-[#A19C90] uppercase tracking-widest text-[12px]">
            Participating Regions
          </span>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-6 md:px-margin-desktop text-right mt-2 -mb-3">
        <p className="text-[9px] text-[#A19C90]/40 tracking-wider">
          * Representative numbers displayed for branding illustration purposes.
        </p>
      </div>
    </section>
  );
}
