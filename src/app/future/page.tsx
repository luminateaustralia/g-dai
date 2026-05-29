import { PageLayout } from "@/components/page-layout";

export default function FuturePage() {
  return (
    <PageLayout>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Future
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          A placeholder for ideas and planned features. More to come.
        </p>
      </div>
    </PageLayout>
  );
}
