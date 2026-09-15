import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getDashboard } from "@/lib/services/dashboard";

export async function GET() {
  try {
    const db = getDatabase();
    const user = await requireUser(db);
    return NextResponse.json(getDashboard(db, user.id));
  } catch (error) {
    return jsonError(error);
  }
}
