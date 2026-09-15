import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { completeQuestStep } from "@/lib/services/learning";
import { completeQuestStepSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ questId: string; stepId: string }> },
) {
  try {
    assertSameOrigin(request);
    const { questId, stepId } = await context.params;
    const input = completeQuestStepSchema.parse(await readJson(request));
    const db = getDatabase();
    const user = await requireUser(db);
    return NextResponse.json(
      completeQuestStep(db, {
        userId: user.id,
        questId,
        stepId,
        ...input,
      }),
    );
  } catch (error) {
    return jsonError(error);
  }
}
