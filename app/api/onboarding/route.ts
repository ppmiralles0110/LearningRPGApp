import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { generateQuest, saveOnboarding } from "@/lib/services/learning";
import { onboardingSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = onboardingSchema.parse(await readJson(request));
    const db = getDatabase();
    const user = await requireUser(db);
    saveOnboarding(db, { userId: user.id, ...input });
    const quests = [];
    for (const cadence of ["daily", "weekly", "monthly"] as const) {
      try {
        quests.push(generateQuest(db, user.id, cadence));
      } catch (error) {
        if (error instanceof AppError && error.code === "NO_ELIGIBLE_QUEST") {
          continue;
        }
        throw error;
      }
    }
    return NextResponse.json({ success: true, quests });
  } catch (error) {
    return jsonError(error);
  }
}
