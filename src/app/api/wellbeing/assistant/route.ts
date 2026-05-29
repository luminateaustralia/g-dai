import { getDb } from "@/db/client";
import { runGptOss120bChat } from "@/lib/ai/chat";
import type { AiChatMessage, AiChatRequest } from "@/lib/ai/types";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import {
  buildAssistantSystemPrompt,
  buildDashboardAiContext,
} from "@/lib/impact-reporting/ai-context";
import { loadAllReports } from "@/lib/impact-reporting/report-service";

type AssistantRequest = {
  messages: AiChatMessage[];
};

function isAssistantRequest(value: unknown): value is AssistantRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AssistantRequest>;
  return Array.isArray(candidate.messages) && candidate.messages.length > 0;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (
    !roleHasPermission(user.role, "ai.run") ||
    !roleHasPermission(user.role, "impact.view")
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isAssistantRequest(body)) {
    return Response.json(
      { error: "Request must include a non-empty messages array." },
      { status: 400 }
    );
  }

  const db = await getDb();
  const reports = await loadAllReports(db);
  if (!reports.length) {
    return Response.json(
      { error: "No wellbeing reports have been generated yet." },
      { status: 404 }
    );
  }

  const context = buildDashboardAiContext(reports);
  const conversation = body.messages.filter((m) => m.role !== "system");

  const chatRequest: AiChatRequest = {
    messages: [
      { role: "system", content: buildAssistantSystemPrompt(context) },
      ...conversation,
    ],
    stream: true,
    temperature: 0.2,
  };

  try {
    const result = await runGptOss120bChat(chatRequest);

    if (result instanceof ReadableStream) {
      return new Response(result, {
        headers: {
          "Content-Type": "text/event-stream; charset=utf-8",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    return Response.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Workers AI request failed.";
    return Response.json({ error: message }, { status: 502 });
  }
}
