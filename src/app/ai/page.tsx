import { PageLayout } from "@/components/page-layout";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { GPT_OSS_120B_MODEL } from "@/lib/ai/model";
import { AiDebugChat } from "@/components/ai/debug-chat";

export const dynamic = "force-dynamic";

export default async function AiPage() {
  const user = await getCurrentUser();
  const canRunAi = roleHasPermission(user.role, "ai.run");

  return (
    <PageLayout>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          AI debug
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Send a single prompt to{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {GPT_OSS_120B_MODEL}
          </code>{" "}
          and inspect the response. For programmatic use, call{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            POST /api/ai/chat
          </code>
          .
        </p>
      </div>

      <div className="mt-8">
        <AiDebugChat disabled={!canRunAi} />
      </div>
    </PageLayout>
  );
}
