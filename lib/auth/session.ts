import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db";
import { getDatabase } from "@/lib/db";
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword,
} from "@/lib/auth/password";
import { AppError } from "@/lib/errors";
import type { UserRole } from "@/lib/domain/types";

const COOKIE_NAME = "levelup_session";
const SESSION_DAYS = 14;

function sessionCookieSecure(): boolean {
  const override = process.env.SESSION_COOKIE_SECURE;
  if (override === "true") return true;
  if (override === "false") return false;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    try {
      return new URL(appUrl).protocol === "https:";
    } catch {
      throw new Error("NEXT_PUBLIC_APP_URL must be a valid absolute URL.");
    }
  }
  return process.env.NODE_ENV === "production";
}

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  onboardingComplete: boolean;
  studyMinutes: number;
}

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  onboarding_complete: number;
  study_minutes: number;
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();

export function assertLoginAllowed(key: string): void {
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 0, resetAt: now + 15 * 60_000 });
    return;
  }
  if (current.count >= 5) {
    throw new AppError(
      "Too many login attempts. Try again after 15 minutes.",
      429,
      "LOGIN_RATE_LIMITED",
    );
  }
}

export function recordLoginFailure(key: string): void {
  const now = Date.now();
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60_000 });
    return;
  }
  current.count += 1;
}

export function clearLoginFailures(key: string): void {
  loginAttempts.delete(key);
}

export function createUser(
  db: AppDatabase,
  input: { email: string; password: string; displayName: string },
): SessionUser {
  const now = new Date().toISOString();
  const id = randomUUID();
  try {
    db.prepare(`
      INSERT INTO users(
        id, email, password_hash, display_name, role, onboarding_complete,
        study_minutes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, 'learner', 0, 45, ?, ?)
    `).run(
      id,
      input.email.toLowerCase(),
      hashPassword(input.password),
      input.displayName,
      now,
      now,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new AppError("An account with this email already exists.", 409, "EMAIL_EXISTS");
    }
    throw error;
  }

  return {
    id,
    email: input.email.toLowerCase(),
    displayName: input.displayName,
    role: "learner",
    onboardingComplete: false,
    studyMinutes: 45,
  };
}

export function authenticate(
  db: AppDatabase,
  email: string,
  password: string,
): SessionUser {
  const row = db
    .prepare(`
      SELECT id, email, password_hash, display_name, role, onboarding_complete, study_minutes
      FROM users
      WHERE email = ?
    `)
    .get(email.toLowerCase()) as (UserRow & { password_hash: string }) | undefined;

  if (!row || !verifyPassword(password, row.password_hash)) {
    throw new AppError("Email or password is incorrect.", 401, "INVALID_CREDENTIALS");
  }
  return toSessionUser(row);
}

export function issueSession(
  db: AppDatabase,
  userId: string,
): { token: string; expiresAt: Date } {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60_000);
  db.prepare(`
    INSERT INTO sessions(token_hash, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `).run(
    hashSessionToken(token),
    userId,
    expiresAt.toISOString(),
    new Date().toISOString(),
  );
  return { token, expiresAt };
}

export async function setSessionCookie(
  token: string,
  expiresAt: Date,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: sessionCookieSecure(),
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(db = getDatabase()): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(
      hashSessionToken(token),
    );
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function currentUser(
  db = getDatabase(),
): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const now = new Date().toISOString();
  const row = db
    .prepare(`
      SELECT u.id, u.email, u.display_name, u.role, u.onboarding_complete, u.study_minutes
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token_hash = ? AND s.expires_at > ?
    `)
    .get(hashSessionToken(token), now) as UserRow | undefined;

  return row ? toSessionUser(row) : null;
}

export async function requireUser(db = getDatabase()): Promise<SessionUser> {
  const user = await currentUser(db);
  if (!user) {
    throw new AppError("Authentication is required.", 401, "AUTH_REQUIRED");
  }
  return user;
}

export async function requireRole(
  roles: UserRole[],
  db = getDatabase(),
): Promise<SessionUser> {
  const user = await requireUser(db);
  if (!roles.includes(user.role)) {
    throw new AppError("You do not have permission for this action.", 403, "FORBIDDEN");
  }
  return user;
}

function toSessionUser(row: UserRow): SessionUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    role: row.role,
    onboardingComplete: row.onboarding_complete === 1,
    studyMinutes: row.study_minutes,
  };
}
