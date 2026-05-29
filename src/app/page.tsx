import Link from "next/link";
import { ArrowRight, Heart, Route } from "lucide-react";

import { PageLayout } from "@/components/page-layout";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PERSONAL_WELLBEING_INDEX_CLIENT_TRACKER_LABEL } from "@/lib/impact-reporting/metrics/definitions";

export default function Home() {
  return (
    <PageLayout className="py-12">
      <div className="text-center">
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance">
          Close the Loop
        </h1>
        <p className="mt-4 text-lg text-muted-foreground text-pretty">
          Trace donation impact through to the shelters that received them, and
          review Personal Wellbeing Index outcomes for program participants.
        </p>
      </div>

      <div className="mt-12 grid gap-5 sm:grid-cols-2">
        <Link href="/donations" className="group">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Route className="size-5" />
              </div>
              <CardTitle className="mt-3 flex items-center gap-2">
                Impact
                <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
              <CardDescription>
                Build a unified donation ledger and trace donor orders through
                to the shelters that received donated meals and care packs.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/wellbeing" className="group">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Heart className="size-5" />
              </div>
              <CardTitle className="mt-3 flex items-center gap-2">
                Wellbeing
                <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
              </CardTitle>
              <CardDescription>
                Review {PERSONAL_WELLBEING_INDEX_CLIENT_TRACKER_LABEL} data,
                validate quality, and generate reproducible wellbeing reports
                with domain movement and cohort breakdowns.
              </CardDescription>
            </CardHeader>
          </Card>
        </Link>
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">
        Prototype build. All sample data is de-identified and not representative
        of actual service or customer information.
      </p>
    </PageLayout>
  );
}
