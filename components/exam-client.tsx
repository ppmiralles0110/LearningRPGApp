"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeAnnouncement, setTimeAnnouncement] = useState("");
  const expiryHandled = useRef(false);
  const announcedThresholds = useRef(new Set<number>());

  const load = useCallback(async () => {
    try {
      const response = await fetchJson<{ attempt: ExamAttemptView }>(
        `/api/exams/${attemptId}`,
      );
      if (response.attempt.status === "active") {
        try {
          const stored = JSON.parse(
            window.sessionStorage.getItem(`exam-answers:${attemptId}`) ?? "{}",
          ) as Record<string, unknown>;
          const questionById = new Map(
            response.attempt.questions.map((question) => [
              question.id,
              question,
            ]),
          );
          setAnswers(
            Object.fromEntries(
              Object.entries(stored).filter(([questionId, answer]) => {
                const question = questionById.get(questionId);
                return (
                  question &&
                  Number.isInteger(answer) &&
                  Number(answer) >= 0 &&
                  Number(answer) < question.options.length
                );
              }),
            ) as Record<string, number>,
          );
        } catch {
          window.sessionStorage.removeItem(`exam-answers:${attemptId}`);
          setAnswers({});
        }
      }
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

  useEffect(() => {
    if (!attempt) return;
    const key = `exam-answers:${attempt.id}`;
    if (attempt.status === "active") {
      window.sessionStorage.setItem(key, JSON.stringify(answers));
    } else {
      window.sessionStorage.removeItem(key);
    }
  }, [answers, attempt]);

  const secondsRemaining = useMemo(() => {
    if (!attempt) return 0;
    const end =
      new Date(attempt.startedAt).getTime() + attempt.durationMinutes * 60_000;
    return Math.max(0, Math.floor((end - now) / 1000));
  }, [attempt, now]);
  const answeredCount = Object.keys(answers).length;
  const currentQuestion = attempt?.questions[currentQuestionIndex];

  useEffect(() => {
    if (!attempt || attempt.status !== "active") return;
    const milestones = [
      [30 * 60, "30 minutes remaining."],
      [10 * 60, "10 minutes remaining."],
      [5 * 60, "5 minutes remaining."],
      [60, "1 minute remaining."],
    ] as const;
    const milestone = [...milestones]
      .reverse()
      .find(
        ([threshold]) =>
          secondsRemaining <= threshold &&
          !announcedThresholds.current.has(threshold),
      );
    if (milestone) {
      announcedThresholds.current.add(milestone[0]);
      setTimeAnnouncement(milestone[1]);
    }
  }, [attempt, secondsRemaining]);

  useEffect(() => {
    if (!attempt || attempt.status !== "active" || expiryHandled.current) return;
    const expiresAt =
      new Date(attempt.startedAt).getTime() + attempt.durationMinutes * 60_000;
    if (now < expiresAt) return;
    expiryHandled.current = true;
    setTimeAnnouncement("Time has expired.");
    void (async () => {
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
        if (
          caught instanceof ClientApiError &&
          caught.code === "EXAM_EXPIRED"
        ) {
          await load();
          return;
        }
        setError(
          caught instanceof ClientApiError
            ? caught.message
            : "The expired assessment could not be closed.",
        );
      }
    })();
  }, [answers, attempt, load, now]);

  async function submit() {
    if (!attempt) return;
    if (Object.keys(answers).length !== attempt.questions.length) {
      setError("Answer every question before submitting.");
      return;
    }
    if (
      !window.confirm(
        "Submit this assessment now? You will not be able to change your answers.",
      )
    ) {
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
      if (
        caught instanceof ClientApiError &&
        caught.code === "EXAM_EXPIRED"
      ) {
        await load();
        return;
      }
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
                <details
                  key={question.id}
                  className="rpg-step-card border p-4"
                  style={{ background: "var(--cp-bg-elevated)" }}
                >
                  <summary className="flex cursor-pointer items-start gap-3">
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
                    </div>
                  </summary>
                  <div className="ml-8 mt-3 border-t pt-3">
                    <p className="muted text-sm">
                      Your answer:{" "}
                      {review && review.selectedIndex >= 0
                        ? question.options[review.selectedIndex]
                        : "No answer"}
                    </p>
                    <p className="muted mt-1 text-sm">
                      Correct answer:{" "}
                      {review ? question.options[review.correctIndex] : "Unavailable"}
                    </p>
                    <p className="mt-2 text-sm">{review?.explanation}</p>
                  </div>
                </details>
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

  if (attempt.status === "expired") {
    return (
      <div className="card rpg-quest-card mx-auto mt-16 max-w-xl text-center">
        <Clock3 className="mx-auto" size={36} aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Assessment time expired</h1>
        <p className="muted mt-2">
          This attempt is closed and was not scored. Start a new assessment when
          you have an uninterrupted 90-minute window.
        </p>
        <Link className="button-primary mt-5" href="/certifications">
          Return to trial grounds
        </Link>
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
          role="timer"
          aria-label={`${Math.floor(secondsRemaining / 60)} minutes and ${secondsRemaining % 60} seconds remaining`}
        >
          <Clock3 size={16} aria-hidden="true" />
          {String(Math.floor(secondsRemaining / 60)).padStart(2, "0")}:
          {String(secondsRemaining % 60).padStart(2, "0")}
        </div>
        <span className="sr-only" aria-live="polite">
          {timeAnnouncement}
        </span>
      </header>

      {error ? (
        <p className="mt-4 text-sm font-semibold" style={{ color: "var(--cp-danger)" }} role="alert">
          {error}
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {currentQuestion ? (
          <section key={currentQuestion.id} className="card rpg-quest-card self-start">
            <div className="flex items-center justify-between gap-3">
              <span className="eyebrow">
                Question {currentQuestionIndex + 1} ·{" "}
                {currentQuestion.type.replace("_", " ")}
              </span>
              <span className="muted text-xs">
                Difficulty {currentQuestion.difficulty}
              </span>
            </div>
            {currentQuestion.caseContext ? (
              <div
                className="mt-4 rounded-control border-l-4 p-4 text-sm leading-6"
                style={{
                  borderColor: "var(--cp-accent)",
                  background: "var(--cp-surface-soft)",
                }}
              >
                {currentQuestion.caseContext}
              </div>
            ) : null}
            <h2 className="mt-4 text-lg font-bold">{currentQuestion.prompt}</h2>
            <fieldset className="mt-4 grid gap-2">
              <legend className="sr-only">
                Answer question {currentQuestionIndex + 1}
              </legend>
              {currentQuestion.options.map((option, optionIndex) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-start gap-3 rounded-control border p-3 text-sm"
                  style={{
                    background:
                      answers[currentQuestion.id] === optionIndex
                        ? "var(--cp-accent-soft)"
                        : "var(--cp-bg-elevated)",
                    borderColor:
                      answers[currentQuestion.id] === optionIndex
                        ? "var(--cp-accent)"
                        : "var(--cp-border)",
                  }}
                >
                  <input
                    type="radio"
                    name={currentQuestion.id}
                    checked={answers[currentQuestion.id] === optionIndex}
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [currentQuestion.id]: optionIndex,
                      }))
                    }
                  />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
            <div className="mt-6 flex items-center justify-between gap-3 border-t pt-4">
              <button
                className="button-secondary"
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex((current) => Math.max(0, current - 1))
                }
                disabled={currentQuestionIndex === 0}
              >
                <ArrowLeft size={17} aria-hidden="true" />
                Previous
              </button>
              <button
                className="button-primary"
                type="button"
                onClick={() =>
                  setCurrentQuestionIndex((current) =>
                    Math.min(attempt.questions.length - 1, current + 1),
                  )
                }
                disabled={currentQuestionIndex === attempt.questions.length - 1}
              >
                Next
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </div>
          </section>
        ) : null}

        <aside className="card rpg-quest-card self-start lg:sticky lg:top-28">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Question navigator</h2>
            <span className="muted text-xs">
              {answeredCount}/{attempt.questions.length}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-10 lg:grid-cols-6">
            {attempt.questions.map((question, index) => {
              const isCurrent = index === currentQuestionIndex;
              const isAnswered = answers[question.id] !== undefined;
              return (
                <button
                  key={question.id}
                  type="button"
                  className="grid aspect-square place-items-center rounded-control border text-xs font-bold"
                  style={{
                    background: isCurrent
                      ? "var(--cp-accent)"
                      : isAnswered
                        ? "var(--cp-accent-soft)"
                        : "var(--cp-bg-elevated)",
                    borderColor: isCurrent
                      ? "var(--cp-accent)"
                      : isAnswered
                        ? "var(--cp-success)"
                        : "var(--cp-border)",
                    color: isCurrent
                      ? "var(--cp-accent-fg)"
                      : "var(--cp-text)",
                  }}
                  aria-label={`Question ${index + 1}${isAnswered ? ", answered" : ", unanswered"}`}
                  aria-current={isCurrent ? "step" : undefined}
                  onClick={() => setCurrentQuestionIndex(index)}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <p className="muted mt-4 text-xs leading-5">
            Filled runes are answered. You can revisit any answer until you submit.
          </p>
        </aside>
      </div>

      <div className="card mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="muted text-sm">
          Answered {answeredCount} of {attempt.questions.length}
        </p>
        <button
          className="button-primary"
          type="button"
          onClick={submit}
          disabled={
            busy ||
            secondsRemaining === 0 ||
            answeredCount !== attempt.questions.length
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
