import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";

export function jsonError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
      },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "The request contains invalid values.",
          details: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  console.error(error);
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
      },
    },
    { status: 500 },
  );
}

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    return;
  }
  const expected = new URL(request.url).origin;
  if (origin !== expected) {
    throw new AppError("Cross-origin state changes are not allowed.", 403, "INVALID_ORIGIN");
  }
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new AppError("Content-Type must be application/json.", 415, "UNSUPPORTED_MEDIA_TYPE");
  }
  try {
    return await request.json();
  } catch {
    throw new AppError("Request body must contain valid JSON.", 400, "INVALID_JSON");
  }
}
