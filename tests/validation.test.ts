import { describe, expect, it } from "vitest";
import {
  certificateEvidenceSchema,
  onboardingSchema,
  registrationSchema,
  startExamSchema,
  submitExamSchema,
} from "@/lib/validation";

describe("request validation", () => {
  it("accepts a valid local learner registration", () => {
    expect(
      registrationSchema.parse({
        displayName: "Ada Architect",
        email: "ada@example.com",
        password: "secure-passphrase",
      }),
    ).toMatchObject({ email: "ada@example.com" });
  });

  it("rejects duplicate focus areas and unsupported study windows", () => {
    const result = onboardingSchema.safeParse({
      studyMinutes: 20,
      focusAreas: ["github-actions", "github-actions"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid exam answer indices", () => {
    expect(
      submitExamSchema.safeParse({ answers: { q1: -1 } }).success,
    ).toBe(false);
  });

  it("defaults practice assessments to 90 minutes", () => {
    expect(
      startExamSchema.parse({
        certificationCode: "AI-900",
        difficulty: 3,
      }).durationMinutes,
    ).toBe(90);
  });

  it("rejects certificate expiry before the earned date", () => {
    expect(
      certificateEvidenceSchema.safeParse({
        earnedOn: "2026-09-15",
        expiresOn: "2026-09-14",
      }).success,
    ).toBe(false);
  });
});
