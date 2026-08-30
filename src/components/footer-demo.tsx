import React from "react"
import { Mail } from "lucide-react"
import { Footer } from "@/components/ui/footer"

function GithubIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
    </svg>
  )
}

export function FooterDemo() {
  return (
    <Footer
      brandName="RingFlow"
      backgroundImageUrl="/footer-karate.jpg"
      socialLinks={[
        {
          icon: <GithubIcon />,
          href: "https://github.com/ull0sm/ringflow",
          label: "GitHub",
        },
        {
          icon: <Mail className="h-[18px] w-[18px]" />,
          href: "mailto:contact@cruxstudios.dev",
          label: "Contact",
        },
      ]}
      mainLinks={[
        { href: "/#hero", label: "Home" },
        { href: "/#events", label: "Events" },
        { href: "mailto:contact@cruxstudios.dev", label: "Contact" },
      ]}
      legalLinks={[
        { href: "/privacy", label: "Privacy" },
        { href: "/terms", label: "Terms" },
      ]}
      copyright={{
        year: 2026,
        builtBy: (
          <a
            href="https://cruxstudios.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#1B1815] hover:bg-black text-[#F5F3EC] border border-[#E1DDCF]/40 hover:border-cyan-400/60 shadow-[0_4px_14px_rgba(27,24,21,0.15)] hover:shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:-translate-y-0.5 transition-all duration-300"
          >
            <span className="font-['Inter',sans-serif] font-medium text-[12px] text-[#F5F3EC]/90 group-hover:text-white transition-colors">
              Built by
            </span>
            <div className="flex items-center gap-1.5">
              <img
                src="https://cruxstudios.dev/favicon.svg"
                alt="CruxStudios"
                className="h-4.5 w-4.5 drop-shadow-[0_0_6px_rgba(0,229,255,0.7)] group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
              />
              <span className="font-['Plus_Jakarta_Sans',sans-serif] font-black text-[13.5px] text-white tracking-tight group-hover:text-[#00E5FF] transition-colors">
                CruxStudios
              </span>
            </div>
            <svg
              className="w-3.5 h-3.5 text-[#F5F3EC]/80 group-hover:text-[#00E5FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </a>
        ),
      }}
    />
  )
}
