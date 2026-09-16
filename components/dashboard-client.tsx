"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Award,
  BookOpenCheck,
  BrainCircuit,
  Clock3,
  Flame,
  GraduationCap,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Swords,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import type { DashboardData } from "@/lib/services/dashboard";
import { ClientApiError, fetchJson } from "@/lib/client-api";
import { ProgressBar } from "@/components/progress-bar";

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchJson<DashboardData>("/api/dashboard"));
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "The campaign dashboard could not be loaded.",
      );
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function generateDailyQuest() {
    setBusy(true);
    setError(null);
    try {
      await fetchJson("/api/quests", {
        method: "POST",
        body: JSON.stringify({ cadence: "daily" }),
      });
      await load();
    } catch (caught) {
      setError(
        caught instanceof ClientApiError
          ? caught.message
          : "A daily quest could not be generated.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (error && !data) {
    return (
      <div className="card mx-auto mt-16 max-w-xl text-center">
        <RefreshCw className="mx-auto" size={32} aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-bold">Your map failed to load</h1>
        <p className="muted mt-2">{error}</p>
        <button className="button-primary mt-5" type="button" onClick={load}>
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div aria-live="polite" aria-busy="true">
        <div className="mb-8 h-8 w-64 animate-pulse rounded-control" style={{ background: "var(--cp-surface-soft)" }} />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-card border"
              style={{ background: "var(--cp-surface)" }}
            />
          ))}
        </div>
        <span className="sr-only">Loading your campaign dashboard</span>
      </div>
    );
  }

  const activeQuest = data.quests.find((quest) => quest.status === "active");
  const unlocked = data.achievements.filter((achievement) => achievement.unlockedAt);
  const dailyStreak = data.streaks.find((streak) => streak.kind === "daily");
  const nextCertification = data.certifications
    .filter((certification) => certification.status !== "certified")
    .slice()
    .sort((a, b) => b.readiness - a.readiness)[0];

  return (
    <div className="rpg-page">
      <header className="rpg-hero mb-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="relative z-[1]">
          <p className="eyebrow">Campaign command hall</p>
          <h1 className="rpg-title mt-2 text-3xl sm:text-5xl">
            Ready for the next quest, {data.user.displayName.split(" ")[0]}?
          </h1>
          <p className="muted mt-3 max-w-3xl">
            Your path adapts as mastery, confidence, accuracy, and available time change.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="rpg-status-chip">
              <Sparkles size={12} aria-hidden="true" />
              Campaign online
            </span>
            <span className="rpg-status-chip">
              <Clock3 size={12} aria-hidden="true" />
              {data.user.studyMinutes} minute loadout
            </span>
            <span className="rpg-status-chip capitalize">
              <Target size={12} aria-hidden="true" />
              {data.user.role.replace("_", " ")}
            </span>
          </div>
        </div>
        <Link className="button-secondary relative z-[1]" href="/quests">
          Open quest log <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </header>

      {error ? (
        <div
          className="mb-5 rounded-control border px-4 py-3 text-sm"
          style={{ borderColor: "var(--cp-danger)", color: "var(--cp-danger)" }}
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.45fr_1fr_1fr]">
        <div
          className="rpg-level-card"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="eyebrow">Rank · {data.progression.tier}</p>
              <div className="mt-4 flex items-end gap-3">
                <span className="muted pb-1 text-sm font-black uppercase tracking-[0.18em]">
                  Level
                </span>
                <h2 className="rpg-level-number">{data.progression.level}</h2>
              </div>
            </div>
            <span
              className="rpg-icon-frame h-14 w-14"
            >
              <Trophy size={27} aria-hidden="true" />
            </span>
          </div>
          <div className="mt-6">
            <ProgressBar
              value={data.progression.progressPercent}
              label={
                data.progression.level === 100
                  ? "Maximum level reached"
                  : `${data.progression.xpIntoLevel} / ${
                      data.progression.nextLevelXp -
                      data.progression.currentLevelXp
                    } XP to level ${data.progression.level + 1}`
              }
            />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="muted">Lifetime XP</span>
            <span className="font-bold">{data.progression.totalXp.toLocaleString()} XP</span>
          </div>
        </div>

        <div className="card rpg-stat-card">
          <div className="flex items-center gap-3">
            <span
              className="rpg-icon-frame h-11 w-11"
            >
              <Flame size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">Daily streak</p>
              <p className="text-2xl font-bold">{dailyStreak?.count ?? 0} days</p>
            </div>
          </div>
          <p className="muted mt-5 text-sm">
            Best expedition: {dailyStreak?.bestCount ?? 0} days. Only the first completed
            quest per UTC day can advance the streak.
          </p>
        </div>

        <div className="card rpg-stat-card">
          <div className="flex items-center gap-3">
            <span
              className="rpg-icon-frame h-11 w-11"
            >
              <Award size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">Achievements</p>
              <p className="text-2xl font-bold">
                {unlocked.length} / {data.achievements.length}
              </p>
            </div>
          </div>
          <p className="muted mt-5 text-sm">
            {unlocked[0]
              ? `Latest unlock: ${unlocked[0].title}`
              : "Complete your first hands-on lab to unlock a badge."}
          </p>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <div className="card rpg-quest-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Active mission</p>
              <h2 className="mt-1 text-xl font-bold">Today&apos;s quest</h2>
            </div>
            <Swords style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
          </div>
          {activeQuest ? (
            <div className="mt-5">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                <span className="rpg-status-chip">
                  {activeQuest.cadence}
                </span>
                <span className="muted flex items-center gap-1">
                  <Clock3 size={13} aria-hidden="true" />
                  {activeQuest.durationMinutes} min
                </span>
                <span className="muted capitalize">{activeQuest.challengeMode}</span>
              </div>
              <h3 className="mt-3 text-2xl font-bold">{activeQuest.title}</h3>
              <p className="muted mt-2 leading-6">{activeQuest.summary}</p>
              <div className="mt-5">
                <ProgressBar value={activeQuest.progressPercent} label="Quest progress" />
              </div>
              <Link className="button-primary mt-5" href="/quests">
                Continue quest <ArrowRight size={17} aria-hidden="true" />
              </Link>
            </div>
          ) : (
            <div className="mt-5 rounded-control border border-dashed p-6 text-center">
              <BookOpenCheck className="mx-auto" size={28} aria-hidden="true" />
              <h3 className="mt-3 font-bold">No daily quest is active</h3>
              <p className="muted mt-1 text-sm">
                Generate an adaptive 30–60 minute expedition from your learning signals.
              </p>
              <button
                type="button"
                className="button-primary mt-4"
                onClick={generateDailyQuest}
                disabled={busy}
              >
                {busy ? (
                  <LoaderCircle className="animate-spin" size={17} aria-hidden="true" />
                ) : (
                  <Sparkles size={17} aria-hidden="true" />
                )}
                Generate quest
              </button>
            </div>
          )}
        </div>

        <div className="card rpg-stat-card">
          <div className="flex items-center gap-3">
            <MessageCircle style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
            <div>
              <p className="eyebrow">Personal mentor</p>
              <h2 className="text-xl font-bold">The Guide&apos;s counsel</h2>
            </div>
          </div>
          <blockquote
            className="mt-5 rounded-control border-l-4 p-4 text-sm leading-6"
            style={{
              borderColor: "var(--cp-accent)",
              background: "var(--cp-surface-soft)",
            }}
          >
            “{data.mentorGuidance}”
          </blockquote>
          <Link className="button-secondary mt-4" href="/mentor">
            Ask The Guide
          </Link>
        </div>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_1fr]">
        <div className="card rpg-quest-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow">Adaptive path</p>
              <h2 className="mt-1 text-xl font-bold">Recommended next</h2>
            </div>
            <Target style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
          </div>
          <div className="mt-4 space-y-3">
            {data.recommendations.length > 0 ? (
              data.recommendations.map((recommendation, index) => (
                <div
                  key={recommendation.id}
                  className="rpg-quest-row border p-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold"
                      style={{
                        background: "var(--cp-accent)",
                        color: "var(--cp-accent-fg)",
                      }}
                    >
                      {index + 1}
                    </span>
                    <div>
                      <h3 className="font-bold">{recommendation.title}</h3>
                      <p className="muted mt-1 text-sm">{recommendation.summary}</p>
                      <p className="mt-2 text-xs font-semibold" style={{ color: "var(--cp-accent)" }}>
                        {recommendation.reasons.slice(0, 2).join(" · ")}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="muted rounded-control border border-dashed p-5 text-sm">
                Complete prerequisite quests to unlock more recommendations.
              </p>
            )}
          </div>
        </div>

        <div className="card rpg-cert-card">
          <div className="flex items-center gap-3">
            <GraduationCap style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
            <div>
              <p className="eyebrow">Certification roadmap</p>
              <h2 className="text-xl font-bold">Closest checkpoint</h2>
            </div>
          </div>
          {nextCertification ? (
            <div className="mt-5">
              <p className="muted text-xs font-semibold">{nextCertification.provider}</p>
              <h3 className="mt-1 text-xl font-bold">{nextCertification.name}</h3>
              <div className="mt-4">
                <ProgressBar
                  value={nextCertification.readiness}
                  label={`${nextCertification.code} readiness`}
                />
              </div>
              <p className="muted mt-3 text-sm">
                Confidence {nextCertification.confidence}% · Status{" "}
                <span className="capitalize">{nextCertification.status}</span>
              </p>
              <Link className="button-secondary mt-4" href="/certifications">
                View roadmap
              </Link>
            </div>
          ) : (
            <div className="mt-5">
              <p className="font-bold">Roadmap conquered</p>
              <p className="muted mt-2 text-sm">
                Every current roadmap credential has certificate evidence. Keep
                skills current through boss battles and renew expiring credentials.
              </p>
              <Link className="button-secondary mt-4" href="/certifications">
                Review certificates
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="card mt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Skill intelligence</p>
            <h2 className="mt-1 text-xl font-bold">Mastery heatmap</h2>
          </div>
          <BrainCircuit style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {data.skills.map((skill) => (
            <div
              key={skill.slug}
              className="rpg-skill-tile border p-3"
              style={{
                background:
                  skill.mastery >= 50
                    ? "var(--cp-accent-soft)"
                    : "var(--cp-surface-soft)",
                borderColor:
                  skill.focusRank !== null ? "var(--cp-accent)" : "var(--cp-border)",
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-bold leading-5">{skill.name}</h3>
                {skill.focusRank !== null ? (
                  <span
                    className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                    style={{ color: "var(--cp-accent)" }}
                  >
                    #{skill.focusRank}
                  </span>
                ) : null}
              </div>
              <div className="mt-3">
                <ProgressBar value={skill.mastery} label="Mastery" compact />
              </div>
              <p className="muted mt-2 text-xs">
                Confidence {skill.confidence}% · Accuracy {skill.accuracy}%
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="card">
          <div className="flex items-center gap-3">
            <Zap style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
            <h2 className="text-xl font-bold">Recent XP</h2>
          </div>
          <div className="mt-4 divide-y">
            {data.xpLedger.length > 0 ? (
              data.xpLedger.slice(0, 6).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <p className="text-sm font-semibold">{entry.description}</p>
                    <p className="muted mt-0.5 text-xs capitalize">
                      {entry.sourceType.replace("_", " ")}
                    </p>
                  </div>
                  <span className="font-bold" style={{ color: "var(--cp-success)" }}>
                    +{entry.amount} XP
                  </span>
                </div>
              ))
            ) : (
              <p className="muted py-5 text-sm">
                Your immutable XP ledger will appear after the first completed step.
              </p>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <Award style={{ color: "var(--cp-accent)" }} aria-hidden="true" />
            <h2 className="text-xl font-bold">Badge cabinet</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {data.achievements.map((achievement) => (
              <div
                key={achievement.code}
                className="rpg-achievement border p-5 text-center"
                data-unlocked={Boolean(achievement.unlockedAt)}
                style={{
                  background: achievement.unlockedAt
                    ? "var(--cp-accent-soft)"
                    : "var(--cp-surface-soft)",
                  opacity: achievement.unlockedAt ? 1 : 0.58,
                }}
                title={achievement.description}
              >
                <Award className="mx-auto" size={22} aria-hidden="true" />
                <p className="mt-2 text-xs font-bold">{achievement.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
