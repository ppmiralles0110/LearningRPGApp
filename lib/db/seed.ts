import type { AppDatabase } from "@/lib/db";
import {
  achievements,
  certifications,
  domains,
  examQuestions,
  questTemplates,
  xpDefaults,
} from "@/lib/domain/catalog";
import { hashPassword, stableId } from "@/lib/auth/password";

export function seedDatabase(db: AppDatabase): void {
  const now = new Date().toISOString();
  const seed = db.transaction(() => {
    const domainStatement = db.prepare(`
      INSERT INTO domains(slug, name, priority, description)
      VALUES (@slug, @name, @priority, @description)
      ON CONFLICT(slug) DO UPDATE SET
        name=excluded.name,
        priority=excluded.priority,
        description=excluded.description
    `);
    for (const domain of domains) domainStatement.run(domain);

    const xpStatement = db.prepare(`
      INSERT INTO xp_config(source_type, amount, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(source_type) DO NOTHING
    `);
    for (const [sourceType, amount] of Object.entries(xpDefaults)) {
      xpStatement.run(sourceType, amount, now);
    }

    const questStatement = db.prepare(`
      INSERT INTO quest_templates(
        id, domain_slug, cadence, title, summary, duration_minutes, difficulty,
        challenge_mode, prerequisites_json, steps_json, active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(id) DO UPDATE SET
        domain_slug=excluded.domain_slug,
        cadence=excluded.cadence,
        title=excluded.title,
        summary=excluded.summary,
        duration_minutes=excluded.duration_minutes,
        difficulty=excluded.difficulty,
        challenge_mode=excluded.challenge_mode,
        prerequisites_json=excluded.prerequisites_json,
        steps_json=excluded.steps_json
    `);
    for (const template of questTemplates) {
      questStatement.run(
        template.id,
        template.domain,
        template.cadence,
        template.title,
        template.summary,
        template.durationMinutes,
        template.difficulty,
        template.challengeMode,
        JSON.stringify(template.prerequisites),
        JSON.stringify(template.steps),
      );
    }

    const achievementStatement = db.prepare(`
      INSERT INTO achievements(code, title, description, icon)
      VALUES (@code, @title, @description, @icon)
      ON CONFLICT(code) DO UPDATE SET
        title=excluded.title,
        description=excluded.description,
        icon=excluded.icon
    `);
    for (const achievement of achievements) {
      achievementStatement.run(achievement);
    }

    const certificationStatement = db.prepare(`
      INSERT INTO certifications(
        code, name, provider, description, recommended_order, domains_json, official_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        name=excluded.name,
        provider=excluded.provider,
        description=excluded.description,
        recommended_order=excluded.recommended_order,
        domains_json=excluded.domains_json,
        official_url=excluded.official_url
    `);
    for (const certification of certifications) {
      certificationStatement.run(
        certification.code,
        certification.name,
        certification.provider,
        certification.description,
        certification.recommendedOrder,
        JSON.stringify(certification.domains),
        certification.officialUrl,
      );
    }

    const questionStatement = db.prepare(`
      INSERT INTO exam_questions(
        id, certification_code, question_type, difficulty, domain_slug,
        case_context, prompt, options_json, answer_index, explanation
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        certification_code=excluded.certification_code,
        question_type=excluded.question_type,
        difficulty=excluded.difficulty,
        domain_slug=excluded.domain_slug,
        case_context=excluded.case_context,
        prompt=excluded.prompt,
        options_json=excluded.options_json,
        answer_index=excluded.answer_index,
        explanation=excluded.explanation
    `);
    for (const question of examQuestions) {
      questionStatement.run(
        question.id,
        question.certificationCode,
        question.type,
        question.difficulty,
        question.domain,
        question.caseContext ?? null,
        question.prompt,
        JSON.stringify(question.options),
        question.answer,
        question.explanation,
      );
    }

    const shouldSeedDemo =
      process.env.NODE_ENV !== "production" || process.env.SEED_DEMO_USER === "true";
    if (shouldSeedDemo) {
      const demoId = stableId("demo@levelup.local");
      db.prepare(`
        INSERT INTO users(
          id, email, password_hash, display_name, role, onboarding_complete,
          study_minutes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, 'learner', 1, 45, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          password_hash=excluded.password_hash
      `).run(
        demoId,
        "demo@levelup.local",
        hashPassword("LevelUpDemo!"),
        "Alex Architect",
        now,
        now,
      );

      const focusStatement = db.prepare(`
        INSERT INTO user_focus(user_id, domain_slug, rank, confidence)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(user_id, domain_slug) DO NOTHING
      `);
      [
        ["github-actions", 1, 55],
        ["azure-ai-foundry", 2, 40],
        ["ai-security", 3, 30],
      ].forEach(([domain, rank, confidence]) =>
        focusStatement.run(demoId, domain, rank, confidence),
      );

      const skillStatement = db.prepare(`
        INSERT INTO skill_progress(
          user_id, domain_slug, mastery, confidence, attempts,
          correct_answers, completed_steps, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, domain_slug) DO NOTHING
      `);
      domains.forEach((domain, index) =>
        skillStatement.run(
          demoId,
          domain.slug,
          Math.max(0, 42 - index * 3),
          Math.max(20, 55 - index * 3),
          index < 4 ? 3 : 0,
          index < 4 ? 2 : 0,
          index < 4 ? 2 : 0,
          now,
        ),
      );
    }
  });

  seed();
}
