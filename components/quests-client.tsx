"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  FlaskConical,
  LoaderCircle,
  Plus,
  ShieldAlert,
  Sparkles,
  Swords,
} from "lucide-react";
import type { QuestView } from "@/lib/services/learning";
import { ClientApiError, fetchJson } from "@/lib/client-api";
import { ProgressBar } from "@/components/progress-bar";

const stepIcons = {
  reading: BookOpen,
  lab: FlaskConical,
  quiz: Sparkles,
  challenge: Swords,
  boss_battle: Swords,
  raid: ShieldAlert,
  certification: CheckCircle2,
  streak: Sparkles,
};

export function QuestsClient() {
  const [quests, setQuests] = useState<QuestView[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [evidence, setEvidence] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetchJson<{ quests: QuestView[] }>("/api/quests");
      setQuests(response.quests);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "The quest log could not be loaded.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generate(cadence: "daily" | "weekly" | "monthly") {
    setBusyKey(`generate-${cadence}`);
    setError(null);
    setMessage(null);
    try {
      const response = await fetchJson<{ quest: QuestView }>("/api/quests", {
        method: "POST",
        body: JSON.stringify({ cadence }),
      });
      setMessage(`${response.quest.title} is ready.`);
      await load();
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "The quest could not be generated.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function completeStep(quest: QuestView, stepId: string) {
    const key = `${quest.id}:${stepId}`;
    setBusyKey(key);
    setError(null);
    setMessage(null);
    try {
      const selectedIndex = answers[key];
      const result = await fetchJson<{
        quest: QuestView;
        xpAwarded: number;
        alreadyCompleted: boolean;
      }>(`/api/quests/${quest.id}/steps/${stepId}`, {
        method: "POST",
        body: JSON.stringify({
          selectedIndex,
          evidenceUrl: evidence[key] || undefined,
          notes: notes[key] || undefined,
        }),
      });
      setQuests((current) =>
        current?.map((candidate) =>
          candidate.id === quest.id ? result.quest : candidate,
        ) ?? null,
      );
      setMessage(
        result.alreadyCompleted
          ? "That step was already complete; no duplicate XP was awarded."
          : `Step complete. +${result.xpAwarded} XP recorded.`,
      );
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "The quest step could not be completed.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  async function toggleCheckpoint(
    quest: QuestView,
    stepId: string,
    checkpointId: string,
    completed: boolean,
  ) {
    const key = `${quest.id}:${stepId}:checkpoint:${checkpointId}`;
    setBusyKey(key);
    setError(null);
    setMessage(null);
    try {
      const response = await fetchJson<{ quest: QuestView }>(
        `/api/quests/${quest.id}/steps/${stepId}/checkpoints/${checkpointId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ completed }),
        },
      );
      setQuests((current) =>
        current?.map((candidate) =>
          candidate.id === quest.id ? response.quest : candidate,
        ) ?? null,
      );
      setMessage(
        completed
          ? "Guided checkpoint recorded."
          : "Checkpoint and dependent progress reopened.",
      );
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "The guided checkpoint could not be updated.",
      );
    } finally {
      setBusyKey(null);
    }
  }

  return (
    <div className="rpg-page">
      <header className="rpg-hero flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative z-[1]">
          <p className="eyebrow">Adventurer&apos;s quest journal</p>
          <h1 className="rpg-title mt-2 text-3xl sm:text-5xl">
            Deliberate practice, not content wandering
          </h1>
          <p className="muted mt-2 max-w-3xl">
            Daily quests combine an official resource, hands-on work, and a knowledge
            check. Boss battles and raids produce larger, reviewable deliverables.
          </p>
        </div>
        <div className="relative z-[1] flex flex-wrap gap-2">
          {(
            [
              ["daily", "Daily quest"],
              ["weekly", "Boss battle"],
              ["monthly", "Monthly raid"],
            ] as const
          ).map(([cadence, label]) => (
            <button
              key={cadence}
              className={cadence === "daily" ? "button-primary" : "button-secondary"}
              type="button"
              onClick={() => generate(cadence)}
              disabled={Boolean(busyKey)}
            >
              {busyKey === `generate-${cadence}` ? (
                <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
              ) : (
                <Plus size={17} aria-hidden="true" />
              )}
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="mt-5 min-h-6" aria-live="polite">
        {message ? (
          <p className="text-sm font-semibold" style={{ color: "var(--cp-success)" }}>
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm font-semibold" style={{ color: "var(--cp-danger)" }} role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {!quests ? (
        <div className="mt-3 grid gap-4 lg:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-72 animate-pulse rounded-card border"
              style={{ background: "var(--cp-surface)" }}
            />
          ))}
        </div>
      ) : quests.length === 0 ? (
        <div className="card rpg-quest-card mt-3 border-dashed py-14 text-center">
          <BookOpen className="mx-auto" size={34} aria-hidden="true" />
          <h2 className="mt-4 text-xl font-bold">Your quest log is empty</h2>
          <p className="muted mt-2">
            Generate a daily quest to begin a 30–60 minute learning expedition.
          </p>
          <button
            className="button-primary mt-5"
            type="button"
            onClick={() => generate("daily")}
          >
            <Plus size={17} aria-hidden="true" /> Generate first quest
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-5">
          {quests.map((quest) => (
            <article key={quest.id} className="card rpg-quest-card">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rpg-status-chip">
                      {quest.cadence}
                    </span>
                    <span className="muted flex items-center gap-1">
                      <Clock3 size={13} aria-hidden="true" />
                      {quest.durationMinutes} min
                    </span>
                    <span className="muted capitalize">{quest.challengeMode}</span>
                    <span className="muted">Difficulty {quest.difficulty}/5</span>
                  </div>
                  <h2 className="mt-3 text-2xl font-bold">{quest.title}</h2>
                  <p className="muted mt-2 leading-6">{quest.summary}</p>
                </div>
                <div className="min-w-56">
                  <ProgressBar value={quest.progressPercent} label="Quest progress" />
                  <p
                    className="mt-2 text-right text-xs font-semibold capitalize"
                    style={{
                      color:
                        quest.status === "completed"
                          ? "var(--cp-success)"
                          : "var(--cp-text-muted)",
                    }}
                  >
                    {quest.status}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                {quest.steps.map((step, index) => {
                  const key = `${quest.id}:${step.id}`;
                  const Icon = stepIcons[step.type];
                  const requiresEvidence =
                    step.type === "lab" ||
                    step.type === "challenge" ||
                    step.type === "boss_battle" ||
                    step.type === "raid";
                  return (
                    <section
                      key={step.id}
                      className="rpg-step-card border p-4"
                      style={{
                        background: step.completed
                          ? "var(--cp-accent-soft)"
                          : "var(--cp-bg-elevated)",
                        borderColor: step.completed
                          ? "var(--cp-accent)"
                          : "var(--cp-border)",
                      }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className="grid h-9 w-9 place-items-center rounded-control"
                          style={{
                            background: "var(--cp-surface)",
                            color: step.completed
                              ? "var(--cp-success)"
                              : "var(--cp-accent)",
                          }}
                        >
                          {step.completed ? (
                            <CheckCircle2 size={19} aria-hidden="true" />
                          ) : (
                            <Icon size={19} aria-hidden="true" />
                          )}
                        </span>
                        <span className="muted text-xs font-bold">Step {index + 1}</span>
                      </div>
                      <h3 className="mt-3 font-bold">{step.title}</h3>
                      <p className="muted mt-2 text-sm leading-5">{step.instructions}</p>

                      {step.guide ? (
                        <div
                          className="mt-4 rounded-control border p-4"
                          style={{ background: "var(--cp-surface)" }}
                        >
                          <p className="eyebrow">Guided field manual</p>
                          <p className="muted mt-2 text-sm leading-5">
                            {step.guide.introduction}
                          </p>
                          <ol className="mt-4 space-y-3">
                            {step.guide.checkpoints.map((checkpoint, checkpointIndex) => {
                              const checkpointKey = `${quest.id}:${step.id}:checkpoint:${checkpoint.id}`;
                              const earlierIncomplete = step.guide?.checkpoints
                                .slice(0, checkpointIndex)
                                .some((candidate) => !candidate.completed);
                              return (
                                <li
                                  key={checkpoint.id}
                                  className="rounded-control border p-3"
                                  style={{
                                    background: checkpoint.completed
                                      ? "var(--cp-accent-soft)"
                                      : "var(--cp-bg-elevated)",
                                    borderColor: checkpoint.completed
                                      ? "var(--cp-success)"
                                      : "var(--cp-border)",
                                  }}
                                >
                                  <label className="flex cursor-pointer items-start gap-3">
                                    <input
                                      className="mt-1"
                                      type="checkbox"
                                      checked={checkpoint.completed ?? false}
                                      disabled={
                                        Boolean(busyKey) ||
                                        step.completed ||
                                        (Boolean(earlierIncomplete) &&
                                          !checkpoint.completed)
                                      }
                                      onChange={(event) =>
                                        void toggleCheckpoint(
                                          quest,
                                          step.id,
                                          checkpoint.id,
                                          event.target.checked,
                                        )
                                      }
                                    />
                                    <span>
                                      <span className="font-bold">
                                        {checkpointIndex + 1}. {checkpoint.title}
                                      </span>
                                      <span className="muted mt-1 block text-sm leading-5">
                                        {checkpoint.instructions}
                                      </span>
                                    </span>
                                  </label>
                                  <div className="ml-7 mt-3 border-l-2 pl-3 text-xs leading-5">
                                    <p>
                                      <strong>Success:</strong>{" "}
                                      {checkpoint.successCriteria}
                                    </p>
                                    {checkpoint.hint ? (
                                      <p className="muted mt-1">
                                        <strong>Guide hint:</strong> {checkpoint.hint}
                                      </p>
                                    ) : null}
                                  </div>
                                  {busyKey === checkpointKey ? (
                                    <p className="muted ml-7 mt-2 flex items-center gap-2 text-xs">
                                      <LoaderCircle
                                        className="animate-spin"
                                        size={14}
                                        aria-hidden="true"
                                      />
                                      Saving checkpoint…
                                    </p>
                                  ) : null}
                                </li>
                              );
                            })}
                          </ol>
                        </div>
                      ) : null}

                      {step.resourceUrl ? (
                        <a
                          className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold"
                          style={{ color: "var(--cp-link)" }}
                          href={step.resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {step.resourceLabel ?? "Open resource"}
                          <ExternalLink size={14} aria-hidden="true" />
                        </a>
                      ) : null}

                      {step.quiz && !step.completed ? (
                        <fieldset className="mt-4 space-y-2">
                          <legend className="text-sm font-semibold">{step.quiz.prompt}</legend>
                          {step.quiz.options.map((option, optionIndex) => (
                            <label
                              key={option}
                              className="flex cursor-pointer items-start gap-2 rounded-control border p-2 text-sm"
                              style={{ background: "var(--cp-surface)" }}
                            >
                              <input
                                type="radio"
                                name={key}
                                value={optionIndex}
                                checked={answers[key] === optionIndex}
                                onChange={() =>
                                  setAnswers((current) => ({
                                    ...current,
                                    [key]: optionIndex,
                                  }))
                                }
                              />
                              <span>{option}</span>
                            </label>
                          ))}
                        </fieldset>
                      ) : null}

                      {step.quiz && step.completed ? (
                        <div className="mt-4 text-sm">
                          <p
                            className="font-bold"
                            style={{
                              color:
                                step.score === 100
                                  ? "var(--cp-success)"
                                  : "var(--cp-warning)",
                            }}
                          >
                            {step.score === 100 ? "Correct" : "Review recommended"}
                          </p>
                          <p className="muted mt-1">{step.quiz.explanation}</p>
                        </div>
                      ) : null}

                      {requiresEvidence && !step.completed ? (
                        <div className="mt-4 space-y-2">
                          <label className="block text-xs font-semibold">
                            Evidence URL (optional)
                            <input
                              className="input mt-1"
                              type="url"
                              placeholder="https://github.com/..."
                              value={evidence[key] ?? ""}
                              onChange={(event) =>
                                setEvidence((current) => ({
                                  ...current,
                                  [key]: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="block text-xs font-semibold">
                            Reflection (optional)
                            <textarea
                              className="input mt-1 min-h-20"
                              maxLength={2000}
                              value={notes[key] ?? ""}
                              onChange={(event) =>
                                setNotes((current) => ({
                                  ...current,
                                  [key]: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <p className="muted text-xs">
                            Local MVP records learner attestation. Repository verification is
                            not yet enabled.
                          </p>
                        </div>
                      ) : null}

                      {!step.completed ? (
                        <button
                          className="button-primary mt-4 w-full"
                          type="button"
                          onClick={() => completeStep(quest, step.id)}
                          disabled={
                            Boolean(busyKey) ||
                            (step.type === "quiz" &&
                              answers[key] === undefined) ||
                            Boolean(
                              step.guide?.checkpoints.some(
                                (checkpoint) => !checkpoint.completed,
                              ),
                            )
                          }
                          aria-disabled={
                            step.guide?.checkpoints.some(
                              (checkpoint) => !checkpoint.completed,
                            ) || undefined
                          }
                        >
                          {busyKey === key ? (
                            <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
                          ) : (
                            <CheckCircle2 size={17} aria-hidden="true" />
                          )}
                          Mark complete
                        </button>
                      ) : null}
                    </section>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
