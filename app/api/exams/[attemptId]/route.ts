import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getExamAttempt } from "@/lib/services/exams";

export async function GET(
  _request: Request,
  context: { params: Promise<{ attemptId: string }> },
) {
  try {
    const { attemptId } = await context.params;
    const db = getDatabase();
    const user = await requireUser(db);
    return NextResponse.json({
      attempt: getExamAttempt(db, user.id, attemptId),
    });
  } catch (error) {
    return jsonError(error);
  }
}
