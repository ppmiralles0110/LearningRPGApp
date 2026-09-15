import { z } from "zod";
import { DOMAIN_SLUGS } from "@/lib/domain/types";

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(8).max(128),
});

export const registrationSchema = loginSchema.extend({
  displayName: z.string().trim().min(2).max(80),
});

export const onboardingSchema = z.object({
  studyMinutes: z.number().int().min(30).max(60),
  focusAreas: z
    .array(z.enum(DOMAIN_SLUGS))
    .min(1)
    .max(5)
    .refine((values) => new Set(values).size === values.length, {
      message: "Focus areas must be unique.",
    }),
  confidence: z.record(z.enum(DOMAIN_SLUGS), z.number().int().min(0).max(100)).optional(),
});

export const generateQuestSchema = z.object({
  cadence: z.enum(["daily", "weekly", "monthly"]).default("daily"),
});

export const completeQuestStepSchema = z.object({
  selectedIndex: z.number().int().min(0).max(10).optional(),
  evidenceUrl: z.string().trim().url().max(2048).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export const challengeProgressSchema = z.object({
  percent: z.number().int().min(0).max(100),
  evidenceUrl: z.string().trim().url().max(2048).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const startExamSchema = z.object({
  certificationCode: z.string().trim().min(2).max(40),
  difficulty: z.number().int().min(1).max(5).default(2),
  durationMinutes: z.number().int().min(5).max(180).default(30),
});

export const submitExamSchema = z.object({
  answers: z.record(z.string().min(1), z.number().int().min(0).max(10)),
});

export const mentorMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
});
