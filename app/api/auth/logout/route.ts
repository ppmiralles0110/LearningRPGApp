import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";
import { assertSameOrigin, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await clearSessionCookie();
    return NextResponse.json({ success: true });
  } catch (error) {
    return jsonError(error);
  }
}
