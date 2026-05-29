"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type StreamDelta = {
  choices?: Array<{
    delta?: { content?: string | null };
    message?: { content?: string | null };
  }>;
};

function extractDelta(payload: StreamDelta): string {
  const choice = payload.choices?.[0];
  return choice?.delta?.content ?? choice?.message?.content ?? "";
}

export function ReportAssistant({
  reportId,
  canRun,
  exampleQuestions,
}: {
  reportId: string;
  canRun: boolean;
  exampleQuestions: string[];
}) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight });
  }, [messages, pending]);

  async function send(question: string) {
    const trimmed = question.trim();
    if (!trimmed || pending || !canRun) return;

    setError(null);
    setInput("");

    const history = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(history);
    setPending(true);

    try {
      const response = await fetch(
        `/api/wellbeing/reports/${reportId}/assistant`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        }
      );

      if (!response.ok || !response.body) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "The assistant could not respond.");
        setPending(false);
        return;
      }

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine.startsWith("data:")) continue;
          const data = trimmedLine.slice(5).trim();
          if (!data || data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data) as StreamDelta;
            const delta = extractDelta(parsed);
            if (delta) {
              setMessages((prev) => {
                const next = [...prev];
                const last = next[next.length - 1];
                if (last?.role === "assistant") {
                  next[next.length - 1] = {
                    role: "assistant",
                    content: last.content + delta,
                  };
                }
                return next;
              });
            }
          } catch {
            // Ignore keep-alive or non-JSON lines.
          }
        }
      }
    } catch {
      setError("Could not reach the assistant.");
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="print:hidden" />
        }
      >
        <Sparkles /> Ask AI about this report
      </SheetTrigger>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Ask about this report</SheetTitle>
          <SheetDescription>
            Answers are grounded only in this report&rsquo;s figures.
          </SheetDescription>
        </SheetHeader>

        <div
          ref={threadRef}
          className="flex-1 space-y-3 overflow-y-auto rounded-lg border bg-muted/30 p-3"
        >
          {messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Try one of these to get started:
              </p>
              <div className="flex flex-col gap-2">
                {exampleQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={!canRun || pending}
                    onClick={() => void send(question)}
                    className="rounded-lg border bg-background px-3 py-2 text-left text-sm transition-colors hover:border-ring hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-background ring-1 ring-foreground/10"
                  )}
                >
                  {message.content ||
                    (pending && message.role === "assistant" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : null)}
                </div>
              </div>
            ))
          )}
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : null}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send(input);
              }
            }}
            rows={2}
            disabled={!canRun || pending}
            placeholder={
              canRun
                ? "Ask a question about this report…"
                : "Your role cannot run AI workloads."
            }
            className="min-h-10 flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
          />
          <Button
            type="submit"
            size="icon"
            disabled={!canRun || pending || !input.trim()}
          >
            {pending ? <Loader2 className="animate-spin" /> : <Send />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
