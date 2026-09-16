import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { AppDatabase } from "@/lib/db";
import { createDatabase } from "@/lib/db";
import { getDashboard } from "@/lib/services/dashboard";
import {
  getCertificateFileRecord,
  recordCertificateEvidence,
} from "@/lib/services/certificates";

describe("certificate evidence", () => {
  let db: AppDatabase;
  let userId: string;

  beforeEach(() => {
    db = createDatabase(":memory:");
    userId = (
      db.prepare("SELECT id FROM users WHERE email=?").get("demo@levelup.local") as {
        id: string;
      }
    ).id;
  });

  afterEach(() => {
    db.close();
  });

  it("records proof, certified progress, XP, and the achievement atomically", () => {
    const result = recordCertificateEvidence(db, {
      userId,
      certificationCode: "GH-FOUNDATIONS",
      earnedOn: "2026-08-10",
      credentialId: "GHF-123",
      originalFileName: "certificate.pdf",
      storedFileName: `${userId}/proof.pdf`,
      mimeType: "application/pdf",
      fileSize: 512,
      sha256: "abc123",
      now: new Date("2026-09-15T09:00:00.000Z"),
    });

    expect(result.evidence).toMatchObject({
      certificationCode: "GH-FOUNDATIONS",
      earnedOn: "2026-08-10",
      credentialId: "GHF-123",
    });
    expect(
      db
        .prepare(
          "SELECT readiness, confidence, status FROM user_certification_progress WHERE user_id=? AND certification_code=?",
        )
        .get(userId, "GH-FOUNDATIONS"),
    ).toEqual({ readiness: 100, confidence: 100, status: "certified" });
    expect(
      db
        .prepare(
          "SELECT amount FROM xp_ledger WHERE user_id=? AND event_key=?",
        )
        .get(userId, "certification:GH-FOUNDATIONS"),
    ).toEqual({ amount: 1000 });
    expect(
      db
        .prepare(
          "SELECT 1 FROM user_achievements WHERE user_id=? AND achievement_code='certification-warrior'",
        )
        .get(userId),
    ).toBeTruthy();
    const certification = getDashboard(db, userId).certifications.find(
      (candidate) => candidate.code === "GH-FOUNDATIONS",
    );
    expect(certification).toMatchObject({
      readiness: 100,
      confidence: 100,
      status: "certified",
      certificateEvidence: {
        id: result.evidence.id,
        earnedOn: "2026-08-10",
      },
    });
  });

  it("replaces evidence without awarding duplicate certification XP", () => {
    const first = recordCertificateEvidence(db, {
      userId,
      certificationCode: "AI-900",
      earnedOn: "2025-01-01",
      originalFileName: "old.png",
      storedFileName: `${userId}/old.png`,
      mimeType: "image/png",
      fileSize: 256,
      sha256: "old",
    });
    const replacement = recordCertificateEvidence(db, {
      userId,
      certificationCode: "AI-900",
      earnedOn: "2026-01-01",
      originalFileName: "renewal.png",
      storedFileName: `${userId}/renewal.png`,
      mimeType: "image/png",
      fileSize: 300,
      sha256: "new",
    });

    expect(replacement.evidence.id).toBe(first.evidence.id);
    expect(replacement.replacedStoredFileName).toBe(`${userId}/old.png`);
    expect(
      (
        db
          .prepare(
            "SELECT COUNT(*) AS count FROM xp_ledger WHERE user_id=? AND event_key=?",
          )
          .get(userId, "certification:AI-900") as { count: number }
      ).count,
    ).toBe(1);
  });

  it("does not expose another learner's certificate record", () => {
    const result = recordCertificateEvidence(db, {
      userId,
      certificationCode: "SC-900",
      earnedOn: "2026-02-02",
      originalFileName: "proof.webp",
      storedFileName: `${userId}/proof.webp`,
      mimeType: "image/webp",
      fileSize: 200,
      sha256: "hash",
    });

    expect(() =>
      getCertificateFileRecord(db, "another-user", result.evidence.id),
    ).toThrowError(/not found/i);
  });
});
