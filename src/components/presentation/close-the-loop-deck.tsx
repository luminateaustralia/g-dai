"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Clock,
  Heart,
  Home,
  Mail,
  Maximize,
  Minimize,
  Package,
  Presentation,
  Route,
  Shield,
  Sparkles,
  Target,
  User,
  Users,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";

const LIVE_DEMO_URL = "https://g-dai.cloudepl.workers.dev/";

const QR_CODES = [
  {
    url: LIVE_DEMO_URL,
    label: "Scan to open the deployed app",
  },
] as const;

const TEAM = [
  { name: "Joshua Farrugia", role: "Black Nova VC" },
  { name: "Yucca Reinecke", role: "EY · AI for Good" },
  { name: "Anthony Hook", role: "Product & marketing tech" },
  { name: "Alejandra Castro", role: "Data analyst" },
] as const;

type SectionId = "problem" | "innovation" | "quality";

type Section = {
  id: SectionId;
  label: string;
  shortLabel: string;
  icon: LucideIcon;
};

const SECTIONS: Section[] = [
  {
    id: "problem",
    label: "Aligned to the problem",
    shortLabel: "Problem",
    icon: Target,
  },
  {
    id: "innovation",
    label: "Innovation & AI",
    shortLabel: "Innovation",
    icon: Sparkles,
  },
  {
    id: "quality",
    label: "Quality of presentation",
    shortLabel: "Quality",
    icon: Presentation,
  },
];

type Slide = {
  section?: SectionId;
  content: React.ReactNode;
};

const SLIDE_EYEBROW =
  "text-base font-medium tracking-wide text-muted-foreground uppercase sm:text-lg";
const SLIDE_H1 =
  "font-heading text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl";
const SLIDE_H2 =
  "mt-3 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl";
const SLIDE_H3 = "font-heading text-xl font-semibold sm:text-2xl";
const SLIDE_BODY =
  "text-lg leading-relaxed text-muted-foreground sm:text-xl";
const SLIDE_BODY_INTRO =
  "mt-5 max-w-2xl text-xl text-muted-foreground text-pretty sm:text-2xl";
const SLIDE_TAGLINE =
  "mt-8 text-base font-medium tracking-wide text-muted-foreground uppercase sm:text-lg";

function LiveDemoQrCode() {
  return (
    <div className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-8">
      {QR_CODES.map((item) => (
        <div key={item.url} className="flex flex-col items-center gap-3">
          <div
            className="rounded-2xl border bg-white p-4 shadow-sm"
            aria-label={`QR code linking to ${item.url}`}
          >
            <QRCode
              value={item.url}
              size={148}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className="max-w-52 text-center text-base text-muted-foreground sm:text-lg">
            {item.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function SlideMeta({
  speaker,
  budget,
}: {
  speaker?: string;
  budget?: string;
}) {
  if (!speaker && !budget) {
    return null;
  }

  return (
    <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:text-base">
      {speaker ? <span className="font-medium">{speaker}</span> : null}
      {budget ? <span>Time budget · {budget}</span> : null}
    </div>
  );
}

function NumberedItem({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-4 rounded-xl border bg-muted/30 p-5 sm:p-6">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
        {number}
      </span>
      <div>
        <p className="text-lg font-medium sm:text-xl">{title}</p>
        <p className={cn("mt-2", SLIDE_BODY)}>{body}</p>
      </div>
    </li>
  );
}

const SLIDES: Slide[] = [
  {
    content: (
      <div className="flex flex-col items-center text-center">
        <Badge variant="secondary" className="mb-4 px-3 py-1 text-base">
          G&apos;DAI Hack Day · 29 May 2026
        </Badge>
        <p className={SLIDE_EYEBROW}>Team · Two Good Co</p>
        <h1 className={cn(SLIDE_H1, "mt-4")}>Close the loop.</h1>
        <p className={SLIDE_BODY_INTRO}>
          Prove donation impact. Measure participant wellbeing. One platform,
          one source of truth.
        </p>
        <div className="mt-10 grid w-full max-w-3xl gap-3 sm:grid-cols-2">
          {TEAM.map((member) => (
            <div
              key={member.name}
              className="rounded-xl border bg-card px-5 py-4 text-left"
            >
              <p className="text-lg font-medium">{member.name}</p>
              <p className="mt-1 text-base text-muted-foreground">
                {member.role}
              </p>
            </div>
          ))}
        </div>
        <p className={cn(SLIDE_TAGLINE, "mt-10")}>Follow along</p>
        <p className={cn("mt-2 max-w-xl", SLIDE_BODY)}>
          Scan to open the deployed app.{" "}
          <span className="font-medium text-foreground">/presentation</span> has
          the live in-product deck.
        </p>
        <LiveDemoQrCode />
      </div>
    ),
  },
  {
    section: "problem",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>The problem, in two numbers</p>
        <h2 className={SLIDE_H2}>Two stories Too Good can&apos;t yet tell</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-7 sm:p-8">
            <div className="mb-5 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Clock className="size-6" />
            </div>
            <p className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
              80h
            </p>
            <h3 className={cn(SLIDE_H3, "mt-4")}>
              To assemble a single quarterly impact report
            </h3>
            <p className={cn("mt-3", SLIDE_BODY)}>
              Pulled by hand from CSnet, Tanda and spreadsheets across sites.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Source: Rob Caslick, NFP briefing call, 29 May 2026
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-7 sm:p-8">
            <div className="mb-5 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="size-6" />
            </div>
            <p className="font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
              0
            </p>
            <h3 className={cn(SLIDE_H3, "mt-4")}>
              Donors who hear what their meal actually did
            </h3>
            <p className={cn("mt-3", SLIDE_BODY)}>
              Hundreds give. No system connects a gift to the shelter it served.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Source: TG-2 problem statement, G&apos;DAI brief
            </p>
          </div>
        </div>
        <SlideMeta speaker="Anthony · 25s" budget="25 seconds" />
      </div>
    ),
  },
  {
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>Built before the day</p>
        <h2 className={SLIDE_H2}>Not a vibe-coded mockup. A working app.</h2>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {[
            {
              label: "Frontend",
              value:
                "Next.js 15 App Router · React Server Components · shadcn/ui",
            },
            {
              label: "Data",
              value: "Drizzle ORM · Cloudflare D1 SQLite",
            },
            {
              label: "AI",
              value:
                "Cloudflare Workers AI · gpt-oss-120b · brand-voice grounded",
            },
            {
              label: "Deploy",
              value:
                "Cloudflare Workers via OpenNext · edge runtime · runs cheap",
            },
            {
              label: "Quality",
              value:
                "Vitest suite over import, scoring, validation, privacy, matching",
            },
            {
              label: "Governance",
              value:
                "4 roles (admin, impact, ops, viewer) · audit log · frozen snapshots",
            },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
                {item.label}
              </p>
              <p className="mt-2 text-base text-foreground sm:text-lg">
                {item.value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border bg-card p-6 sm:p-7">
          <p className="text-lg font-medium sm:text-xl">Two surfaces live today</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <ul className="space-y-2 text-base text-muted-foreground sm:text-lg">
              {[
                "/wellbeing",
                "/wellbeing/reports",
                "/import",
                "/ai",
              ].map((route) => (
                <li key={route} className="font-mono text-sm sm:text-base">
                  · {route}
                </li>
              ))}
            </ul>
            <ul className="space-y-2 text-base text-muted-foreground sm:text-lg">
              {[
                "/donations",
                "/donations/ledger",
                "/donations/queue",
                "/donations/shelters",
              ].map((route) => (
                <li key={route} className="font-mono text-sm sm:text-base">
                  · {route}
                </li>
              ))}
            </ul>
          </div>
          <p className={cn("mt-5", SLIDE_BODY)}>
            Wellbeing imports the PWI Client Tracker, validates, scores and
            freezes a reproducible quarterly snapshot. Donations holds a unified
            ledger and a sensitive-shelter-safe review queue.
          </p>
        </div>
        <SlideMeta speaker="Anthony · 25s" budget="30 seconds" />
      </div>
    ),
  },
  {
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>Live · Impact reporting</p>
        <h2 className={SLIDE_H2}>PWI tracker in. Reproducible report out.</h2>
        <p className={cn("mt-4 max-w-3xl", SLIDE_BODY)}>
          Upload the tracker, validate the data quality, generate a frozen
          snapshot that won&apos;t drift if the source changes. Two grounded AI
          assistants share the same brand voice and never invent figures.
        </p>
        <ul className="mt-8 space-y-3">
          {[
            "14 metric definitions (PWI + work-readiness extensions), configurable, scale-aware",
            "Cohort breakdown, change scores, validation issues, completeness per time point",
            "Two AI assistants: dashboard-level (across reports) and per-report, both grounded on the snapshot",
            "Six Recharts surfaces · CSV and XLSX export from the same frozen snapshot",
          ].map((point) => (
            <li key={point} className={cn("flex gap-3", SLIDE_BODY)}>
              <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" />
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/wellbeing/reports/q1-2026"
            className={cn(buttonVariants(), "h-11 gap-2 px-5 text-base")}
          >
            <Heart className="size-5" />
            Live demo · /wellbeing
          </Link>
        </div>
        <SlideMeta speaker="Anthony · 25s" budget="30 seconds" />
      </div>
    ),
  },
  {
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>Live · Donation traceability</p>
        <h2 className={SLIDE_H2}>Donor. Order. Shelter. One traceable line.</h2>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {[
            { icon: User, label: "Donor", detail: "First-name donation record" },
            {
              icon: Package,
              label: "Customer order",
              detail: "Product · postcode · quantity",
            },
            {
              icon: Home,
              label: "Shelter",
              detail: "Fulfilment · date · privacy-safe",
            },
          ].map((step, index) => (
            <div key={step.label} className="flex items-center gap-3 sm:gap-4">
              <div className="rounded-2xl border bg-card px-5 py-4 text-center sm:min-w-44">
                <step.icon className="mx-auto size-5 text-primary" />
                <p className="mt-3 text-lg font-medium">{step.label}</p>
                <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                  {step.detail}
                </p>
              </div>
              {index < 2 ? (
                <ArrowRight className="size-5 text-muted-foreground/50" />
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Match method",
              body: "Postcode + product + quantity",
            },
            {
              title: "Below threshold",
              body: "Goes to manual review queue",
            },
            {
              title: "Sensitive shelters",
              body: "Name and location masked",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border p-5 sm:p-6">
              <p className="text-lg font-medium sm:text-xl">{item.title}</p>
              <p className={cn("mt-2", SLIDE_BODY)}>{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/donations"
            className={cn(buttonVariants(), "h-11 gap-2 px-5 text-base")}
          >
            <Route className="size-5" />
            Live demo · /donations
          </Link>
          <Link
            href="/donations-beta"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 gap-2 px-5 text-base"
            )}
          >
            Also at /donations-beta
          </Link>
        </div>
        <SlideMeta speaker="Anthony · 25s" budget="30 seconds" />
      </div>
    ),
  },
  {
    content: (
      <div className="flex flex-col items-center text-center">
        <p className={SLIDE_EYEBROW}>The hand-off</p>
        <h2 className={SLIDE_H2}>From shipped to aspired</h2>
        <p className={cn("mt-6 max-w-2xl text-pretty", SLIDE_BODY_INTRO)}>
          Built means the team can generate the report. It doesn&apos;t yet mean
          they can ask the right questions of it.
        </p>
        <p className={cn("mt-6 max-w-xl", SLIDE_BODY)}>
          Here&apos;s where each PRD takes that further.
        </p>
        <SlideMeta speaker="Joshua · 15s" budget="15 seconds" />
      </div>
    ),
  },
  {
    section: "problem",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>
          Aligned to the problem · walk it live at /future/wellness
        </p>
        <h2 className={SLIDE_H2}>From snapshot to story</h2>
        <ul className="mt-8 space-y-4">
          <NumberedItem
            number="01"
            title="CSnet ingestion, alongside the PWI tracker"
            body="Parser tested against the real export. Long-format storage, idempotent, dedupes the same survey across multiple comparison tabs."
          />
          <NumberedItem
            number="02"
            title="Longitudinal participant master"
            body="Stable CSnet client ID. One woman, tracked across cohorts and years. Cohort 24 vs 26, side by side, in seconds."
          />
          <NumberedItem
            number="03"
            title="Tanda for attendance and wages"
            body="Mocked for the demo, scoped for the API connector after. Hours by site, lateness, wages paid. Replaces the monthly hand-pull."
          />
          <NumberedItem
            number="04"
            title="Macro context overlay"
            body="Program changes and external indicators on the same timeline as outcome trends. The &lsquo;why&rsquo; alongside the &lsquo;what&rsquo;."
          />
        </ul>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <blockquote className="rounded-xl border bg-muted/30 p-5 italic sm:p-6">
            <p className={SLIDE_BODY}>
              &ldquo;She doesn&apos;t trust the system or the reports CSnet
              delivers. It&apos;s just raw data she can&apos;t make sense
              of.&rdquo;
            </p>
            <footer className="mt-3 text-sm text-muted-foreground not-italic">
              Notes · Two Good briefing · 29 May 2026
            </footer>
          </blockquote>
          <div className="rounded-xl border bg-card p-5 sm:p-6">
            <p className="text-lg font-medium sm:text-xl">House rule, baked in</p>
            <p className={cn("mt-3", SLIDE_BODY)}>
              AI-drafted narrative is always a draft. The lead reviews. Never
              auto-sent.
            </p>
            <Link
              href="/future/wellness"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-5 h-10 px-4 text-base"
              )}
            >
              Vision mode · /future/wellness
            </Link>
          </div>
        </div>
        <SlideMeta speaker="Joshua · 45s" budget="45 seconds" />
      </div>
    ),
  },
  {
    section: "innovation",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>
          Innovation & AI · PRD1 subgroup outcomes
        </p>
        <h2 className={SLIDE_H2}>
          From &ldquo;we suspect&rdquo; to &ldquo;here&apos;s the evidence&rdquo;
        </h2>
        <p className={cn("mt-4 max-w-3xl", SLIDE_BODY)}>
          Pick a metric. Pick an attribute. The view returns subgroup performance
          with sample-size labels and n&lt;5 suppression. Ethical by
          construction.
        </p>
        <p className={cn("mt-6", SLIDE_BODY)}>
          Cohort, site, age band, housing at intake, country of origin,
          language, faith. Consented at intake, never required. Never exposed in
          donor-facing or public reporting.
        </p>
        <div className="mt-8 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[28rem] text-left text-base sm:text-lg">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-5 py-3 font-medium">
                  PWI total · 6mo gain · by housing at intake
                </th>
                <th className="px-5 py-3 font-medium text-right">Gain</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                ["Stable housing n=14", "+4.2"],
                ["With family n=9", "+3.8"],
                ["Transitional n=7", "+3.0"],
                ["Insecure n=8", "+1.7"],
              ].map(([label, gain]) => (
                <tr key={label}>
                  <td className="px-5 py-3 text-muted-foreground">{label}</td>
                  <td className="px-5 py-3 text-right font-medium">{gain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={cn("mt-6", SLIDE_BODY)}>
          Participants with insecure housing at intake show a 2.5-point lower
          6-month PWI gain than the program average. The context overlay flags
          three rental affordability events in their cohort&apos;s window.
        </p>
        <SlideMeta speaker="Joshua · 45s" budget="45 seconds" />
      </div>
    ),
  },
  {
    section: "problem",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>
          Aligned to the problem · walk it live at /future/impact
        </p>
        <h2 className={SLIDE_H2}>Generic thanks → real connection</h2>
        <p className={cn("mt-4 max-w-3xl", SLIDE_BODY)}>
          Hundreds of supporters give. The meals reach women in crisis. The donor
          hears nothing meaningful again. The relationship cools, the next ask
          works harder.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border bg-muted/30 p-6 sm:p-7">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              Today
            </p>
            <p className={cn("mt-4 text-xl font-medium sm:text-2xl", SLIDE_BODY)}>
              &ldquo;Thanks for your generous donation.&rdquo;
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-6 sm:p-7">
            <p className="text-sm font-medium tracking-wide text-muted-foreground uppercase">
              PRD2
            </p>
            <p className={cn("mt-4 text-xl font-medium text-foreground sm:text-2xl")}>
              &ldquo;Your gift reached Shelter X on Tuesday. It funded 24 meals
              for women starting over.&rdquo;
            </p>
          </div>
        </div>
        <Link
          href="/future/impact"
          className={cn(buttonVariants({ variant: "outline" }), "mt-8 h-10 px-4 text-base")}
        >
          Vision mode · /future/impact
        </Link>
        <SlideMeta speaker="Anthony · 30s" budget="30 seconds" />
      </div>
    ),
  },
  {
    section: "innovation",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>Innovation & AI · PRD2 from signal to trace</p>
        <h2 className={SLIDE_H2}>Three sources, one ledger, one trace</h2>
        <ul className="mt-8 space-y-4">
          <NumberedItem
            number="01"
            title="Unified ledger, two pools"
            body="Meals and care packs never mix. Each has its own donor pool, ledger, carry-forward balance. Live at /donations/ledger and /donations-beta."
          />
          <NumberedItem
            number="02"
            title="Weekly allocation engine"
            body="Like-for-like demand by product subtype. Priority: exact quantity match → largest donor orders first → Too Good gap. Carry-forward balances roll over."
          />
          <NumberedItem
            number="03"
            title="Manual review queue"
            body="Below-threshold matches surface to ops. Sensitive shelters masked from anyone without the permission."
          />
          <NumberedItem
            number="04"
            title="Donor impact reports · shipped"
            body="Aggregated per email. Printable PDF report pages. Delivered via Resend with a link. Live at /donations-beta."
          />
        </ul>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              <p className="text-lg font-medium sm:text-xl">Privacy by design</p>
            </div>
            <p className={cn("mt-3", SLIDE_BODY)}>
              Order IDs across customer and shelter systems are never directly
              compared. Sensitive shelters masked in every partner-facing export.
              Each trace stores its method, confidence and the candidates
              considered.
            </p>
          </div>
          <div className="rounded-xl border p-5 sm:p-6">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              <p className="text-lg font-medium sm:text-xl">Coverage today</p>
            </div>
            <p className={cn("mt-3", SLIDE_BODY)}>
              Vitest over match scoring, sensitive-shelter privacy, donor
              normalisation, meal donation matching.
            </p>
          </div>
        </div>
        <SlideMeta speaker="Anthony · 45s" budget="45 seconds" />
      </div>
    ),
  },
  {
    section: "innovation",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>
          Innovation & AI · PRD2 donor reports & thank-yous
        </p>
        <h2 className={SLIDE_H2}>
          A draft, in their voice, for a human to send
        </h2>
        <p className={cn("mt-4 max-w-3xl", SLIDE_BODY)}>
          The AI assistant drafts the thank-you in Two Good&apos;s brand voice,
          grounded only on the matched trace. The team reviews, edits, sends. No
          auto-send.
        </p>
        <ul className="mt-6 space-y-3">
          {[
            "Brand voice profile injected: warm, human, purposeful, dignity-led",
            "Citation-only: every figure traceable to the underlying donation match",
            "Resend wired for delivery. Existing email template, brand-coloured",
            "Foundation for re-engagement, not a one-off transaction",
          ].map((point) => (
            <li key={point} className={cn("flex gap-3", SLIDE_BODY)}>
              <CheckCircle2 className="mt-1 size-5 shrink-0 text-primary" />
              {point}
            </li>
          ))}
        </ul>
        <div className="mt-8 rounded-2xl border bg-card p-6 sm:p-7">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-5" />
            <p className="text-sm font-medium uppercase tracking-wide">
              Draft preview
            </p>
          </div>
          <div className="mt-4 space-y-2 text-base sm:text-lg">
            <p>
              <span className="font-medium text-foreground">From</span> Two Good
              Co &lt;hello@twogood.com.au&gt;
            </p>
            <p>
              <span className="font-medium text-foreground">To</span>{" "}
              donor@example.com
            </p>
            <p>
              <span className="font-medium text-foreground">Subject</span> Where
              your meal reached, with gratitude.
            </p>
          </div>
          <div className="mt-5 rounded-xl border bg-muted/20 p-5">
            <p className={SLIDE_BODY}>Hi Sam,</p>
            <p className={cn("mt-3", SLIDE_BODY)}>
              When you bought two Buy One Give One meals on 12 April, you funded
              two meals that reached a partner shelter in Western Sydney on 18
              April.
            </p>
            <p className={cn("mt-3", SLIDE_BODY)}>
              Women starting over were warm, and fed, that night, in part because
              of you.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Drafted by the assistant, grounded in trace ID TRC-0412-WS.
              Reviewed by Imogen before send.
            </p>
          </div>
        </div>
        <SlideMeta speaker="Alejandra · 45s" budget="45 seconds" />
      </div>
    ),
  },
  {
    section: "quality",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>
          Quality of presentation · aligned to all three judging criteria
        </p>
        <h2 className={SLIDE_H2}>Built for the team of one</h2>
        <p className={cn("mt-2 text-base text-muted-foreground sm:text-lg")}>
          Judging lenses · adoption is the tiebreaker
        </p>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {[
            {
              title: "For the impact lens",
              question: "Will it have real impact?",
              points: [
                "80 hours/quarter → minutes",
                "Equity questions become askable",
                "Donors stop falling off the back of the truck",
              ],
            },
            {
              title: "For the technical lens",
              question: "Will it actually work?",
              points: [
                "Deployed, not mocked. Edge runtime.",
                "Test suite over ingestion, scoring, privacy, matching",
                "No keys client-side. Audit log on every action.",
              ],
            },
            {
              title: "For the adoption lens",
              question: "Will the NFP actually adopt it?",
              points: [
                "No data analyst on staff required",
                "No ML PhD, no migrations to babysit",
                "Cloudflare cost ≈ a few coffees per month at this scale",
              ],
            },
          ].map((lens) => (
            <div key={lens.title} className="rounded-2xl border bg-card p-6 sm:p-7">
              <p className="text-lg font-medium sm:text-xl">{lens.title}</p>
              <p className={cn("mt-2 italic", SLIDE_BODY)}>{lens.question}</p>
              <ul className="mt-5 space-y-3">
                {lens.points.map((point) => (
                  <li key={point} className={cn("flex gap-3", SLIDE_BODY)}>
                    <span className="mt-2.5 size-2 shrink-0 rounded-full bg-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <SlideMeta speaker="Joshua · 20s" budget="20 seconds" />
      </div>
    ),
  },
  {
    content: (
      <div className="flex flex-col items-center text-center">
        <p className={SLIDE_EYEBROW}>In closing</p>
        <h2 className={SLIDE_H2}>Close the loop.</h2>
        <p className={cn("mt-5 max-w-2xl text-pretty", SLIDE_BODY)}>
          For the women in the program, the donors who fund it, and the team of
          one who has to make sense of it all.
        </p>
        <p className={SLIDE_TAGLINE}>Buy Good · Do Good</p>
        <div className="mt-10 grid w-full max-w-3xl gap-4 text-left sm:grid-cols-2">
          {[
            {
              headline: "80 hours → minutes",
              body: "The quarterly report, generated and frozen.",
            },
            {
              headline: "\"We suspect\" → \"Here's the evidence\"",
              body: "Equity questions, with sample-size honesty.",
            },
            {
              headline: "Generic thanks → real connection",
              body: "Every donor, tied to the shelter they reached.",
            },
          ].map((item) => (
            <div
              key={item.headline}
              className="rounded-xl border bg-card p-5 sm:p-6 sm:last:col-span-2"
            >
              <p className="text-lg font-medium sm:text-xl">{item.headline}</p>
              <p className={cn("mt-2", SLIDE_BODY)}>{item.body}</p>
            </div>
          ))}
        </div>
        <p className={cn("mt-10 max-w-xl", SLIDE_BODY)}>
          Take the app with you. Scan to explore{" "}
          <span className="font-medium text-foreground">/presentation</span>,{" "}
          <span className="font-medium text-foreground">/future/wellness</span>,{" "}
          <span className="font-medium text-foreground">/future/impact</span> in
          the deployed app.
        </p>
        <LiveDemoQrCode />
        <p className="mt-6 text-sm text-muted-foreground sm:text-base">
          Two Good Co · G&apos;DAI Hack Day · 29 May 2026 · 360 seconds total
        </p>
        <SlideMeta speaker="Joshua · 10s" budget="10 seconds" />
      </div>
    ),
  },
];

function getSectionStartIndex(sectionId: SectionId) {
  return SLIDES.findIndex((slide) => slide.section === sectionId);
}

export function CloseTheLoopDeck() {
  const deckRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [animating, setAnimating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const total = SLIDES.length;
  const currentSection = SLIDES[index]?.section;
  const isFirst = index === 0;
  const isLast = index === total - 1;

  const toggleFullscreen = useCallback(async () => {
    const deck = deckRef.current;
    if (!deck) {
      return;
    }

    try {
      if (document.fullscreenElement === deck) {
        await document.exitFullscreen();
      } else {
        await deck.requestFullscreen();
      }
    } catch {
      // Fullscreen may be blocked by the browser or unsupported.
    }
  }, []);

  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(document.fullscreenElement === deckRef.current);
    }

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= total || nextIndex === index) {
        return;
      }

      setDirection(nextIndex > index ? "forward" : "back");
      setAnimating(true);
      window.setTimeout(() => {
        setIndex(nextIndex);
        setAnimating(false);
      }, 150);
    },
    [index, total]
  );

  const goNext = useCallback(() => goTo(index + 1), [goTo, index]);
  const goPrev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.target instanceof HTMLElement &&
        (event.target.isContentEditable ||
          event.target.tagName === "INPUT" ||
          event.target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      } else if (event.key === "f" || event.key === "F") {
        event.preventDefault();
        void toggleFullscreen();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, toggleFullscreen]);

  return (
    <div
      ref={deckRef}
      className={cn(
        "flex flex-col",
        isFullscreen && "h-dvh bg-background px-6 py-8 sm:px-10 sm:py-10"
      )}
    >
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-xl border bg-muted/40 p-1">
          {SECTIONS.map((section) => {
            const sectionStart = getSectionStartIndex(section.id);
            const isActive = currentSection === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => goTo(sectionStart)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2.5 text-left text-sm font-medium transition-colors sm:px-5 sm:text-base",
                  isActive
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <section.icon
                  className={cn(
                    "size-4 shrink-0",
                    isActive ? "opacity-70" : "opacity-40"
                  )}
                />
                <span className="hidden sm:inline">{section.label}</span>
                <span className="sm:hidden">{section.shortLabel}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
          >
            {isFullscreen ? (
              <Minimize className="size-5" />
            ) : (
              <Maximize className="size-5" />
            )}
            <span className="hidden sm:inline">
              {isFullscreen ? "Exit full screen" : "Full screen"}
            </span>
          </Button>
          <p className="text-sm text-muted-foreground tabular-nums sm:text-base">
            {index + 1} / {total}
          </p>
        </div>
      </div>

      <div
        className={cn(
          "relative min-h-[480px] overflow-x-hidden overflow-y-auto rounded-3xl border bg-card p-8 sm:min-h-[540px] sm:p-12 lg:p-14",
          isFullscreen && "min-h-0 flex-1"
        )}
      >
        <Image
          src="/two-good-logo.svg"
          alt="Two Good Co"
          width={80}
          height={80}
          className="absolute top-8 right-8 h-14 w-14 sm:top-12 sm:right-12 sm:h-16 sm:w-16 lg:top-14 lg:right-14 lg:h-20 lg:w-20"
          priority
        />
        <div
          className={cn(
            "transition-all duration-300 ease-out",
            animating
              ? direction === "forward"
                ? "-translate-x-4 opacity-0"
                : "translate-x-4 opacity-0"
              : "translate-x-0 opacity-100"
          )}
        >
          {SLIDES[index]?.content}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-4">
        <Button
          variant="outline"
          onClick={goPrev}
          disabled={isFirst}
          aria-label="Previous slide"
        >
          <ArrowLeft className="size-5" />
          Previous
        </Button>

        <div className="flex items-center gap-1.5">
          {SLIDES.map((_, slideIndex) => (
            <button
              key={slideIndex}
              type="button"
              aria-label={`Go to slide ${slideIndex + 1}`}
              onClick={() => goTo(slideIndex)}
              className={cn(
                "rounded-full transition-all",
                slideIndex === index
                  ? "size-2 bg-primary"
                  : "size-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              )}
            />
          ))}
        </div>

        <Button onClick={goNext} disabled={isLast} aria-label="Next slide">
          Next
          <ArrowRight className="size-5" />
        </Button>
      </div>

      <p className="mt-4 text-center text-sm text-muted-foreground sm:text-base">
        Use arrow keys or space to navigate · Press F for full screen
      </p>
    </div>
  );
}
