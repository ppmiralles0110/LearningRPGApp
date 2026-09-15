import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { generateQuest, listQuests } from "@/lib/services/learning";
import { generateQuestSchema } from "@/lib/validation";

export async function GET() {
  try {
    const db = getDatabase();
    const user = await requireUser(db);
    return NextResponse.json({ quests: listQuests(db, user.id) });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = generateQuestSchema.parse(await readJson(request));
    const db = getDatabase();
    const user = await requireUser(db);
    const quest = generateQuest(db, user.id, input.cadence);
    return NextResponse.json({ quest }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
