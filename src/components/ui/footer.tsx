import React from "react"
import { cn } from "@/lib/utils"

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
  /** The product/app name shown in the brand row. No logo here — RingFlow has none. */
  brandName: string
  socialLinks?: SocialLink[]
  mainLinks?: NavLink[]
  legalLinks?: NavLink[]
  copyright: {
    year: number
    /** Node rendered in the "Built by" attribution slot — pass the studio logo + name */
    builtBy?: React.ReactNode
  }
  /** Martial-arts background image URL; overlaid with primary-container tint */
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
      <div
        className="relative w-full bg-primary-container"
        style={
          backgroundImageUrl
            ? {
                backgroundImage: `url(${backgroundImageUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center 40%",
              }
            : undefined
        }
      >
        {/* Overlay: primary-container colour at high opacity keeps the card legible */}
        {backgroundImageUrl && (
          <div
            aria-hidden
            className="absolute inset-0 bg-primary-container/85"
          />
        )}

        <div className="relative max-w-7xl mx-auto px-margin-desktop py-10">
          {/*
           * Card: Level 1 surface in the dark context.
           * Uses border rather than shadow per DESIGN.md elevation rules.
           */}
          <div className="border border-white/[0.07] rounded-lg overflow-hidden">

            {/* ── Row 1: app name  ·  social icons ── */}
            <div className="flex items-center justify-between px-card-padding py-[18px]">
              <a
                href="/"
                aria-label={brandName}
                className="font-semibold text-[18px] leading-none tracking-tight text-inverse-on-surface hover:text-white transition-colors duration-150"
              >
                {brandName}
              </a>

              {socialLinks.length > 0 && (
                <ul className="flex items-center gap-1 list-none m-0 p-0">
                  {socialLinks.map((link, i) => (
                    <li key={i}>
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={link.label}
                        className="flex items-center justify-center w-8 h-8 rounded-lg text-on-primary-container hover:bg-white/10 hover:text-inverse-on-surface transition-all duration-150"
                      >
                        {link.icon}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* 1px separator */}
            <div className="h-px bg-white/[0.07] mx-card-padding" />

            {/* ── Row 2: copyright + attribution  ·  nav links ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-card-padding py-[18px]">

              {/* Left: copyright + "Built by CruxStudios" */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[13px] text-on-primary-container leading-none">
                  © {copyright.year}
                </span>
                {copyright.builtBy && (
                  <div className="flex items-center gap-1.5 text-[16px] text-on-primary-container/60">
                    <span className="font-data-mono uppercase tracking-widest text-[12px]">Built by</span>
                    {copyright.builtBy}
                  </div>
                )}
              </div>

              {/* Right: main links  +  legal links stacked */}
              <div className="flex flex-col items-start sm:items-end gap-1.5">
                {mainLinks.length > 0 && (
                  <nav className="flex flex-wrap gap-x-5 gap-y-1 sm:justify-end">
                    {mainLinks.map((link, i) => (
                      <a
                        key={i}
                        href={link.href}
                        className="text-[13px] font-medium text-inverse-on-surface hover:text-white transition-colors duration-150"
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
                        className="text-[12px] text-on-primary-container/55 hover:text-on-primary-container transition-colors duration-150"
                      >
                        {link.label}
                      </a>
                    ))}
                  </nav>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
