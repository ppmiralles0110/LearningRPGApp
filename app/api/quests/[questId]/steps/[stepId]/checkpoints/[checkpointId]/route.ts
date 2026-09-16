import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { setQuestGuideCheckpoint } from "@/lib/services/learning";
import { guideCheckpointSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      questId: string;
      stepId: string;
      checkpointId: string;
    }>;
  },
) {
  try {
    assertSameOrigin(request);
    const { questId, stepId, checkpointId } = await context.params;
    const input = guideCheckpointSchema.parse(await readJson(request));
    const db = getDatabase();
    const user = await requireUser(db);
    return NextResponse.json({
      quest: setQuestGuideCheckpoint(db, {
        userId: user.id,
        questId,
        stepId,
        checkpointId,
        completed: input.completed,
      }),
    });
  } catch (error) {
    return jsonError(error);
  }
}
