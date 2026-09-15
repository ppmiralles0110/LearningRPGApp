import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";

interface MentorContext {
  displayName: string;
  studyMinutes: number;
  weakestDomain: string;
  mastery: number;
  activeQuest: string | null;
  certification: string | null;
}

function getMentorContext(db: AppDatabase, userId: string): MentorContext {
  const user = db
    .prepare("SELECT display_name, study_minutes FROM users WHERE id=?")
    .get(userId) as { display_name: string; study_minutes: number };
  const weakness = db
    .prepare(`
      SELECT d.name, COALESCE(sp.mastery, 0) AS mastery
      FROM domains d
      LEFT JOIN skill_progress sp ON sp.domain_slug=d.slug AND sp.user_id=?
      LEFT JOIN user_focus uf ON uf.domain_slug=d.slug AND uf.user_id=?
      ORDER BY CASE WHEN uf.rank IS NULL THEN 1 ELSE 0 END, mastery, d.priority
      LIMIT 1
    `)
    .get(userId) as { name: string; mastery: number };
  const quest = db
    .prepare(`
      SELECT qt.title
      FROM quest_instances qi
      JOIN quest_templates qt ON qt.id=qi.template_id
      WHERE qi.user_id=? AND qi.status='active'
      ORDER BY qi.generated_at DESC
      LIMIT 1
    `)
    .get(userId) as { title: string } | undefined;
  const certification = db
    .prepare(`
      SELECT c.name
      FROM certifications c
      LEFT JOIN user_certification_progress ucp
        ON ucp.certification_code=c.code AND ucp.user_id=?
      ORDER BY COALESCE(ucp.readiness, 0) DESC, c.recommended_order
      LIMIT 1
    `)
    .get(userId) as { name: string } | undefined;
  return {
    displayName: user.display_name,
    studyMinutes: user.study_minutes,
    weakestDomain: weakness.name,
    mastery: weakness.mastery,
    activeQuest: quest?.title ?? null,
    certification: certification?.name ?? null,
  };
}

function localReply(message: string, context: MentorContext): string {
  const normalized = message.toLowerCase();
  const questAction = context.activeQuest
    ? `Continue "${context.activeQuest}" and complete one step before switching topics.`
    : `Generate a daily quest in ${context.weakestDomain} and reserve ${context.studyMinutes} minutes.`;
  if (normalized.includes("cert")) {
    return `Guide's counsel: ${context.certification ?? "your first fundamentals certification"} is the strongest next checkpoint. Take a practice exam, use weak-topic remediation, and schedule the real exam only after readiness is consistently above 80.`;
  }
  if (
    normalized.includes("stuck") ||
    normalized.includes("hard") ||
    normalized.includes("confus")
  ) {
    return `Every architect meets a locked gate, ${context.displayName}. Reduce the problem to one concept, write what you expect to happen, then test the smallest example. ${questAction}`;
  }
  if (normalized.includes("what") && normalized.includes("next")) {
    return `Your map points to ${context.weakestDomain}, currently at ${context.mastery}% mastery. ${questAction} The goal is evidence of understanding, not merely marking a task complete.`;
  }
  if (normalized.includes("time") || normalized.includes("busy")) {
    return `Use a ${context.studyMinutes}-minute expedition: 10 minutes reading, 25 minutes hands-on, and the remaining time for the knowledge check and notes. Stop at a clean checkpoint rather than opening a second quest.`;
  }
  return `Guide's note: focus beats wandering. ${questAction} Afterward, explain the design choice in your own words; that reflection will expose what to revisit next.`;
}

async function providerReply(
  message: string,
  context: MentorContext,
): Promise<string> {
  const provider = process.env.MENTOR_PROVIDER ?? "local";
  if (provider === "local") return localReply(message, context);
  if (provider !== "openai-compatible") {
    throw new AppError(
      `Unsupported mentor provider "${provider}".`,
      500,
      "MENTOR_PROVIDER_UNSUPPORTED",
    );
  }

  const apiUrl = process.env.MENTOR_API_URL;
  const apiKey = process.env.MENTOR_API_KEY;
  const model = process.env.MENTOR_MODEL;
  if (!apiUrl || !apiKey || !model) {
    throw new AppError(
      "MENTOR_API_URL, MENTOR_API_KEY, and MENTOR_MODEL are required for the openai-compatible mentor.",
      503,
      "MENTOR_PROVIDER_NOT_CONFIGURED",
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content:
              "You are The Guide, a concise RPG mentor for Cloud Solution Architects. Encourage deliberate practice, explain accurately, never claim a learner completed work, and recommend only the supplied local learning state. Respond in under 120 words.",
          },
          {
            role: "system",
            content: `Learner context: ${JSON.stringify(context)}`,
          },
          { role: "user", content: message },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      throw new AppError(
        `Mentor provider returned HTTP ${response.status}.`,
        502,
        "MENTOR_PROVIDER_ERROR",
      );
    }
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new AppError(
        "Mentor provider returned no message.",
        502,
        "MENTOR_EMPTY_RESPONSE",
      );
    }
    return content;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new AppError("Mentor provider timed out.", 504, "MENTOR_TIMEOUT");
    }
    throw new AppError("Mentor provider request failed.", 502, "MENTOR_PROVIDER_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}

export async function askMentor(
  db: AppDatabase,
  userId: string,
  message: string,
): Promise<{ response: string; provider: string }> {
  const provider = process.env.MENTOR_PROVIDER ?? "local";
  const context = getMentorContext(db, userId);
  const response = await providerReply(message, context);
  const now = new Date().toISOString();
  const save = db.transaction(() => {
    db.prepare(`
      INSERT INTO mentor_messages(id, user_id, role, content, provider, created_at)
      VALUES (?, ?, 'learner', ?, ?, ?)
    `).run(randomUUID(), userId, message, provider, now);
    db.prepare(`
      INSERT INTO mentor_messages(id, user_id, role, content, provider, created_at)
      VALUES (?, ?, 'mentor', ?, ?, ?)
    `).run(randomUUID(), userId, response, provider, now);
  });
  save();
  return { response, provider };
}

export function mentorHistory(db: AppDatabase, userId: string) {
  const rows = db
    .prepare(`
      SELECT id, role, content, provider, created_at
      FROM mentor_messages
      WHERE user_id=?
      ORDER BY created_at DESC
      LIMIT 20
    `)
    .all(userId) as Array<{
    id: string;
    role: "learner" | "mentor";
    content: string;
    provider: string;
    created_at: string;
  }>;
  return rows.reverse().map((row) => ({
    id: row.id,
    role: row.role,
    content: row.content,
    provider: row.provider,
    createdAt: row.created_at,
  }));
}
