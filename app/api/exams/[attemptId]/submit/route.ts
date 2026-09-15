import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { submitExam } from "@/lib/services/exams";
import { submitExamSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    assertSameOrigin(request);
    const { attemptId } = await context.params;
    const input = submitExamSchema.parse(await readJson(request));
    const db = getDatabase();
    const user = await requireUser(db);
    const attempt = submitExam(db, {
      userId: user.id,
      attemptId,
      answers: input.answers,
    });
    return NextResponse.json({ attempt });
  } catch (error) {
    return jsonError(error);
  }
}
