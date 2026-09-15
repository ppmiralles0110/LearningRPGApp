"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  ExternalLink,
  GraduationCap,
  LoaderCircle,
  Map,
  ShieldCheck,
} from "lucide-react";
import type { DashboardData } from "@/lib/services/dashboard";
import type { ExamAttemptView } from "@/lib/services/exams";
import { ClientApiError, fetchJson } from "@/lib/client-api";
import { ProgressBar } from "@/components/progress-bar";

type Certification = DashboardData["certifications"][number];

export function CertificationsClient() {
  const router = useRouter();
  const [certifications, setCertifications] = useState<Certification[] | null>(null);
  const [difficulty, setDifficulty] = useState(2);
  const [busyCode, setBusyCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const result = await fetchJson<{ certifications: Certification[] }>(
        "/api/certifications",
      );
      setCertifications(result.certifications);
      setError(null);
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "The certification roadmap could not be loaded.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function startPracticeExam(certificationCode: string) {
    setBusyCode(certificationCode);
    setError(null);
    try {
      const response = await fetchJson<{ attempt: ExamAttemptView }>("/api/exams", {
        method: "POST",
        body: JSON.stringify({
          certificationCode,
          difficulty,
          durationMinutes: 30,
        }),
      });
      router.push(`/exams/${response.attempt.id}`);
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "The practice exam could not be started.",
      );
      setBusyCode(null);
    }
  }

  return (
    <div className="rpg-page">
      <header className="rpg-hero flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="relative z-[1]">
          <p className="eyebrow">Certification trial grounds</p>
          <h1 className="rpg-title mt-2 text-3xl sm:text-5xl">
            Turn readiness into evidence
          </h1>
          <p className="muted mt-2 max-w-3xl">
            The roadmap blends skill mastery, self-confidence, and recent practice exam
            performance. Readiness is guidance, not a guarantee of passing.
          </p>
        </div>
        <label className="relative z-[1] text-sm font-semibold">
          Practice difficulty
          <select
            className="input ml-2 w-auto"
            value={difficulty}
            onChange={(event) => setDifficulty(Number(event.target.value))}
          >
            <option value={1}>1 · Foundation</option>
            <option value={2}>2 · Standard</option>
            <option value={3}>3 · Scenario</option>
            <option value={4}>4 · Advanced</option>
            <option value={5}>5 · Expert</option>
          </select>
        </label>
      </header>

      {error ? (
        <p className="mt-5 text-sm font-semibold" style={{ color: "var(--cp-danger)" }} role="alert">
          {error}
        </p>
      ) : null}

      <section className="card rpg-quest-card mt-6">
        <div className="flex items-center gap-3">
          <Map style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
          <div>
            <p className="eyebrow">Recommended order</p>
            <h2 className="text-xl font-bold">Cloud architect credential path</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {(certifications ?? []).map((certification, index) => (
            <div
              key={certification.code}
              className="rpg-quest-row relative border p-3"
              style={{ background: "var(--cp-bg-elevated)" }}
            >
              <span
                className="grid h-6 w-6 place-items-center rounded-full text-xs font-bold"
                style={{ background: "var(--cp-accent)", color: "var(--cp-accent-fg)" }}
              >
                {index + 1}
              </span>
              <p className="mt-2 text-xs font-bold">{certification.code}</p>
              <p className="muted mt-1 text-xs leading-4">{certification.name}</p>
            </div>
          ))}
        </div>
      </section>

      {!certifications ? (
        <div className="mt-4 grid gap-4 lg:grid-cols-2" aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-card border"
              style={{ background: "var(--cp-surface)" }}
            />
          ))}
        </div>
      ) : (
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          {certifications.map((certification) => (
            <article key={certification.code} className="card rpg-cert-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-11 w-11 shrink-0 place-items-center rounded-control"
                    style={{ background: "var(--cp-accent-soft)", color: "var(--cp-accent)" }}
                  >
                    {certification.provider === "GitHub" ? (
                      <ShieldCheck size={22} aria-hidden="true" />
                    ) : (
                      <GraduationCap size={22} aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <p className="muted text-xs font-bold">{certification.provider}</p>
                    <h2 className="mt-1 text-xl font-bold">{certification.name}</h2>
                    <p className="mt-1 text-sm font-semibold" style={{ color: "var(--cp-accent)" }}>
                      {certification.code}
                    </p>
                  </div>
                </div>
                <span
                  className="rpg-status-chip capitalize"
                  style={{
                    background: "var(--cp-surface-soft)",
                    color:
                      certification.status === "ready"
                        ? "var(--cp-success)"
                        : "var(--cp-text-muted)",
                  }}
                >
                  {certification.status}
                </span>
              </div>
              <p className="muted mt-4 text-sm leading-6">{certification.description}</p>
              <div className="mt-5">
                <ProgressBar
                  value={certification.readiness}
                  label={`Readiness · confidence ${certification.confidence}%`}
                />
              </div>
              <div className="muted mt-4 flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1">
                  <Clock3 size={13} aria-hidden="true" />
                  30-minute practice
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={13} aria-hidden="true" />
                  Recent score {certification.recentExamScore ?? "—"}
                  {certification.recentExamScore !== null ? "%" : ""}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  className="button-primary"
                  type="button"
                  onClick={() => startPracticeExam(certification.code)}
                  disabled={Boolean(busyCode)}
                >
                  {busyCode === certification.code ? (
                    <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
                  ) : (
                    <BookOpen size={17} aria-hidden="true" />
                  )}
                  Start practice exam
                </button>
                <a
                  className="button-secondary"
                  href={certification.officialUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Official page <ExternalLink size={15} aria-hidden="true" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-4 rounded-control border p-4 text-sm" style={{ background: "var(--cp-bg-elevated)" }}>
        <p className="font-bold">Practice engine scope</p>
        <p className="muted mt-1">
          This MVP includes deterministic multiple-choice, scenario, and case-study
          questions with timed attempts, scoring, weak-topic analysis, and remediation.
          It is not an official exam simulator or a substitute for vendor materials.
        </p>
      </div>
    </div>
  );
}
