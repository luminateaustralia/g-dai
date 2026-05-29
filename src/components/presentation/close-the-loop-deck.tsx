"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  CheckCircle2,
  Heart,
  Maximize,
  Minimize,
  Presentation,
  Route,
  Shield,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { PERSONAL_WELLBEING_INDEX_LABEL } from "@/lib/impact-reporting/metrics/definitions";
import { cn } from "@/lib/utils";
import QRCode from "react-qr-code";

const LIVE_DEMO_URL = "https://g-dai.cloudepl.workers.dev/";

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
const SLIDE_BODY_INTRO = "mt-5 max-w-2xl text-xl text-muted-foreground text-pretty sm:text-2xl";
const SLIDE_TAGLINE =
  "mt-8 text-base font-medium tracking-wide text-muted-foreground uppercase sm:text-lg";

function LiveDemoQrCode() {
  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <div
        className="rounded-2xl border bg-white p-4 shadow-sm"
        aria-label={`QR code linking to ${LIVE_DEMO_URL}`}
      >
        <QRCode
          value={LIVE_DEMO_URL}
          size={148}
          bgColor="#ffffff"
          fgColor="#000000"
        />
      </div>
      <p className="text-base text-muted-foreground sm:text-lg">
        Scan to explore the live prototype
      </p>
    </div>
  );
}

const SLIDES: Slide[] = [
  {
    content: (
      <div className="flex flex-col items-center text-center">
        <Badge variant="secondary" className="mb-6 px-3 py-1 text-base">
          Two Good Co
        </Badge>
        <h1 className={SLIDE_H1}>Close the Loop</h1>
        <p className={SLIDE_BODY_INTRO}>
          Prove donation impact. Measure participant wellbeing. One platform,
          one source of truth.
        </p>
        <p className={SLIDE_TAGLINE}>Buy Good Do Good</p>
        <LiveDemoQrCode />
      </div>
    ),
  },
  {
    section: "problem",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>Aligned to the problem</p>
        <h2 className={SLIDE_H2}>
          Two questions the team must answer with confidence
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <div className="rounded-2xl border bg-card p-7 sm:p-8">
            <div className="mb-5 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Route className="size-6" />
            </div>
            <h3 className={SLIDE_H3}>Where did donations go?</h3>
            <p className={cn("mt-3", SLIDE_BODY)}>
              Donors and partners need proof that meals and care packs reached
              the shelters and communities they were intended for — without
              exposing sensitive locations.
            </p>
          </div>
          <div className="rounded-2xl border bg-card p-7 sm:p-8">
            <div className="mb-5 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Heart className="size-6" />
            </div>
            <h3 className={SLIDE_H3}>Is wellbeing improving?</h3>
            <p className={cn("mt-3", SLIDE_BODY)}>
              {PERSONAL_WELLBEING_INDEX_LABEL} tracker data must be validated,
              scored consistently, and reported in a way that holds up over
              time.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    section: "problem",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>Aligned to the problem</p>
        <h2 className={SLIDE_H2}>Built for how Two Good Co actually works</h2>
        <p className={cn("mt-4 max-w-3xl", SLIDE_BODY)}>
          Not a generic dashboard. Close the Loop maps directly to the
          organisation&apos;s real workflows and stakeholder needs.
        </p>
        <ul className="mt-8 space-y-4">
          {[
            {
              title: "Impact module",
              body: "Unified donation ledger, automatic donor-to-shelter matching, partner-safe export, and thank-you emails.",
            },
            {
              title: "Wellbeing module",
              body: "Import the PWI client tracker, validate quality, freeze quarterly reports, and export PDF, CSV, or XLSX.",
            },
            {
              title: "Shared foundation",
              body: "One import hub, role-based access, and audit trails — replacing manual spreadsheet reconciliation.",
            },
          ].map((item) => (
            <li
              key={item.title}
              className="flex gap-4 rounded-xl border bg-muted/30 p-5 sm:p-6"
            >
              <CheckCircle2 className="mt-1 size-6 shrink-0 text-primary" />
              <div>
                <p className="text-lg font-medium sm:text-xl">{item.title}</p>
                <p className={cn("mt-2", SLIDE_BODY)}>{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    ),
  },
  {
    section: "innovation",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>Innovation & AI</p>
        <h2 className={SLIDE_H2}>Import → validate → analyse → export</h2>
        <p className={cn("mt-4 max-w-3xl", SLIDE_BODY)}>
          A single pipeline that turns operational workbooks into traceable
          outcomes and reproducible reports.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          {["Import", "Validate", "Analyse", "Export"].map((step, index) => (
            <div key={step} className="flex items-center gap-3 sm:gap-4">
              <span className="rounded-full border bg-card px-5 py-2.5 text-base font-medium sm:text-lg">
                {step}
              </span>
              {index < 3 && (
                <ArrowRight className="size-5 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: Target,
              title: "Smart matching",
              body: "Infers donor-to-shelter links with confidence scores and human review.",
            },
            {
              icon: Shield,
              title: "Partner-safe",
              body: "Sensitive shelter locations always masked in exports.",
            },
            {
              icon: Sparkles,
              title: "Frozen reports",
              body: "Quarterly snapshots never change, even as new data arrives.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border p-5 sm:p-6">
              <item.icon className="size-5 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium sm:text-xl">{item.title}</p>
              <p className={cn("mt-2", SLIDE_BODY)}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    section: "innovation",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>Innovation & AI</p>
        <h2 className={SLIDE_H2}>AI that stays grounded</h2>
        <p className={cn("mt-4 max-w-3xl", SLIDE_BODY)}>
          Workers AI powers a wellbeing assistant that answers only from frozen
          report figures — warm in tone, careful with claims.
        </p>
        <div className="mt-10 rounded-2xl border bg-linear-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent p-7 sm:p-9">
          <div className="flex items-start gap-5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-600">
              <Bot className="size-6" />
            </div>
            <div>
              <p className="text-lg font-medium sm:text-xl">What makes it different</p>
              <ul className="mt-5 space-y-4">
                {[
                  "Grounded in your data — not the open web",
                  "Australian English with Two Good Co brand voice",
                  "Hypotheses, not causal claims — humans decide",
                  "Runs on Cloudflare Workers AI at the edge",
                ].map((point) => (
                  <li key={point} className={cn("flex gap-3", SLIDE_BODY)}>
                    <span className="mt-2.5 size-2 shrink-0 rounded-full bg-violet-500" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    section: "quality",
    content: (
      <div>
        <p className={SLIDE_EYEBROW}>Quality of presentation</p>
        <h2 className={SLIDE_H2}>Purposeful, dignified, ready to share</h2>
        <p className={cn("mt-4 max-w-3xl", SLIDE_BODY)}>
          Every surface reflects Two Good Co values — warm, honest, premium yet
          approachable.
        </p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {[
            {
              title: "Clear navigation",
              body: "Impact, wellbeing, import, and AI — structured for the roles that use them.",
            },
            {
              title: "Reproducible outputs",
              body: "Frozen reports and partner-safe exports you can stand behind in a boardroom.",
            },
            {
              title: "Accessible language",
              body: "Australian English throughout. Dignified framing of outcomes and people.",
            },
            {
              title: "Audit-ready",
              body: "Role-based permissions and append-only audit log for sensitive actions.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border bg-card p-6 transition-shadow hover:shadow-sm sm:p-7"
            >
              <p className="text-lg font-medium sm:text-xl">{item.title}</p>
              <p className={cn("mt-3", SLIDE_BODY)}>{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    section: "quality",
    content: (
      <div className="flex flex-col items-center text-center">
        <p className={SLIDE_EYEBROW}>Quality of presentation</p>
        <h2 className={SLIDE_H2}>Explore the platform</h2>
        <p className={cn("mt-4 max-w-xl", SLIDE_BODY)}>
          Walk through the live prototype — sample data is de-identified and
          not representative of actual service information.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/donations"
            className={cn(buttonVariants(), "h-11 gap-2 px-5 text-base")}
          >
            <Route className="size-5" />
            Impact dashboard
          </Link>
          <Link
            href="/wellbeing"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 gap-2 px-5 text-base"
            )}
          >
            <Heart className="size-5" />
            Wellbeing reports
          </Link>
          <Link
            href="/ai"
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-11 gap-2 px-5 text-base"
            )}
          >
            <Bot className="size-5" />
            AI assistant
          </Link>
        </div>
      </div>
    ),
  },
  {
    content: (
      <div className="flex flex-col items-center text-center">
        <h2 className={SLIDE_H2}>Close the loop on impact</h2>
        <p className={cn("mt-5 max-w-xl text-pretty", SLIDE_BODY)}>
          From spreadsheet to traceable outcomes, reproducible reports, and
          partner-safe communications — built for Two Good Co.
        </p>
        <p className={cn("mt-10", SLIDE_BODY)}>
          With every purchase, you help change the course of someone&apos;s
          life.
        </p>
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
