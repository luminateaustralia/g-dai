import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  GitCompareArrows,
  HeartHandshake,
  Layers,
  LineChart,
  Sparkles,
  Users,
  Workflow,
} from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TODAY_ITEMS = [
  "Import the PWI client tracker and generate quarterly reports",
  "Domain movement, cohort charts, and validation before publish",
  "AI assistant grounded in a frozen report snapshot",
];

const TOMORROW_ITEMS = [
  "CSnet outcomes alongside PWI in one shared data home",
  "Follow participants across intakes from baseline to 12 months",
  "Compare intakes side by side in seconds, not spreadsheets",
  "Surface equity gaps by housing, language, site, and more",
  "Overlay program changes and external events on trend lines",
  "Connect wellbeing to attendance and wages from Tanda",
];

const VISION_PILLARS = [
  {
    title: "One data home",
    description:
      "CSnet exports and the PWI tracker feed the same wellbeing metrics. No duplicate definitions, no reconciling two systems by hand.",
    icon: Layers,
    accent: "from-violet-500/20 to-violet-500/5 border-violet-500/30 text-violet-700 dark:text-violet-300",
    iconBg: "bg-violet-500/15 text-violet-600",
  },
  {
    title: "The full journey",
    description:
      "Track outcomes from baseline through to 12 months. See how wellbeing shifts over time, not just at a single snapshot.",
    icon: LineChart,
    accent: "from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-700 dark:text-sky-300",
    iconBg: "bg-sky-500/15 text-sky-600",
  },
  {
    title: "Compare intakes instantly",
    description:
      "Pick Intake 24 and Intake 26 and see their PWI trajectories on one chart. The question the team asks today becomes a click.",
    icon: GitCompareArrows,
    accent: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-500/15 text-emerald-600",
  },
  {
    title: "An equity lens",
    description:
      "Break outcomes down by housing at intake, country of origin, language, age band, and more. Turn \"we suspect\" into visible evidence.",
    icon: Users,
    accent: "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-700 dark:text-rose-300",
    iconBg: "bg-rose-500/15 text-rose-600",
  },
  {
    title: "Context that explains shifts",
    description:
      "Plot curriculum changes, site openings, staffing moves, and cost-of-living moments against outcome trends. See what changed when.",
    icon: CalendarRange,
    accent: "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-700 dark:text-amber-300",
    iconBg: "bg-amber-500/15 text-amber-600",
  },
  {
    title: "Wellbeing meets work",
    description:
      "Bring in attendance, lateness, and wages alongside survey outcomes. Understand whether program engagement tracks with how people feel.",
    icon: HeartHandshake,
    accent: "from-teal-500/20 to-teal-500/5 border-teal-500/30 text-teal-700 dark:text-teal-300",
    iconBg: "bg-teal-500/15 text-teal-600",
  },
];

const DEMO_STEPS = [
  {
    step: "1",
    title: "Anchor in today",
    body: "Show what already works: import, validate, report, and AI on a frozen snapshot.",
    colour: "bg-zinc-900 text-white",
  },
  {
    step: "2",
    title: "Compare cohorts",
    body: "Select two intakes and read their trajectories side by side.",
    colour: "bg-violet-600 text-white",
  },
  {
    step: "3",
    title: "Surface a gap",
    body: "Filter by housing at intake and show where outcomes diverge.",
    colour: "bg-rose-600 text-white",
  },
  {
    step: "4",
    title: "Ask why",
    body: "AI returns a grounded hypothesis, not a causal claim. Humans decide.",
    colour: "bg-amber-500 text-zinc-900",
  },
  {
    step: "5",
    title: "Close on the report",
    body: "A richer quarterly report with equity callouts and what changed this quarter.",
    colour: "bg-emerald-600 text-white",
  },
];

export default function FutureWellnessPage() {
  return (
    <PageLayout className="max-w-6xl py-8 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-violet-600 via-fuchsia-600 to-rose-500 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <Badge className="mb-4 border-white/20 bg-white/15 text-white hover:bg-white/15">
            Future thinking
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Making wellbeing insights clearer, fairer, and faster
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/90 text-pretty sm:text-lg">
            A vision for what comes next. Built on the reporting engine the team
            already has, extended so the questions you care about are answerable
            in the room, not after hours in a spreadsheet.
          </p>
        </div>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
              <BarChart3 className="size-4 text-muted-foreground" />
            </div>
            <h2 className="font-heading text-xl font-semibold">What works today</h2>
          </div>
          <ul className="space-y-3">
            {TODAY_ITEMS.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {item}
              </li>
            ))}
          </ul>
          <Button variant="outline" size="sm" className="mt-6" asChild>
            <Link href="/wellbeing">
              See current wellbeing
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-violet-500/25 bg-linear-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-violet-500/15">
              <Sparkles className="size-4 text-violet-600" />
            </div>
            <h2 className="font-heading text-xl font-semibold">What becomes possible</h2>
          </div>
          <ul className="space-y-3">
            {TOMORROW_ITEMS.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-violet-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-8 text-center">
          <h2 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
            Six ways we can make it better
          </h2>
          <p className="mt-2 text-muted-foreground">
            High-level capabilities, not a build list. Each one extends what you
            already have.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {VISION_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className={cn(
                "flex flex-col rounded-2xl border bg-linear-to-br p-5 sm:p-6",
                pillar.accent
              )}
            >
              <div
                className={cn(
                  "mb-4 flex size-11 items-center justify-center rounded-xl",
                  pillar.iconBg
                )}
              >
                <pillar.icon className="size-5" />
              </div>
              <h3 className="font-heading text-lg font-semibold">{pillar.title}</h3>
              <p className="mt-2 text-sm leading-relaxed opacity-90">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 rounded-2xl border bg-muted/30 p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          <Workflow className="size-5 text-muted-foreground" />
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">
            How you might tell the story
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {DEMO_STEPS.map((step) => (
            <div
              key={step.step}
              className="flex flex-col rounded-xl border bg-card p-4"
            >
              <span
                className={cn(
                  "mb-3 inline-flex size-8 items-center justify-center rounded-full text-sm font-semibold",
                  step.colour
                )}
              >
                {step.step}
              </span>
              <h3 className="font-heading text-sm font-semibold">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="font-heading text-xl font-semibold sm:text-2xl">
            Built on what you already have
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Same Next.js app, same metric engine, same chart library, same AI
            assistant pattern, same report freeze for reproducibility. This is
            an extension layer for future thinking, not a rebuild.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "Existing charts",
            "Report engine",
            "Workers AI",
            "Validation",
            "Brand voice",
          ].map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </section>

      <p className="mt-12 text-center text-xs text-muted-foreground">
        Vision only. Demo data would be synthetic. Nothing here changes the
        working wellbeing flow until the team chooses to graduate it.
      </p>
    </PageLayout>
  );
}
