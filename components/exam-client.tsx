"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { ExamAttemptView } from "@/lib/services/exams";
import { ClientApiError, fetchJson } from "@/lib/client-api";
import { ProgressBar } from "@/components/progress-bar";

export function ExamClient({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<ExamAttemptView | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [now, setNow] = useState(() => Date.now());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetchJson<{ attempt: ExamAttemptView }>(
        `/api/exams/${attemptId}`,
      );
      setAttempt(response.attempt);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "The practice exam could not be loaded.",
      );
    }
  }, [attemptId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!attempt || attempt.status !== "active") return;
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, [attempt]);

  const secondsRemaining = useMemo(() => {
    if (!attempt) return 0;
    const end =
      new Date(attempt.startedAt).getTime() + attempt.durationMinutes * 60_000;
    return Math.max(0, Math.floor((end - now) / 1000));
  }, [attempt, now]);

  async function submit() {
    if (!attempt) return;
    if (Object.keys(answers).length !== attempt.questions.length) {
      setError("Answer every question before submitting.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await fetchJson<{ attempt: ExamAttemptView }>(
        `/api/exams/${attempt.id}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ answers }),
        },
      );
      setAttempt(response.attempt);
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "The practice exam could not be submitted.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!attempt && !error) {
    return (
      <div className="card rpg-quest-card mx-auto mt-16 max-w-xl text-center" aria-busy="true">
        <LoaderCircle className="mx-auto animate-spin" size={34} aria-hidden="true" />
        <p className="muted mt-3">Preparing your exam chamber…</p>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="card rpg-quest-card mx-auto mt-16 max-w-xl text-center">
        <AlertTriangle className="mx-auto" size={32} aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Exam unavailable</h1>
        <p className="muted mt-2">{error}</p>
        <Link className="button-primary mt-5" href="/certifications">
          Return to roadmap
        </Link>
      </div>
    );
  }

  if (attempt.status === "submitted" && attempt.result) {
    return (
      <div className="rpg-page mx-auto max-w-4xl">
        <div className="card rpg-level-card text-center">
          {attempt.result.passed ? (
            <CheckCircle2 className="mx-auto" size={44} style={{ color: "var(--cp-success)" }} aria-hidden="true" />
          ) : (
            <RotateCcw className="mx-auto" size={44} style={{ color: "var(--cp-warning)" }} aria-hidden="true" />
          )}
          <p className="eyebrow mt-4">{attempt.certificationCode} practice result</p>
          <h1 className="rpg-level-number mt-4">{attempt.result.score}%</h1>
          <p className="muted mt-3">
            {attempt.result.correct} of {attempt.result.total} correct ·{" "}
            {attempt.result.passed
              ? "Practice threshold reached"
              : "Remediation recommended before the next attempt"}
          </p>
          <div className="mx-auto mt-6 max-w-lg">
            <ProgressBar value={attempt.result.score} label="Practice score" />
          </div>
        </div>

        <section className="card rpg-quest-card mt-4">
          <h2 className="text-xl font-bold">Knowledge gaps and remediation</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {attempt.result.topicScores.map((topic) => (
              <div
                key={topic.domain}
                className="rpg-step-card border p-4"
                style={{ background: "var(--cp-bg-elevated)" }}
              >
                <h3 className="font-bold capitalize">{topic.domain.replaceAll("-", " ")}</h3>
                <p className="muted mt-1 text-sm">
                  {topic.correct}/{topic.total} correct
                </p>
                <div className="mt-3">
                  <ProgressBar value={topic.percent} label="Topic score" compact />
                </div>
                {topic.percent < 70 ? (
                  <p className="mt-3 text-sm" style={{ color: "var(--cp-warning)" }}>
                    Revisit the matching daily quest, explain the concept aloud, then
                    retry with a scenario question.
                  </p>
                ) : (
                  <p className="mt-3 text-sm" style={{ color: "var(--cp-success)" }}>
                    Demonstrated strength. Maintain it through spaced practice.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="card rpg-quest-card mt-4">
          <h2 className="text-xl font-bold">Answer review</h2>
          <div className="mt-4 space-y-3">
            {attempt.questions.map((question, index) => {
              const review = attempt.review?.find(
                (item) => item.questionId === question.id,
              );
              return (
                <div
                  key={question.id}
                  className="rpg-step-card border p-4"
                  style={{ background: "var(--cp-bg-elevated)" }}
                >
                  <div className="flex items-start gap-3">
                    {review?.correct ? (
                      <CheckCircle2
                        className="shrink-0"
                        size={20}
                        style={{ color: "var(--cp-success)" }}
                        aria-hidden="true"
                      />
                    ) : (
                      <XCircle
                        className="shrink-0"
                        size={20}
                        style={{ color: "var(--cp-danger)" }}
                        aria-hidden="true"
                      />
                    )}
                    <div>
                      <h3 className="font-bold">
                        {index + 1}. {question.prompt}
                      </h3>
                      <p className="muted mt-2 text-sm">
                        Correct answer:{" "}
                        {review ? question.options[review.correctIndex] : "Unavailable"}
                      </p>
                      <p className="mt-2 text-sm">{review?.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link className="button-primary" href="/certifications">
              Choose next practice exam
            </Link>
            <Link className="button-secondary" href="/quests">
              Open remediation quests
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="rpg-page mx-auto max-w-4xl">
      <header className="card rpg-quest-card sticky top-3 z-10 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
          <div>
            <p className="text-lg font-bold">{attempt.certificationCode}</p>
            <p className="muted text-xs">
              Difficulty {attempt.difficulty} · {attempt.questions.length} questions
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 rounded-control px-3 py-2 font-mono text-sm font-bold"
          style={{
            background: "var(--cp-surface-soft)",
            color: secondsRemaining < 300 ? "var(--cp-danger)" : "var(--cp-text)",
          }}
          aria-live="polite"
        >
          <Clock3 size={16} aria-hidden="true" />
          {String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:
          {String(secondsRemaining % 60).padStart(2, "0")}
        </div>
      </header>

      {error ? (
        <p className="mt-4 text-sm font-semibold" style={{ color: "var(--cp-danger)" }} role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-4">
        {attempt.questions.map((question, index) => (
          <section key={question.id} className="card rpg-quest-card">
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow">
                Question {index + 1} · {question.type.replace("_", " ")}
              </span>
              <span className="muted text-xs">Difficulty {question.difficulty}</span>
            </div>
            {question.caseContext ? (
              <div
                className="mt-4 rounded-control border-l-4 p-4 text-sm leading-6"
                style={{
                  borderColor: "var(--cp-accent)",
                  background: "var(--cp-surface-soft)",
                }}
              >
                {question.caseContext}
              </div>
            ) : null}
            <h2 className="mt-4 text-lg font-bold">{question.prompt}</h2>
            <fieldset className="mt-4 grid gap-2">
              <legend className="sr-only">Answer question {index + 1}</legend>
              {question.options.map((option, optionIndex) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-start gap-3 rounded-control border p-3 text-sm"
                  style={{
                    background:
                      answers[question.id] === optionIndex
                        ? "var(--cp-accent-soft)"
                        : "var(--cp-bg-elevated)",
                    borderColor:
                      answers[question.id] === optionIndex
                        ? "var(--cp-accent)"
                        : "var(--cp-border)",
                  }}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === optionIndex}
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: optionIndex,
                      }))
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
          </section>
        ))}
      </div>

      <div className="card mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="muted text-sm">
          Answered {Object.keys(answers).length} of {attempt.questions.length}
        </p>
        <button
          className="button-primary"
          type="button"
          onClick={submit}
          disabled={
            busy ||
            secondsRemaining === 0 ||
            Object.keys(answers).length !== attempt.questions.length
          }
        >
          {busy ? (
            <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={17} aria-hidden="true" />
          )}
          Submit exam
        </button>
      </div>
    </div>
  );
}
