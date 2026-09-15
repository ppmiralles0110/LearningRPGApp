import { NextResponse } from "next/server";
import { createUser, issueSession, setSessionCookie } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { assertSameOrigin, jsonError, readJson } from "@/lib/http";
import { registrationSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = registrationSchema.parse(await readJson(request));
    const db = getDatabase();
    const user = createUser(db, input);
    const session = issueSession(db, user.id);
    await setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
