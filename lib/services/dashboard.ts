import type { AppDatabase } from "@/lib/db";
import { calculateLevel } from "@/lib/domain/progression";
import { readinessScore } from "@/lib/domain/exams";
import { rankRecommendations } from "@/lib/domain/recommendations";
import type { DomainSlug } from "@/lib/domain/types";
import {
  getLearnerSignals,
  listQuests,
  type QuestView,
} from "@/lib/services/learning";

interface CertificationRow {
  code: string;
  name: string;
  provider: "Microsoft" | "GitHub";
  description: string;
  recommended_order: number;
  domains_json: string;
  official_url: string;
  confidence: number | null;
  status: string | null;
  evidence_id: string | null;
  earned_on: string | null;
  expires_on: string | null;
  credential_id: string | null;
  verification_url: string | null;
  original_file_name: string | null;
  file_size: number | null;
  uploaded_at: string | null;
}

export function getDashboard(db: AppDatabase, userId: string) {
  const user = db
    .prepare(`
      SELECT id, display_name, email, role, study_minutes, onboarding_complete
      FROM users
      WHERE id = ?
    `)
    .get(userId) as {
    id: string;
    display_name: string;
    email: string;
    role: string;
    study_minutes: number;
    onboarding_complete: number;
  };
  const xp = db
    .prepare(`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM xp_ledger
      WHERE user_id = ?
    `)
    .get(userId) as { total: number };
  const level = calculateLevel(xp.total);

  const skills = db
    .prepare(`
      SELECT d.slug, d.name, d.priority, COALESCE(sp.mastery, 0) AS mastery,
        COALESCE(sp.confidence, uf.confidence, 25) AS confidence,
        COALESCE(sp.attempts, 0) AS attempts,
        CASE
          WHEN COALESCE(sp.attempts, 0) = 0 THEN 0
          ELSE ROUND(sp.correct_answers * 100.0 / sp.attempts)
        END AS accuracy,
        uf.rank AS focus_rank
      FROM domains d
      LEFT JOIN skill_progress sp ON sp.domain_slug=d.slug AND sp.user_id=?
      LEFT JOIN user_focus uf ON uf.domain_slug=d.slug AND uf.user_id=?
      ORDER BY d.priority
    `)
    .all(userId, userId) as Array<{
    slug: DomainSlug;
    name: string;
    priority: number;
    mastery: number;
    confidence: number;
    attempts: number;
    accuracy: number;
    focus_rank: number | null;
  }>;

  const streakRows = db
    .prepare(`
      SELECT period_kind, count, best_count, last_period_key
      FROM streaks
      WHERE user_id = ?
    `)
    .all(userId) as Array<{
    period_kind: "daily" | "weekly" | "monthly";
    count: number;
    best_count: number;
    last_period_key: string | null;
  }>;
  const streaks = (["daily", "weekly", "monthly"] as const).map((kind) => {
    const value = streakRows.find((row) => row.period_kind === kind);
    return {
      kind,
      count: value?.count ?? 0,
      bestCount: value?.best_count ?? 0,
      lastPeriodKey: value?.last_period_key ?? null,
    };
  });

  const achievementRows = db
    .prepare(`
      SELECT a.code, a.title, a.description, a.icon, ua.unlocked_at
      FROM achievements a
      LEFT JOIN user_achievements ua
        ON ua.achievement_code=a.code AND ua.user_id=?
      ORDER BY ua.unlocked_at DESC, a.code
    `)
    .all(userId) as Array<{
    code: string;
    title: string;
    description: string;
    icon: string;
    unlocked_at: string | null;
  }>;

  const certifications = db
    .prepare(`
      SELECT c.*, ucp.confidence, ucp.status,
        uc.id AS evidence_id, uc.earned_on, uc.expires_on, uc.credential_id,
        uc.verification_url, uc.original_file_name, uc.file_size, uc.uploaded_at
      FROM certifications c
      LEFT JOIN user_certification_progress ucp
        ON ucp.certification_code=c.code AND ucp.user_id=?
      LEFT JOIN user_certificates uc
        ON uc.certification_code=c.code AND uc.user_id=?
      ORDER BY c.recommended_order
    `)
    .all(userId, userId) as CertificationRow[];
  const certificationViews = certifications.map((certification) => {
    const domains = JSON.parse(certification.domains_json) as DomainSlug[];
    const matchingSkills = skills.filter((skill) => domains.includes(skill.slug));
    const examScores = db
      .prepare(`
        SELECT score
        FROM exam_attempts
        WHERE user_id=? AND certification_code=? AND status='submitted'
          AND score IS NOT NULL
        ORDER BY submitted_at DESC
        LIMIT 5
      `)
      .all(userId, certification.code) as Array<{ score: number }>;
    const confidence =
      certification.confidence ??
      (matchingSkills.length > 0
        ? Math.round(
            matchingSkills.reduce((sum, skill) => sum + skill.confidence, 0) /
              matchingSkills.length,
          )
        : 25);
    const readiness = readinessScore({
      mastery: matchingSkills.map((skill) => skill.mastery),
      examScores: examScores.map((exam) => exam.score),
      confidence,
    });
    return {
      code: certification.code,
      name: certification.name,
      provider: certification.provider,
      description: certification.description,
      recommendedOrder: certification.recommended_order,
      domains,
      officialUrl: certification.official_url,
      readiness: certification.status === "certified" ? 100 : readiness,
      confidence,
      status:
        certification.status ??
        (readiness >= 80 ? "ready" : readiness >= 35 ? "preparing" : "planned"),
      recentExamScore: examScores[0]?.score ?? null,
      certificateEvidence: certification.evidence_id
        ? {
            id: certification.evidence_id,
            earnedOn: certification.earned_on,
            expiresOn: certification.expires_on,
            credentialId: certification.credential_id,
            verificationUrl: certification.verification_url,
            originalFileName: certification.original_file_name,
            fileSize: certification.file_size,
            uploadedAt: certification.uploaded_at,
            downloadUrl: `/api/certifications/evidence/${certification.evidence_id}/download`,
          }
        : null,
    };
  });

  const candidates = db
    .prepare(`
      SELECT qt.id, qt.title, qt.summary, qt.domain_slug, qt.difficulty,
        qt.duration_minutes, qt.prerequisites_json, d.priority
      FROM quest_templates qt
      JOIN domains d ON d.slug=qt.domain_slug
      WHERE qt.cadence='daily' AND qt.active=1
    `)
    .all() as Array<{
    id: string;
    title: string;
    summary: string;
    domain_slug: DomainSlug;
    difficulty: number;
    duration_minutes: number;
    prerequisites_json: string;
    priority: number;
  }>;
  const recommendationDetails = new Map(
    candidates.map((candidate) => [candidate.id, candidate]),
  );
  const recommendations = rankRecommendations(
    candidates.map((candidate) => ({
      id: candidate.id,
      domain: candidate.domain_slug,
      difficulty: candidate.difficulty,
      durationMinutes: candidate.duration_minutes,
      prerequisites: JSON.parse(candidate.prerequisites_json) as DomainSlug[],
      priority: 11 - candidate.priority,
    })),
    getLearnerSignals(db, userId),
    user.study_minutes,
  )
    .slice(0, 3)
    .map((recommendation) => ({
      ...recommendation,
      title: recommendationDetails.get(recommendation.id)?.title ?? recommendation.id,
      summary: recommendationDetails.get(recommendation.id)?.summary ?? "",
    }));

  const ledger = db
    .prepare(`
      SELECT id, source_type, amount, description, created_at
      FROM xp_ledger
      WHERE user_id=?
      ORDER BY created_at DESC
      LIMIT 12
    `)
    .all(userId) as Array<{
    id: string;
    source_type: string;
    amount: number;
    description: string;
    created_at: string;
  }>;

  const quests: QuestView[] = listQuests(db, userId);
  const activeQuest = quests.find((quest) => quest.status === "active");
  const weakestFocus =
    skills
      .filter((skill) => skill.focus_rank !== null)
      .sort((a, b) => a.mastery - b.mastery)[0] ??
    skills.slice().sort((a, b) => a.mastery - b.mastery)[0];
  const mentorGuidance = activeQuest
    ? `Your next move is "${activeQuest.title}". Finish its next step, then reflect on one architecture tradeoff before claiming the XP.`
    : `Adventurer, ${weakestFocus.name} is your clearest growth path. Generate today's quest and protect a focused ${user.study_minutes}-minute block.`;

  return {
    user: {
      id: user.id,
      displayName: user.display_name,
      email: user.email,
      role: user.role,
      studyMinutes: user.study_minutes,
      onboardingComplete: user.onboarding_complete === 1,
    },
    progression: {
      totalXp: xp.total,
      ...level,
    },
    streaks,
    skills: skills.map((skill) => ({
      slug: skill.slug,
      name: skill.name,
      mastery: skill.mastery,
      confidence: skill.confidence,
      accuracy: skill.accuracy,
      attempts: skill.attempts,
      focusRank: skill.focus_rank,
    })),
    quests,
    achievements: achievementRows.map((achievement) => ({
      code: achievement.code,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      unlockedAt: achievement.unlocked_at,
    })),
    certifications: certificationViews,
    recommendations,
    mentorGuidance,
    xpLedger: ledger.map((entry) => ({
      id: entry.id,
      sourceType: entry.source_type,
      amount: entry.amount,
      description: entry.description,
      createdAt: entry.created_at,
    })),
  };
}

export type DashboardData = ReturnType<typeof getDashboard>;
