import React from "react"
import { cn } from "@/lib/utils"
import { RingFlowLogo } from "./ringflow-logo"

interface SocialLink {
  icon: React.ReactNode
  href: string
  label: string
}

interface NavLink {
  href: string
  label: string
}

interface FooterProps {
  brandName: string
  socialLinks?: SocialLink[]
  mainLinks?: NavLink[]
  legalLinks?: NavLink[]
  copyright: {
    year: number
    builtBy?: React.ReactNode
  }
  backgroundImageUrl?: string
  className?: string
}

export function Footer({
  brandName,
  socialLinks = [],
  mainLinks = [],
  legalLinks = [],
  copyright,
  backgroundImageUrl,
  className,
}: FooterProps) {
  return (
    <footer className={cn("w-full", className)}>
      <div className="relative w-full bg-[#F5F3EC] border-t border-[#E1DDCF] overflow-hidden min-h-[300px] flex flex-col justify-end">
        {/* Karate Fighters Artwork in Full View */}
        {backgroundImageUrl && (
          <>
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center 42%",
                opacity: 0.92,
              }}
            />
            {/* Smooth Top Gradient Blend from Page Background */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to bottom, #F5F3EC 0%, rgba(245, 243, 236, 0.45) 25%, rgba(245, 243, 236, 0.1) 60%, rgba(245, 243, 236, 0.5) 100%)",
              }}
            />
          </>
        )}

        <div className="relative max-w-7xl mx-auto w-full px-4 md:px-8 py-8 z-10">
          {/* Card: Translucent frosted glass allowing the fighters to be visible while keeping text crystal clear */}
          <div className="bg-[#F5F3EC]/80 backdrop-blur-md border border-[#E1DDCF]/90 rounded-xl overflow-hidden shadow-[0_8px_30px_rgba(27,24,21,0.06)]">
            {/* ── Row 1: Brand & Social Links ── */}
            <div className="flex items-center justify-between px-6 py-3.5">
              <a
                href="/"
                aria-label={brandName}
                className="font-bold text-[19px] leading-none tracking-tight text-[#1B1815] hover:text-black transition-colors duration-150 flex items-center gap-2.5"
              >
                <RingFlowLogo className="h-[26px] w-[26px] text-[#1B1815] shrink-0" />
                <span className="font-black tracking-tight">{brandName}</span>
              </a>

              {socialLinks.length > 0 && (
                <ul className="flex items-center gap-3 list-none m-0 p-0">
                  {socialLinks.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.label}
                        className="flex items-center justify-center text-[#1B1815] hover:text-black hover:opacity-75 transition-all duration-150"
                      >
                        {link.icon}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 1px separator */}
            <div className="h-px bg-[#E1DDCF]/80 mx-6" />

            {/* ── Row 2: Copyright · Nav Links ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-3.5">
              {/* Left: Copyright */}
              <div className="flex items-center">
                <span className="text-[13px] text-[#68645A] leading-none font-medium">
                  © {copyright.year} {brandName}. All rights reserved.
                </span>
              </div>

              {/* Right: Main links + Legal links */}
              <div className="flex flex-col items-start sm:items-end gap-1">
                {mainLinks.length > 0 && (
                  <nav className="flex flex-wrap gap-x-5 gap-y-1 sm:justify-end">
                    {mainLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.href}
                        className="text-[13.5px] font-bold text-[#1B1815] hover:text-black transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                )}
                {legalLinks.length > 0 && (
                  <nav className="flex flex-wrap gap-x-5 gap-y-1 sm:justify-end">
                    {legalLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.href}
                        className="text-[12px] font-medium text-[#68645A] hover:text-[#1B1815] transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                )}
              </div>
            </div>
          </div>

          {/* ── Below Footer Card: Right Bottom Attribution Badge ── */}
          {copyright.builtBy && (
            <div className="flex justify-center sm:justify-end mt-3 sm:mt-4">
              {copyright.builtBy}
            </div>
          )}
        </div>
      </div>
    </footer>
  )
}
