import { getCurrentUser } from "@/lib/auth/session";
import { roleHasPermission } from "@/lib/auth/roles";
import { runGptOss120bChat } from "@/lib/ai/chat";
import type { AiChatRequest } from "@/lib/ai/types";

function isAiChatRequest(value: unknown): value is AiChatRequest {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AiChatRequest>;
  return Array.isArray(candidate.messages) && candidate.messages.length > 0;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!roleHasPermission(user.role, "ai.run")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!isAiChatRequest(body)) {
    return Response.json(
      { error: "Request must include a non-empty messages array." },
      { status: 400 }
    );
  }

  try {
    const result = await runGptOss120bChat(body);

    if (body.stream && result instanceof ReadableStream) {
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
