"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle, Sparkles } from "lucide-react";
import { ClientApiError, fetchJson } from "@/lib/client-api";

interface DomainOption {
  slug: string;
  name: string;
  description: string;
}

export function OnboardingForm({ domains }: { domains: DomainOption[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [studyMinutes, setStudyMinutes] = useState(45);
  const [confidence, setConfidence] = useState<Record<string, number>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(slug: string) {
    setSelected((current) => {
      if (current.includes(slug)) return current.filter((item) => item !== slug);
      if (current.length >= 5) return current;
      return [...current, slug];
    });
  }

  async function submit() {
    if (selected.length === 0) {
      setError("Choose at least one focus area.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await fetchJson("/api/onboarding", {
        method: "POST",
        body: JSON.stringify({
          studyMinutes,
          focusAreas: selected,
          confidence: Object.fromEntries(
            selected.map((slug) => [slug, confidence[slug] ?? 25]),
          ),
        }),
      });
      router.push("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "Unable to save your learning path.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 max-w-2xl">
        <p className="eyebrow">Character setup</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Choose the skills you want to level
        </h1>
        <p className="muted mt-3 leading-7">
          Select up to five priorities in order. Your quest engine combines focus,
          prerequisites, performance, confidence, and available time.
        </p>
      </div>

      <section aria-labelledby="focus-heading">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 id="focus-heading" className="text-xl font-bold">
              Focus areas
            </h2>
            <p className="muted text-sm">Selected {selected.length} of 5</p>
          </div>
          <div className="flex gap-1.5" aria-label={`${selected.length} focus areas selected`}>
            {Array.from({ length: 5 }).map((_, index) => (
              <span
                key={index}
                className="h-2 w-7 rounded-full"
                style={{
                  background:
                    index < selected.length
                      ? "var(--cp-accent)"
                      : "var(--cp-border)",
                }}
              />
            ))}
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {domains.map((domain) => {
            const selectedIndex = selected.indexOf(domain.slug);
            const isSelected = selectedIndex >= 0;
            return (
              <div
                key={domain.slug}
                className="rounded-card border p-4 transition"
                style={{
                  background: isSelected
                    ? "var(--cp-accent-soft)"
                    : "var(--cp-surface)",
                  borderColor: isSelected
                    ? "var(--cp-accent)"
                    : "var(--cp-border)",
                }}
              >
                <button
                  type="button"
                  className="flex w-full items-start gap-3 text-left"
                  onClick={() => toggle(domain.slug)}
                  aria-pressed={isSelected}
                >
                  <span
                    className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold"
                    style={{
                      background: isSelected
                        ? "var(--cp-accent)"
                        : "var(--cp-surface-soft)",
                      color: isSelected
                        ? "var(--cp-accent-fg)"
                        : "var(--cp-text-muted)",
                    }}
                  >
                    {isSelected ? selectedIndex + 1 : <Check size={14} aria-hidden="true" />}
                  </span>
                  <span>
                    <span className="block font-bold">{domain.name}</span>
                    <span className="muted mt-1 block text-sm leading-5">
                      {domain.description}
                    </span>
                  </span>
                </button>
                {isSelected ? (
                  <label className="mt-4 block border-t pt-3 text-xs font-semibold">
                    Starting confidence: {confidence[domain.slug] ?? 25}%
                    <input
                      className="mt-2 w-full"
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={confidence[domain.slug] ?? 25}
                      onChange={(event) =>
                        setConfidence((current) => ({
                          ...current,
                          [domain.slug]: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="card mt-6" aria-labelledby="time-heading">
        <h2 id="time-heading" className="text-xl font-bold">
          Daily expedition length
        </h2>
        <p className="muted mt-1 text-sm">
          Daily quests are designed to fit one focused session.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[30, 45, 60].map((minutes) => (
            <button
              key={minutes}
              type="button"
              className="rounded-control border px-3 py-3 font-bold"
              style={{
                background:
                  studyMinutes === minutes
                    ? "var(--cp-accent-soft)"
                    : "var(--cp-surface)",
                borderColor:
                  studyMinutes === minutes
                    ? "var(--cp-accent)"
                    : "var(--cp-border)",
                color:
                  studyMinutes === minutes
                    ? "var(--cp-accent)"
                    : "var(--cp-text)",
              }}
              onClick={() => setStudyMinutes(minutes)}
            >
              {minutes} min
            </button>
          ))}
        </div>
      </section>

      {error ? (
        <p className="mt-4 text-sm font-semibold" style={{ color: "var(--cp-danger)" }} role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-6 flex justify-end">
        <button
          className="button-primary min-w-48"
          type="button"
          onClick={submit}
          disabled={busy}
        >
          {busy ? (
            <LoaderCircle className="animate-spin" size={18} aria-hidden="true" />
          ) : (
            <Sparkles size={18} aria-hidden="true" />
          )}
          Generate my path
        </button>
      </div>
    </div>
  );
}
