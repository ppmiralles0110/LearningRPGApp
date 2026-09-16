import { randomUUID } from "node:crypto";
import type { AppDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";

export interface CertificateEvidence {
  id: string;
  certificationCode: string;
  earnedOn: string;
  expiresOn: string | null;
  credentialId: string | null;
  verificationUrl: string | null;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  uploadedAt: string;
}

export interface CertificateFileRecord extends CertificateEvidence {
  userId: string;
  storedFileName: string;
  sha256: string;
}

interface CertificateRow {
  id: string;
  user_id: string;
  certification_code: string;
  earned_on: string;
  expires_on: string | null;
  credential_id: string | null;
  verification_url: string | null;
  original_file_name: string;
  stored_file_name: string;
  mime_type: string;
  file_size: number;
  sha256: string;
  uploaded_at: string;
}

function toCertificateEvidence(row: CertificateRow): CertificateEvidence {
  return {
    id: row.id,
    certificationCode: row.certification_code,
    earnedOn: row.earned_on,
    expiresOn: row.expires_on,
    credentialId: row.credential_id,
    verificationUrl: row.verification_url,
    originalFileName: row.original_file_name,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    uploadedAt: row.uploaded_at,
  };
}

export function recordCertificateEvidence(
  db: AppDatabase,
  input: {
    userId: string;
    certificationCode: string;
    earnedOn: string;
    expiresOn?: string;
    credentialId?: string;
    verificationUrl?: string;
    originalFileName: string;
    storedFileName: string;
    mimeType: string;
    fileSize: number;
    sha256: string;
    now?: Date;
  },
): { evidence: CertificateEvidence; replacedStoredFileName: string | null } {
  const certification = db
    .prepare("SELECT name FROM certifications WHERE code = ?")
    .get(input.certificationCode) as { name: string } | undefined;
  if (!certification) {
    throw new AppError(
      "Certification not found.",
      404,
      "CERTIFICATION_NOT_FOUND",
    );
  }

  const now = (input.now ?? new Date()).toISOString();

  const save = db.transaction(() => {
    const existing = db
      .prepare(
        "SELECT id, stored_file_name FROM user_certificates WHERE user_id = ? AND certification_code = ?",
      )
      .get(input.userId, input.certificationCode) as
      | { id: string; stored_file_name: string }
      | undefined;
    const id = existing?.id ?? randomUUID();
    db.prepare(`
      INSERT INTO user_certificates(
        id, user_id, certification_code, earned_on, expires_on, credential_id,
        verification_url, original_file_name, stored_file_name, mime_type,
        file_size, sha256, uploaded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, certification_code) DO UPDATE SET
        earned_on=excluded.earned_on,
        expires_on=excluded.expires_on,
        credential_id=excluded.credential_id,
        verification_url=excluded.verification_url,
        original_file_name=excluded.original_file_name,
        stored_file_name=excluded.stored_file_name,
        mime_type=excluded.mime_type,
        file_size=excluded.file_size,
        sha256=excluded.sha256,
        uploaded_at=excluded.uploaded_at
    `).run(
      id,
      input.userId,
      input.certificationCode,
      input.earnedOn,
      input.expiresOn || null,
      input.credentialId || null,
      input.verificationUrl || null,
      input.originalFileName,
      input.storedFileName,
      input.mimeType,
      input.fileSize,
      input.sha256,
      now,
    );
    db.prepare(`
      INSERT INTO user_certification_progress(
        user_id, certification_code, readiness, confidence, status, updated_at
      ) VALUES (?, ?, 100, 100, 'certified', ?)
      ON CONFLICT(user_id, certification_code) DO UPDATE SET
        readiness=100,
        confidence=100,
        status='certified',
        updated_at=excluded.updated_at
    `).run(input.userId, input.certificationCode, now);

    const xp = db
      .prepare("SELECT amount FROM xp_config WHERE source_type = 'certification'")
      .get() as { amount: number } | undefined;
    db.prepare(`
      INSERT OR IGNORE INTO xp_ledger(
        id, user_id, event_key, source_type, source_id, amount, description, created_at
      ) VALUES (?, ?, ?, 'certification', ?, ?, ?, ?)
    `).run(
      randomUUID(),
      input.userId,
      `certification:${input.certificationCode}`,
      input.certificationCode,
      xp?.amount ?? 0,
      `${certification.name} certificate recorded`,
      now,
    );
    db.prepare(`
      INSERT OR IGNORE INTO user_achievements(
        user_id, achievement_code, unlocked_at
      ) VALUES (?, 'certification-warrior', ?)
    `).run(input.userId, now);
    return {
      id,
      replacedStoredFileName:
        existing && existing.stored_file_name !== input.storedFileName
          ? existing.stored_file_name
          : null,
    };
  });
  const saved = save.immediate();

  const row = getCertificateFileRecord(db, input.userId, saved.id);
  const evidence: CertificateEvidence = {
    id: row.id,
    certificationCode: row.certificationCode,
    earnedOn: row.earnedOn,
    expiresOn: row.expiresOn,
    credentialId: row.credentialId,
    verificationUrl: row.verificationUrl,
    originalFileName: row.originalFileName,
    mimeType: row.mimeType,
    fileSize: row.fileSize,
    uploadedAt: row.uploadedAt,
  };
  return {
    evidence,
    replacedStoredFileName: saved.replacedStoredFileName,
  };
}

export function getCertificateFileRecord(
  db: AppDatabase,
  userId: string,
  evidenceId: string,
): CertificateFileRecord {
  const row = db
    .prepare(
      "SELECT * FROM user_certificates WHERE id = ? AND user_id = ?",
    )
    .get(evidenceId, userId) as CertificateRow | undefined;
  if (!row) {
    throw new AppError(
      "Certificate evidence not found.",
      404,
      "CERTIFICATE_NOT_FOUND",
    );
  }
  return {
    ...toCertificateEvidence(row),
    userId: row.user_id,
    storedFileName: row.stored_file_name,
    sha256: row.sha256,
  };
}
