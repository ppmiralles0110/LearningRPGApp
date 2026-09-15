import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { startExam } from "@/lib/services/exams";
import { startExamSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = startExamSchema.parse(await readJson(request));
    const db = getDatabase();
    const user = await requireUser(db);
    const attempt = startExam(db, {
      userId: user.id,
      ...input,
    });
    return NextResponse.json({ attempt }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
