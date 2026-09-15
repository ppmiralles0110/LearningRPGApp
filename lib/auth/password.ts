import {
  createHash,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const KEY_LENGTH = 64;

function authSecret(): string {
  const configured = process.env.AUTH_SECRET;
  if (configured && configured.length >= 32) {
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must contain at least 32 characters in production.");
  }
  return "levelup-architect-local-development-secret";
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH);
  return `scrypt:${salt}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, encoded: string): boolean {
  const [algorithm, salt, storedHex] = encoded.split(":");
  if (algorithm !== "scrypt" || !salt || !storedHex) {
    return false;
  }

  const stored = Buffer.from(storedHex, "hex");
  const candidate = scryptSync(password, salt, stored.length);
  return timingSafeEqual(stored, candidate);
}

export function createSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string): string {
  return createHmac("sha256", authSecret()).update(token).digest("hex");
}

export function stableId(value: string): string {
  return createHash("sha256").update(value).digest("hex").slice(0, 24);
}
