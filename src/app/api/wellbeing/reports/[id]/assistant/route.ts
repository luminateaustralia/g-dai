import { getDb } from "@/db/client";
import { BRAND_VOICE_GUIDE } from "@/lib/ai/brand-profile";
import { runGptOss120bChat } from "@/lib/ai/chat";
import type { AiChatMessage, AiChatRequest } from "@/lib/ai/types";
import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { buildReportAiContext } from "@/lib/impact-reporting/ai-context";
import { getReport } from "@/lib/impact-reporting/report-service";

type AssistantRequest = {
  messages: AiChatMessage[];
};

function isAssistantRequest(value: unknown): value is AssistantRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AssistantRequest>;
  return Array.isArray(candidate.messages) && candidate.messages.length > 0;
}

function buildSystemPrompt(context: string): string {
  return [
    "You are a wellbeing reporting assistant for Two Good Co's programme team.",
    "Answer questions strictly using the report data provided below.",
    "If the data does not contain the answer, say so plainly rather than guessing.",
    "Never invent figures; only cite numbers that appear in the data.",
    "Interpret each metric using its scale and direction (e.g. higher is better).",
    "Be concise and clear for a non-analyst audience.",
    "Ground all wording, framing, and the reasoning behind any recommendations in the Two Good Co brand voice below — warm, human, purposeful, and dignity-led. Write in Australian English.",
    "",
    "## Brand voice",
    BRAND_VOICE_GUIDE,
    "",
    "## Report data",
    context,
  ].join("\n");
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (
    !roleHasPermission(user.role, "ai.run") ||
    !roleHasPermission(user.role, "impact.view")
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

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
  const loaded = await getReport(db, id);
  if (!loaded) {
    return Response.json({ error: "Report not found." }, { status: 404 });
  }

  const context = buildReportAiContext(loaded);
  const conversation = body.messages.filter((m) => m.role !== "system");

  const chatRequest: AiChatRequest = {
    messages: [
      { role: "system", content: buildSystemPrompt(context) },
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
