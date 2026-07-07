import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy Policy | RingFlow",
  description: "How RingFlow handles your data.",
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Header — primary-container (deep navy) per design system */}
      <div className="bg-primary-container">
        <div className="max-w-3xl mx-auto px-margin-desktop pt-12 pb-10">
          <p className="text-label-caps font-label-caps text-on-primary-container mb-4 uppercase tracking-widest">
            <Link href="/" className="hover:text-inverse-on-surface transition-colors">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            Privacy Policy
          </p>
          <h1 className="text-headline-lg font-headline-lg text-inverse-on-surface mb-2">
            Privacy Policy
          </h1>
          <p className="text-body-sm font-body-sm text-on-primary-container">
            Effective July 2026
          </p>
        </div>
      </div>

      {/* Body — background slate tint, Level 0 surface */}
      <div className="max-w-3xl mx-auto px-margin-desktop py-12 space-y-8">

        <p className="text-body-md font-body-md text-on-surface-variant">
          RingFlow is built and operated by{" "}
          <a href="https://cruxstudios.dev" target="_blank" rel="noopener noreferrer" className="text-secondary underline-offset-4 hover:underline">
            CruxStudios
          </a>
          . This policy explains what we collect, why, and how long we keep it.
        </p>

        <Rule />

        <Section title="What we collect">
          <p>
            Only what is necessary to run a tournament: event name, schedule, bracket data, participant names,
            weight classes, and round results entered by the event administrator. Admin and moderator credentials
            are stored as one-way hashes.
          </p>
          <p>
            We do not collect payment information, government IDs, or any sensitive personal data.
          </p>
        </Section>

        <Section title="How long we keep it">
          <p>
            Data is scoped entirely to the lifetime of an event. When an event is marked complete, all associated
            data — participants, brackets, results — is permanently deleted. Nothing is archived or retained.
          </p>
          <p>
            RingFlow is built to be ephemeral. That is not a caveat; it is the point.
          </p>
        </Section>

        <Section title="Third-party services">
          <p>
            We use Supabase for database and authentication, and Cloudflare Turnstile for bot protection on
            public forms. Turnstile does not fingerprint users. Hosting is on Vercel. Each service operates
            under its own privacy policy.
          </p>
        </Section>

        <Section title="Cookies">
          <p>
            Session cookies only, for authentication. No advertising cookies, no cross-site tracking, no
            analytics that profile individual users.
          </p>
        </Section>

        <Section title="Your rights">
          <p>
            You can request a copy of any personal data we hold, ask us to correct it, or ask us to delete it.
            In most cases your data has already been deleted automatically. Email{" "}
            <a href="mailto:contact@cruxstudios.dev" className="text-secondary underline-offset-4 hover:underline">
              contact@cruxstudios.dev
            </a>
            .
          </p>
        </Section>

        <Section title="Changes">
          <p>
            If we update this policy the effective date above will change. Continued use of RingFlow after
            an update constitutes acceptance.
          </p>
        </Section>

        <Rule />

      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-headline-sm font-headline-sm text-on-surface">{title}</h2>
      <div className="text-body-md font-body-md text-on-surface-variant space-y-2 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function Rule() {
  return <div className="h-px bg-outline-variant" />
}
