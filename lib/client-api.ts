"use client";

export class ClientApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const bodyIsFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;
  const response = await fetch(input, {
    ...init,
    headers: {
      ...(init?.body && !bodyIsFormData
        ? { "content-type": "application/json" }
        : {}),
      ...init?.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as
    | T
    | { error?: { code?: string; message?: string } }
    | null;
  if (!response.ok) {
    const error =
      payload &&
      typeof payload === "object" &&
      "error" in payload &&
      payload.error
        ? payload.error
        : undefined;
    throw new ClientApiError(
      error?.message ?? `Request failed with status ${response.status}.`,
      error?.code ?? "REQUEST_FAILED",
      response.status,
    );
  }
  return payload as T;
}
