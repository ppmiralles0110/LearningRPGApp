import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { updateChallenge } from "@/lib/services/learning";
import { challengeProgressSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ templateId: string }> },
) {
  try {
    assertSameOrigin(request);
    const { templateId } = await context.params;
    const input = challengeProgressSchema.parse(await readJson(request));
    const db = getDatabase();
    const user = await requireUser(db);
    updateChallenge(db, {
      userId: user.id,
      templateId,
      ...input,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
