"use client";

import { useState } from "react";
import { Loader2, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import type { AiChatRequest } from "@/lib/ai/types";

type ChatCompletionResponse = {
  id?: string;
  model?: string;
  choices?: Array<{
    message?: {
      role?: string;
      content?: string | null;
    };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: string;
};

function extractAssistantText(response: ChatCompletionResponse): string {
  const content = response.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content;
  return "No assistant text returned.";
}

export function AiDebugChat({ disabled }: { disabled: boolean }) {
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a concise assistant."
  );
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ChatCompletionResponse | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || pending || !prompt.trim()) return;

    setPending(true);
    setError(null);
    setResponse(null);

    const messages: AiChatRequest["messages"] = [];
    if (systemPrompt.trim()) {
      messages.push({ role: "system", content: systemPrompt.trim() });
    }
    messages.push({ role: "user", content: prompt.trim() });

    try {
      const result = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages } satisfies AiChatRequest),
      });

      const data = (await result.json()) as ChatCompletionResponse;

      if (!result.ok) {
        setError(data.error ?? "Request failed.");
        return;
      }

      setResponse(data);
    } catch {
      setError("Could not reach the AI endpoint.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Prompt</CardTitle>
          <CardDescription>
            Send a single request to GPT-OSS 120B via Workers AI.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="system-prompt">System prompt</Label>
              <textarea
                id="system-prompt"
                value={systemPrompt}
                onChange={(event) => setSystemPrompt(event.target.value)}
                rows={3}
                disabled={disabled || pending}
                className="rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="user-prompt">User prompt</Label>
              <textarea
                id="user-prompt"
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                rows={8}
                required
                disabled={disabled || pending}
                placeholder="Enter a prompt to send to the model…"
                className="min-h-48 rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>

            <div className="flex items-center gap-3">
              <Button type="submit" disabled={disabled || pending || !prompt.trim()}>
                {pending ? <Loader2 className="animate-spin" /> : <Send />}
                {pending ? "Sending…" : "Send request"}
              </Button>
              {disabled ? (
                <span className="text-sm text-muted-foreground">
                  Your role cannot run AI workloads.
                </span>
              ) : null}
              {error ? (
                <span className="text-sm text-destructive">{error}</span>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Output</CardTitle>
          <CardDescription>
            Assistant reply and raw response payload for debugging.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {response ? (
            <>
              <div className="grid gap-2">
                <Label>Assistant</Label>
                <pre className="max-h-64 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-sm whitespace-pre-wrap">
                  {extractAssistantText(response)}
                </pre>
              </div>

              {response.usage ? (
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>Prompt tokens: {response.usage.prompt_tokens ?? "—"}</span>
                  <span>
                    Completion tokens: {response.usage.completion_tokens ?? "—"}
                  </span>
                  <span>Total tokens: {response.usage.total_tokens ?? "—"}</span>
                  {response.choices?.[0]?.finish_reason ? (
                    <span>
                      Finish reason: {response.choices[0].finish_reason}
                    </span>
                  ) : null}
                </div>
              ) : null}

              <div className="grid gap-2">
                <Label>Raw JSON</Label>
                <pre className="max-h-96 overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs whitespace-pre-wrap">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Submit a prompt to see the model response here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
