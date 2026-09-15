"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  Compass,
  LoaderCircle,
  MessageCircle,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ClientApiError, fetchJson } from "@/lib/client-api";

interface MentorMessage {
  id: string;
  role: "learner" | "mentor";
  content: string;
  provider: string;
  createdAt: string;
}

const quickPrompts = [
  "What should I learn next?",
  "How should I prepare for my next certification?",
  "I only have 30 minutes today.",
  "I am stuck on a difficult concept.",
];

export function MentorClient() {
  const [messages, setMessages] = useState<MentorMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetchJson<{ messages: MentorMessage[] }>("/api/mentor");
      setMessages(response.messages);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "Mentor history could not be loaded.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    const optimistic: MentorMessage = {
      id: `pending-${Date.now()}`,
      role: "learner",
      content: trimmed,
      provider: "pending",
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...(current ?? []), optimistic]);
    setDraft("");
    try {
      const response = await fetchJson<{ response: string; provider: string }>(
        "/api/mentor",
        {
          method: "POST",
          body: JSON.stringify({ message: trimmed }),
        },
      );
      setMessages((current) => [
        ...(current ?? []),
        {
          id: `response-${Date.now()}`,
          role: "mentor",
          content: response.response,
          provider: response.provider,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (caught) {
      setMessages((current) =>
        (current ?? []).filter((item) => item.id !== optimistic.id),
      );
      setDraft(trimmed);
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "The Guide could not respond.",
      );
    } finally {
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage(draft);
  }

  return (
    <div className="rpg-page mx-auto max-w-5xl">
      <header className="rpg-hero">
        <div className="relative z-[1]">
        <p className="eyebrow">Personal AI mentor</p>
        <h1 className="rpg-title mt-2 text-3xl sm:text-5xl">
          The Guide
        </h1>
        <p className="muted mt-2 max-w-3xl">
          A local-first RPG mentor grounded in your active quests, weak skills, study
          time, and certification path. It never claims work was verified when it was not.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rpg-status-chip">
            <Sparkles size={12} aria-hidden="true" />
            Oracle online
          </span>
          <span className="rpg-status-chip">
            <ShieldCheck size={12} aria-hidden="true" />
            Local knowledge mode
          </span>
        </div>
        </div>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_280px]">
        <section className="card rpg-quest-card min-h-[540px]">
          <div className="flex items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3">
              <span className="rpg-brand-mark grid h-11 w-11 place-items-center">
                <Compass size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-bold">Campaign counsel</h2>
                <p className="muted text-xs">Context-aware · Progress-grounded</p>
              </div>
            </div>
            <span
              className="rounded-full px-2.5 py-1 text-xs font-bold"
              style={{ background: "var(--cp-accent-soft)", color: "var(--cp-accent)" }}
            >
              Local mode
            </span>
          </div>

          <div className="flex min-h-[380px] flex-col justify-end gap-3 py-5" aria-live="polite">
            {!messages ? (
              <div className="grid flex-1 place-items-center" aria-busy="true">
                <LoaderCircle className="animate-spin" size={28} aria-hidden="true" />
              </div>
            ) : messages.length === 0 ? (
              <div className="grid flex-1 place-items-center text-center">
                <div>
                  <MessageCircle className="mx-auto" size={34} aria-hidden="true" />
                  <h2 className="mt-4 text-xl font-bold">Ask for your next move</h2>
                  <p className="muted mx-auto mt-2 max-w-md text-sm">
                    The local mentor gives deterministic guidance without sending learning
                    data to a paid service.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[85%] rounded-control border p-3 text-sm leading-6 ${
                    message.role === "learner" ? "ml-auto" : "mr-auto"
                  }`}
                  style={{
                    background:
                      message.role === "learner"
                        ? "var(--cp-accent-soft)"
                        : "var(--cp-bg-elevated)",
                    borderColor:
                      message.role === "learner"
                        ? "var(--cp-accent)"
                        : "var(--cp-border)",
                  }}
                >
                  <p className="mb-1 text-xs font-bold">
                    {message.role === "learner" ? "You" : "The Guide"}
                  </p>
                  <p>{message.content}</p>
                </div>
              ))
            )}
          </div>

          {error ? (
            <p className="mb-3 text-sm font-semibold" style={{ color: "var(--cp-danger)" }} role="alert">
              {error}
            </p>
          ) : null}
          <form className="flex gap-2 border-t pt-4" onSubmit={submit}>
            <label className="sr-only" htmlFor="mentor-message">
              Message The Guide
            </label>
            <input
              id="mentor-message"
              className="input"
              value={draft}
              maxLength={2000}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="What should I learn next?"
              disabled={busy}
            />
            <button
              className="button-primary shrink-0"
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label="Send message"
            >
              {busy ? (
                <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
              ) : (
                <Send size={18} aria-hidden="true" />
              )}
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </section>

        <aside className="space-y-4">
          <div className="card">
            <div className="flex items-center gap-2">
              <Sparkles size={18} style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
              <h2 className="font-bold">Quick prompts</h2>
            </div>
            <div className="mt-3 space-y-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="w-full rounded-control border p-2.5 text-left text-sm transition"
                  style={{ background: "var(--cp-bg-elevated)" }}
                  onClick={() => void sendMessage(prompt)}
                  disabled={busy}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
              <h2 className="font-bold">Provider boundary</h2>
            </div>
            <p className="muted mt-3 text-sm leading-6">
              Local mode works offline. An OpenAI-compatible endpoint is optional and
              requires explicit environment configuration; missing or failed providers
              return visible errors rather than simulated success.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
