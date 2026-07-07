import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms of Service | RingFlow",
  description: "Terms of service for using RingFlow.",
}

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">

      {/* Header — primary-container (deep navy) per design system */}
      <div className="bg-primary-container">
        <div className="max-w-3xl mx-auto px-margin-desktop pt-12 pb-10">
          <p className="text-label-caps font-label-caps text-on-primary-container mb-4 uppercase tracking-widest">
            <Link href="/" className="hover:text-inverse-on-surface transition-colors">Home</Link>
            <span className="mx-2 opacity-40">/</span>
            Terms of Service
          </p>
          <h1 className="text-headline-lg font-headline-lg text-inverse-on-surface mb-2">
            Terms of Service
          </h1>
          <p className="text-body-sm font-body-sm text-on-primary-container">
            Effective July 2026
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-3xl mx-auto px-margin-desktop py-12 space-y-8">

        <p className="text-body-md font-body-md text-on-surface-variant">
          By using RingFlow you agree to these terms. RingFlow is built and operated by{" "}
          <a href="https://cruxstudios.dev" target="_blank" rel="noopener noreferrer" className="text-secondary underline-offset-4 hover:underline">
            CruxStudios
          </a>
          . If you don't agree, don't use the platform.
        </p>

        <Rule />

        <Section title="What RingFlow is">
          <p>
            A real-time tournament management tool for martial arts events. It handles bracket creation,
            scheduling, live scoring, and result display. Provided free of charge as an open-source project.
          </p>
        </Section>

        <Section title="Who can use it">
          <p>
            Anyone can view a public scoreboard without an account. Admin and moderator accounts are
            provisioned by CruxStudios. Administrators are responsible for all data they enter and for
            the moderators they authorise.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>
            Use RingFlow for running legitimate tournaments. Do not enter false or defamatory data about
            participants, attempt to gain unauthorised access to admin functions, introduce bots or automated
            scrapers, or interfere with other users' access to the platform. Violations may result in immediate
            account suspension.
          </p>
        </Section>

        <Section title="Data and privacy">
          <p>
            All data is scoped to a single event and deleted when that event ends. Nothing is retained.
            By using the platform you accept this model and acknowledge that results are not stored permanently.
            See our{" "}
            <Link href="/privacy" className="text-secondary underline-offset-4 hover:underline">
              Privacy Policy
            </Link>{" "}
            for details.
          </p>
        </Section>

        <Section title="No warranties">
          <p>
            RingFlow is provided as-is. We don't guarantee uptime or accuracy of results. Tournament
            outcomes depend on data entered by event administrators — CruxStudios is not responsible
            for errors in that data.
          </p>
        </Section>

        <Section title="Limitation of liability">
          <p>
            CruxStudios is not liable for indirect, incidental, or consequential damages arising from
            use of RingFlow — including loss of data, disputes over results, or reputational harm.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these terms. The effective date above will change when we do. Continued use
            after an update means you accept the revised terms.
          </p>
        </Section>

        <Section title="Contact">
          <p>
            Email{" "}
            <a href="mailto:contact@cruxstudios.dev" className="text-secondary underline-offset-4 hover:underline">
              contact@cruxstudios.dev
            </a>
            .
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
