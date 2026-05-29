import { CloseTheLoopDeck } from "@/components/presentation/close-the-loop-deck";
import { PageLayout } from "@/components/page-layout";

export default function PresentationPage() {
  return (
    <PageLayout className="mx-auto max-w-5xl py-8 sm:py-12" showBreadcrumbs={false}>
      <CloseTheLoopDeck />
    </PageLayout>
  );
}
