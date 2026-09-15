import { NextResponse } from "next/server";
import { currentUser } from "@/lib/auth/session";
import { jsonError } from "@/lib/http";

export async function GET() {
  try {
    const user = await currentUser();
    return NextResponse.json({ user });
  } catch (error) {
    return jsonError(error);
  }
}
