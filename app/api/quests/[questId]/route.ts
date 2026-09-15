import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getQuest } from "@/lib/services/learning";

export async function GET(
  _request: Request,
  context: { params: Promise<{ questId: string }> },
) {
  try {
    const { questId } = await context.params;
    const db = getDatabase();
    const user = await requireUser(db);
    return NextResponse.json({ quest: getQuest(db, user.id, questId) });
  } catch (error) {
    return jsonError(error);
  }
}
