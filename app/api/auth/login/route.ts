import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import {
  assertLoginAllowed,
  authenticate,
  clearLoginFailures,
  issueSession,
  recordLoginFailure,
  setSessionCookie,
} from "@/lib/auth/session";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { generateQuest } from "@/lib/services/learning";
import { AppError } from "@/lib/errors";

function ensureStarterQuests(userId: string): void {
  const db = getDatabase();
  for (const cadence of ["daily", "weekly", "monthly"] as const) {
    try {
      generateQuest(db, userId, cadence);
    } catch (error) {
      if (error instanceof AppError && error.code === "NO_ELIGIBLE_QUEST") {
        continue;
      }
      throw error;
    }
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = loginSchema.parse(await readJson(request));
    const clientKey =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      "local";
    const rateLimitKey = `${clientKey}:${input.email.toLowerCase()}`;
    assertLoginAllowed(rateLimitKey);
    try {
      const db = getDatabase();
      const user = authenticate(db, input.email, input.password);
      clearLoginFailures(rateLimitKey);
      if (user.onboardingComplete) ensureStarterQuests(user.id);
      const session = issueSession(db, user.id);
      await setSessionCookie(session.token, session.expiresAt);
      return NextResponse.json({ user });
    } catch (error) {
      if (error instanceof AppError && error.code === "INVALID_CREDENTIALS") {
        recordLoginFailure(rateLimitKey);
      }
      throw error;
    }
  } catch (error) {
    return jsonError(error);
  }
}
