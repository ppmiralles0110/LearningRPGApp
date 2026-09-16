import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { AppError } from "@/lib/errors";

export const MAX_CERTIFICATE_FILE_BYTES = 8 * 1024 * 1024;

const signatures = [
  {
    mimeType: "application/pdf",
    extension: ".pdf",
    matches: (buffer: Buffer) =>
      buffer.subarray(0, 5).toString("ascii") === "%PDF-",
  },
  {
    mimeType: "image/png",
    extension: ".png",
    matches: (buffer: Buffer) =>
      buffer.subarray(0, 8).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
  },
  {
    mimeType: "image/jpeg",
    extension: ".jpg",
    matches: (buffer: Buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    mimeType: "image/webp",
    extension: ".webp",
    matches: (buffer: Buffer) =>
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP",
  },
] as const;

export function certificateUploadDirectory(): string {
  return path.resolve(
    process.env.CERTIFICATE_UPLOAD_DIR ??
      path.join(process.cwd(), "data", "certificates"),
  );
}

function resolveStoredFile(storedFileName: string): string {
  const root = certificateUploadDirectory();
  const resolved = path.resolve(root, ...storedFileName.split("/"));
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw new AppError(
      "Certificate file path is invalid.",
      500,
      "INVALID_CERTIFICATE_PATH",
    );
  }
  return resolved;
}

export async function storeCertificateFile(
  userId: string,
  file: File,
): Promise<{
  storedFileName: string;
  mimeType: string;
  fileSize: number;
  sha256: string;
}> {
  if (file.size === 0 || file.size > MAX_CERTIFICATE_FILE_BYTES) {
    throw new AppError(
      "Certificate evidence must be a non-empty file no larger than 8 MB.",
      400,
      "CERTIFICATE_FILE_SIZE_INVALID",
    );
  }
  if (file.name.length > 255) {
    throw new AppError(
      "Certificate file name is too long.",
      400,
      "CERTIFICATE_FILE_NAME_INVALID",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const signature = signatures.find((candidate) => candidate.matches(buffer));
  if (!signature) {
    throw new AppError(
      "Certificate evidence must be a PDF, PNG, JPEG, or WebP file.",
      415,
      "CERTIFICATE_FILE_TYPE_INVALID",
    );
  }

  const safeUserDirectory = path.basename(userId);
  const storedFileName = `${safeUserDirectory}/${randomUUID()}${signature.extension}`;
  const destination = resolveStoredFile(storedFileName);
  await mkdir(path.dirname(destination), { recursive: true });
  await writeFile(destination, buffer, { flag: "wx" });
  return {
    storedFileName,
    mimeType: signature.mimeType,
    fileSize: buffer.length,
    sha256: createHash("sha256").update(buffer).digest("hex"),
  };
}

export async function readCertificateFile(
  storedFileName: string,
): Promise<Buffer> {
  try {
    return await readFile(resolveStoredFile(storedFileName));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      throw new AppError(
        "The certificate file is missing from local storage.",
        404,
        "CERTIFICATE_FILE_MISSING",
      );
    }
    throw error;
  }
}

export async function removeCertificateFile(
  storedFileName: string,
): Promise<void> {
  try {
    await unlink(resolveStoredFile(storedFileName));
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return;
    }
    throw error;
  }
}
