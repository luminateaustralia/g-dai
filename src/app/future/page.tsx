import Link from "next/link";
import { ArrowRight, Heart, Lightbulb, Route } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const FUTURE_AREAS = [
  {
    href: "/future/impact",
    title: "Impact",
    description:
      "A presentation-style vision for closing the loop from donor orders to shelter fulfillments, with ledgers, reports, and forecasting.",
    icon: Route,
    gradient: "from-orange-500/15 via-amber-500/10 to-teal-500/10",
    iconBg: "bg-orange-500/15 text-orange-600",
  },
  {
    href: "/future/wellness",
    title: "Wellbeing",
    description:
      "A presentation-style vision for richer data, cohort comparison, equity insights, and smarter reporting.",
    icon: Heart,
    gradient: "from-violet-500/15 via-fuchsia-500/10 to-rose-500/10",
    iconBg: "bg-violet-500/15 text-violet-600",
  },
];

export default function FuturePage() {
  return (
    <PageLayout>
      <div className="max-w-3xl">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-600">
            <Lightbulb className="size-5" />
          </div>
          <div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              Future
            </h1>
            <p className="mt-2 text-muted-foreground text-pretty">
              Ideas and directions for where the platform could go next. These
              views are for thinking aloud, not production features.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-5">
          {FUTURE_AREAS.map((area) => (
            <Link key={area.href} href={area.href} className="group">
              <Card
                className={`h-full bg-linear-to-br ${area.gradient} transition-shadow hover:shadow-md`}
              >
                <CardHeader>
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg ${area.iconBg}`}
                  >
                    <area.icon className="size-5" />
                  </div>
                  <CardTitle className="mt-3 flex items-center gap-2">
                    {area.title}
                    <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription>{area.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </PageLayout>
  );
}
