import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  GitMerge,
  Mail,
  Package,
  Route,
  Scale,
  Shield,
  Sparkles,
  TrendingUp,
  UtensilsCrossed,
  Workflow,
} from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const TODAY_ITEMS = [
  "Import donor orders and Flex fulfillment data from workbook exports",
  "Trace donations through to shelters with a reviewable ledger",
  "Run matching, resolve exceptions, and see impact on the dashboard",
  "Browse shelters, donation traces, and partner-safe exports",
];

const TOMORROW_ITEMS = [
  "Automated weekly matching for meals and care packs in separate pools",
  "Carry-forward balances so partial donor orders roll into the next cycle",
  "Personalised PDF impact reports emailed to every donor",
  "Engagement graphics showing fulfillment versus the gap Too Good covers",
  "Demand forecasting from historical shelter need to drive campaigns",
  "Privacy-safe reporting when a shelter address must stay confidential",
];

const VISION_PILLARS = [
  {
    title: "Two pools, one logic",
    description:
      "Meals and care packs never mix. Each has its own donor pool, ledger, carry-forward balance, and impact reports, matched with the same weekly rules.",
    icon: Scale,
    accent:
      "from-orange-500/20 to-orange-500/5 border-orange-500/30 text-orange-800 dark:text-orange-300",
    iconBg: "bg-orange-500/15 text-orange-600",
  },
  {
    title: "Close the loop",
    description:
      "Website donor orders and Flex shelter fulfillments were never linked at source. The matching engine creates that connection every week.",
    icon: GitMerge,
    accent:
      "from-sky-500/20 to-sky-500/5 border-sky-500/30 text-sky-700 dark:text-sky-300",
    iconBg: "bg-sky-500/15 text-sky-600",
  },
  {
    title: "A ledger you can trust",
    description:
      "Every allocation recorded: which donor funded which shelter, how much was used this week, what carries forward, and where Too Good filled a shortfall.",
    icon: BookOpen,
    accent:
      "from-emerald-500/20 to-emerald-500/5 border-emerald-500/30 text-emerald-700 dark:text-emerald-300",
    iconBg: "bg-emerald-500/15 text-emerald-600",
  },
  {
    title: "Reports donors feel",
    description:
      "Personalised PDFs showing meals or packs donated, shelters helped, and the fulfillment week. Repeat donors aggregated. Sensitive addresses handled with care.",
    icon: Mail,
    accent:
      "from-rose-500/20 to-rose-500/5 border-rose-500/30 text-rose-700 dark:text-rose-300",
    iconBg: "bg-rose-500/15 text-rose-600",
  },
  {
    title: "See the shortfall",
    description:
      "When donated supply does not meet shelter demand, Too Good covers the gap. Make that visible in engaging charts that drive further giving.",
    icon: BarChart3,
    accent:
      "from-amber-500/20 to-amber-500/5 border-amber-500/30 text-amber-800 dark:text-amber-300",
    iconBg: "bg-amber-500/15 text-amber-600",
  },
  {
    title: "Plan ahead",
    description:
      "Use historical Flex demand to forecast weekly and seasonal shelter need. Highlight upcoming shortfalls before they arrive.",
    icon: TrendingUp,
    accent:
      "from-teal-500/20 to-teal-500/5 border-teal-500/30 text-teal-700 dark:text-teal-300",
    iconBg: "bg-teal-500/15 text-teal-600",
  },
];

const DEMO_STEPS = [
  {
    step: "1",
    title: "Anchor in today",
    body: "Show the impact dashboard, ledger, and how matching already works.",
    colour: "bg-zinc-900 text-white",
  },
  {
    step: "2",
    title: "Bring both sides in",
    body: "Website donor orders on one side, Flex shelter fulfillments on the other.",
    colour: "bg-orange-600 text-white",
  },
  {
    step: "3",
    title: "Match the week",
    body: "Run meals and care packs separately. Exact matches first, then fill from the largest orders.",
    colour: "bg-sky-600 text-white",
  },
  {
    step: "4",
    title: "Read the ledger",
    body: "Allocations, carry-forward balances, and any gap Too Good covered.",
    colour: "bg-emerald-600 text-white",
  },
  {
    step: "5",
    title: "Close with donors",
    body: "Personalised PDF reports and engagement graphics that show collective impact.",
    colour: "bg-rose-600 text-white",
  },
  {
    step: "6",
    title: "Look forward",
    body: "Forecast shelter demand and surface the next shortfall before it hits.",
    colour: "bg-teal-600 text-white",
  },
];

const MATCHING_RULES = [
  {
    label: "Cadence",
    detail: "Weekly, aligned to the Flex kitchen report cycle.",
    icon: Route,
  },
  {
    label: "Meals",
    detail: "Fresh, frozen, kids friendly, vegetarian, and more. Summed per shelter per week.",
    icon: UtensilsCrossed,
  },
  {
    label: "Care packs",
    detail: "Its own pool and ledger. Same matching logic, never mixed with meals.",
    icon: Package,
  },
  {
    label: "Privacy",
    detail: "Sensitive shelters stay anonymous in donor-facing reports.",
    icon: Shield,
  },
];

export default function FutureImpactPage() {
  return (
    <PageLayout className="max-w-6xl py-8 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-orange-600 via-amber-500 to-teal-600 px-6 py-10 text-white sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-10 size-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative">
          <Badge className="mb-4 border-white/20 bg-white/15 text-white hover:bg-white/15">
            Future thinking
          </Badge>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-5xl">
            Close the loop from donation to shelter impact
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/90 text-pretty sm:text-lg">
            A vision for connecting every donor contribution to the shelters it
            reached, with a ledger you can stand behind, reports donors actually
            receive, and insight into what is still needed next week.
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
              <li
                key={item}
                className="flex gap-3 text-sm leading-relaxed text-muted-foreground"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                {item}
              </li>
            ))}
          </ul>
          <Link
            href="/donations"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "mt-6 w-fit"
            )}
          >
            See current impact
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="rounded-2xl border border-orange-500/25 bg-linear-to-br from-orange-500/10 via-amber-500/5 to-transparent p-6 sm:p-8">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-orange-500/15">
              <Sparkles className="size-4 text-orange-600" />
            </div>
            <h2 className="font-heading text-xl font-semibold">
              What becomes possible
            </h2>
          </div>
          <ul className="space-y-3">
            {TOMORROW_ITEMS.map((item) => (
              <li key={item} className="flex gap-3 text-sm leading-relaxed">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange-500" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border bg-muted/20 p-6 sm:p-8">
        <h2 className="font-heading text-xl font-semibold sm:text-2xl">
          How matching would work
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          High level only. Exact matches first, then fill from the largest donor
          orders. Anything left over carries into the next week.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MATCHING_RULES.map((rule) => (
            <div
              key={rule.label}
              className="rounded-xl border bg-card p-4"
            >
              <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600">
                <rule.icon className="size-4" />
              </div>
              <h3 className="font-heading text-sm font-semibold">{rule.label}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {rule.detail}
              </p>
            </div>
          ))}
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
              <h3 className="font-heading text-lg font-semibold">
                {pillar.title}
              </h3>
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
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
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
            Same import pipeline, matching workflow, donation ledger, and shelter
            registry. This vision adds the weekly automation, donor-facing
            outputs, and forecasting layer on top.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            "Import pipeline",
            "Matching engine",
            "Donation ledger",
            "Shelter registry",
            "Review workflow",
            "Impact charts",
          ].map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </section>

      <p className="mt-12 text-center text-xs text-muted-foreground">
        Vision only. Demo data would be synthetic. Nothing here changes the
        working impact flow until the team chooses to graduate it.
      </p>
    </PageLayout>
  );
}
