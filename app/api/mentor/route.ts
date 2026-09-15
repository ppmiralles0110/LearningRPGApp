import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { askMentor, mentorHistory } from "@/lib/services/mentor";
import { mentorMessageSchema } from "@/lib/validation";

export async function GET() {
  try {
    const db = getDatabase();
    const user = await requireUser(db);
    return NextResponse.json({ messages: mentorHistory(db, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = mentorMessageSchema.parse(await readJson(request));
    const db = getDatabase();
    const user = await requireUser(db);
    const result = await askMentor(db, user.id, input.message);
    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error);
  }
}
