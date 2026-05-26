import Image from "next/image";
import { ButtonLink, Panel, SectionHeading, StatCard } from "@/components/ui";

const operatingPillars = [
  {
    title: "Home watch inspections",
    description: "Mobile-ready visit records, condition checks, photos, urgent flags, and polished owner summaries."
  },
  {
    title: "Property operations",
    description: "Shared schedules, vendor context, maintenance issues, and access notes organized around each estate."
  },
  {
    title: "Owner-ready reporting",
    description: "Concise web and PDF reports that feel trustworthy, discreet, and easy for homeowners to review."
  }
];

const audiences = ["Affluent homeowners", "Home watch teams", "Property managers", "STR hosts", "Concierge vendors"];

const workflow = [
  "Inspect",
  "Document",
  "Coordinate",
  "Report"
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-paper text-ink">
      <section className="relative min-h-[86svh] overflow-hidden bg-ink text-white">
        <Image
          src="/estateiq-hero.png"
          alt="Luxury desert estate illuminated at twilight"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-ink/58" />

        <div className="relative mx-auto flex min-h-[86svh] w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex items-center justify-between gap-4">
            <a href="/" className="block shrink-0" aria-label="EstateIQ home">
              <Image
                src="/estateiq-logo-clean.png"
                alt="EstateIQ"
                width={672}
                height={448}
                className="h-16 w-auto sm:h-20"
                priority
              />
            </a>
            <nav className="hidden items-center gap-6 text-sm font-bold text-white/76 sm:flex">
              <a href="#platform" className="transition hover:text-white">
                Platform
              </a>
              <a href="#reports" className="transition hover:text-white">
                Reports
              </a>
              <a href="#demo" className="transition hover:text-white">
                Demo
              </a>
            </nav>
            <ButtonLink href="/demo" variant="ghost" className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/20">
              Open Demo
            </ButtonLink>
          </header>

          <div className="flex flex-1 items-center py-16 sm:py-20">
            <div className="max-w-3xl">
              <p className="type-eyebrow text-[#d7a15e]">Luxury property operations</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.06] tracking-normal text-white sm:text-6xl">
                Estate management clarity for homes that require precision.
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/78 sm:text-lg">
                EstateIQ brings inspections, maintenance issues, vendors, schedules, owner updates, and refined reports
                into one calm operating system for premium properties.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/demo" size="lg">
                  View Live Demo
                </ButtonLink>
                <ButtonLink
                  href="/reports/demo-inspection-home-watch"
                  variant="ghost"
                  size="lg"
                  className="!border-white/20 !bg-white/10 !text-white hover:!bg-white/20"
                >
                  Sample Report
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="bg-paper px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
          <SectionHeading
            eyebrow="Estate command center"
            title="Built for the details owners never want to chase."
            description="A clean shared record for the people responsible for keeping a property ready, documented, and protected."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Demo report" value="3 pages" detail="Homeowner-friendly PDF" />
            <StatCard label="Inspection flow" value="Mobile first" detail="Fast on-site capture" />
            <StatCard label="Records" value="Shared" detail="Property, vendor, issue, schedule" />
          </div>
        </div>

        <div className="mx-auto mt-8 grid max-w-7xl gap-4 md:grid-cols-3">
          {operatingPillars.map((pillar) => (
            <Panel key={pillar.title} tone="paper" className="p-5">
              <h3 className="text-lg font-extrabold text-ink">{pillar.title}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">{pillar.description}</p>
            </Panel>
          ))}
        </div>
      </section>

      <section id="reports" className="bg-cream px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div>
            <SectionHeading
              eyebrow="Owner communication"
              title="Reports that read like a trusted estate manager wrote them."
              description="Concise summaries, visible condition context, urgent items, photos, and PDF export stay focused on what the homeowner needs to know."
            />
            <div className="mt-6 flex flex-wrap gap-2">
              {audiences.map((audience) => (
                <span
                  key={audience}
                  className="rounded-estate border border-line bg-white px-3 py-2 text-xs font-extrabold text-charcoal"
                >
                  {audience}
                </span>
              ))}
            </div>
          </div>

          <Panel className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4 border-b border-line pb-4">
              <div>
                <p className="type-eyebrow">Cielo Vista Estate</p>
                <h3 className="mt-2 text-xl font-extrabold text-ink">Home Watch Summary</h3>
              </div>
              <span className="rounded-estate bg-success-soft px-3 py-2 text-xs font-extrabold text-sage-dark">
                Stable
              </span>
            </div>
            <div className="grid gap-3 py-4 sm:grid-cols-2">
              <StatCard label="Interior" value="72 F" detail="Climate stable" />
              <StatCard label="Urgent items" value="0" detail="No owner action flagged" />
            </div>
            <p className="border-t border-line pt-4 text-sm leading-6 text-slate-600">
              Inspection completed with exterior, interior, pool, and access checks documented. Minor landscape
              monitoring noted near the south planter; no urgent homeowner action is indicated.
            </p>
          </Panel>
        </div>
      </section>

      <section id="demo" className="bg-ink px-4 py-10 text-white sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <p className="type-eyebrow text-[#d7a15e]">MVP workflow</p>
            <h2 className="mt-3 text-3xl font-extrabold leading-tight text-white sm:text-4xl">
              From site visit to owner packet without losing the thread.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {workflow.map((step, index) => (
              <div key={step} className="rounded-estate border border-white/12 bg-white/8 p-4">
                <span className="text-xs font-extrabold text-white/48">0{index + 1}</span>
                <p className="mt-6 text-sm font-extrabold text-white">{step}</p>
              </div>
            ))}
          </div>
          <div className="lg:col-span-2">
            <ButtonLink href="/demo" size="lg">
              Enter EstateIQ Demo
            </ButtonLink>
          </div>
        </div>
      </section>
    </main>
  );
}
