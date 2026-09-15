import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";

export function GET() {
  const db = getDatabase();
  db.prepare("SELECT 1").get();
  return NextResponse.json({
    status: "ok",
    database: "connected",
    timestamp: new Date().toISOString(),
  });
}
