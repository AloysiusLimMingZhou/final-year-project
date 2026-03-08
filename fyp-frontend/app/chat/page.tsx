"use client";

import React from "react";
import { Card, Button, cx } from "../components/ui-kit";
import { SendHorizonal, Sparkles, Bot, User, Link as LinkIcon } from "lucide-react";

type Msg = { role: "user" | "bot"; text: string; citation?: string[] };

const SUGGESTIONS = [
  "How can I reduce cholesterol safely?",
];

// Map UI messages -> FastAPI schema
function toApiHistory(msgs: Msg[]) {
  // FastAPI expects: history: [{ role, content }]
  return msgs.map((m) => ({
    role: m.role === "bot" ? "assistant" : "user",
    content: m.text,
  }));
}

export default function ChatPage() {
  const [msgs, setMsgs] = React.useState<Msg[]>([
    { role: "bot", text: "Hi! I’m your HealthConnect assistant. Ask me about your results or next steps ✨" },
  ]);
  const [draft, setDraft] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [status, setStatus] = React.useState<"Ready" | "Online" | "Offline">("Ready");

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/api/chat/history");
        if (res.ok) {
          const rawMsgs = await res.json();
          if (Array.isArray(rawMsgs) && rawMsgs.length > 0) {
            const histMsgs = rawMsgs.map((m: any) => ({
              role: m.role === "assistant" ? "bot" : m.role,
              text: m.content,
              citation: m.citations || [],
            })) as Msg[];
            setMsgs(histMsgs);
          }
        }
      } catch (err) {
        console.error("Failed to load chat history:", err);
      }
    }
    loadHistory();
  }, []);

  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [msgs, loading]);

  async function send(text?: string) {
    const content = (text ?? draft).trim();
    if (!content || loading) return;

    setDraft("");
    setLoading(true);

    const nextMsgs = [...msgs, { role: "user" as const, text: content }];
    setMsgs(nextMsgs);

    try {
      const payload = {
        question: content,
      };

      const res = await fetch("/api/chat/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errText = await res.text();
        try {
          const parsed = JSON.parse(errText);
          errText = parsed.message || parsed.error || errText;
        } catch {
          // ignore parsing error
        }
        throw new Error(errText);
      }

      const data = (await res.json()) as { answer?: string; citation?: string[]; reply?: string; message?: string };

      const reply = (data.answer ?? data.reply ?? data.message ?? "").toString().trim() || "(No response)";
      const citation = Array.isArray(data.citation) ? data.citation : [];

      setMsgs((m) => [...m, { role: "bot", text: reply, citation }]);
      setStatus("Online");
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      setMsgs((m) => [
        ...m,
        {
          role: "bot",
          text:
            "Sorry — I couldn’t reach the assistant service.\n\n" +
            msg.replace(/\s+/g, " ").slice(0, 500),
        },
      ]);
      setStatus("Offline");
    } finally {
      setLoading(false);
    }
  }

  const statusLabel = status === "Online" ? "Connected" : status === "Offline" ? "Offline" : "Ready";
  const statusTone = status === "Online" ? "var(--accent)" : status === "Offline" ? "#ef4444" : "var(--muted)";

  return (
    <div className="space-y-4 overflow-hidden">
      <Card
        title="Assistant"
        headerRight={
          <span
            className="inline-flex items-center gap-2 text-xs px-2 py-1 rounded-full border"
            style={{ borderColor: "var(--borderSoft)", color: statusTone }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            {statusLabel}
          </span>
        }
      >
        {/* Suggestions */}
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => send(s)}
              className="rounded-full px-3 py-1.5 text-xs font-semibold border transition hover:opacity-90"
              style={{ borderColor: "var(--borderSoft)", color: "var(--text)" }}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Chat window */}
        <div
          ref={scrollerRef}
          className="mt-4 overflow-auto rounded-2xl border p-3 space-y-2"
          style={{
            borderColor: "var(--borderSoft)",
            background: "rgba(100,116,139,0.04)",
            height: "60vh",
          }}
        >
          {msgs.map((m, i) => (
            <div key={i} className={cx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className="flex items-end gap-2 max-w-[88%]">
                {m.role === "bot" ? (
                  <div
                    className="h-8 w-8 rounded-xl border grid place-items-center"
                    style={{ borderColor: "var(--borderSoft)", background: "var(--surface)" }}
                  >
                    <Bot className="h-4 w-4" style={{ color: "var(--accent)" }} />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <div
                    className="rounded-2xl px-3 py-2 text-sm border whitespace-pre-wrap"
                    style={{
                      borderColor: "var(--borderSoft)",
                      background: m.role === "user" ? "var(--accent)" : "var(--surface)",
                      color: m.role === "user" ? "#fff" : "var(--text)",
                    }}
                  >
                    {m.text}
                  </div>

                  {m.role === "bot" && m.citation && m.citation.length > 0 ? (
                    <details
                      className="rounded-2xl border px-3 py-2 text-xs"
                      style={{ borderColor: "var(--borderSoft)", background: "rgba(100,116,139,0.04)" }}
                    >
                      <summary className="cursor-pointer select-none inline-flex items-center gap-2">
                        <LinkIcon className="h-3.5 w-3.5" style={{ color: "var(--muted)" }} />
                        Sources ({m.citation.length})
                      </summary>

                      <ul className="mt-2 space-y-1 list-disc pl-4" style={{ color: "var(--muted)" }}>
                        {m.citation.map((c, idx) => (
                          <li key={idx} className="break-words">
                            {c}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>

                {m.role === "user" ? (
                  <div
                    className="h-8 w-8 rounded-xl border grid place-items-center"
                    style={{ borderColor: "var(--borderSoft)", background: "var(--surface)" }}
                  >
                    <User className="h-4 w-4" style={{ color: "var(--muted)" }} />
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {loading ? (
            <div className="flex justify-start">
              <div
                className="rounded-2xl px-3 py-2 text-sm border"
                style={{ borderColor: "var(--borderSoft)", background: "var(--surface)", color: "var(--muted)" }}
              >
                Typing…
              </div>
            </div>
          ) : null}
        </div>

        {/* Input */}
        <div className="mt-3 flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Ask about your risk, lifestyle, or results…"
            className="w-full rounded-xl border bg-transparent px-3 py-2"
            style={{ borderColor: "var(--borderSoft)", color: "var(--text)" }}
          />
          <Button onClick={() => send()} iconRight={<SendHorizonal className="h-4 w-4" />}>
            Send
          </Button>
        </div>
      </Card>
    </div>
  );
}
