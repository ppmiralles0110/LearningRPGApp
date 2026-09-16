import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  readCertificateFile,
  removeCertificateFile,
  storeCertificateFile,
} from "@/lib/storage/certificate-files";

describe("certificate file storage", () => {
  const originalDirectory = process.env.CERTIFICATE_UPLOAD_DIR;
  let temporaryDirectory: string | null = null;

  afterEach(() => {
    if (originalDirectory === undefined) {
      delete process.env.CERTIFICATE_UPLOAD_DIR;
    } else {
      process.env.CERTIFICATE_UPLOAD_DIR = originalDirectory;
    }
    if (temporaryDirectory) {
      rmSync(temporaryDirectory, { recursive: true, force: true });
      temporaryDirectory = null;
    }
  });

  it("detects content by signature and stores it under a random private name", async () => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), "levelup-certificates-"));
    process.env.CERTIFICATE_UPLOAD_DIR = temporaryDirectory;
    const file = new File(
      [Buffer.from("%PDF-1.7\nsample certificate")],
      "claimed-image.png",
      { type: "image/png" },
    );

    const stored = await storeCertificateFile("learner-1", file);
    expect(stored.mimeType).toBe("application/pdf");
    expect(stored.storedFileName).toMatch(/^learner-1\/.+\.pdf$/);
    expect((await readCertificateFile(stored.storedFileName)).length).toBe(
      file.size,
    );
    await removeCertificateFile(stored.storedFileName);
    await expect(
      readCertificateFile(stored.storedFileName),
    ).rejects.toThrowError(/missing/i);
  });

  it("rejects unsupported content even when the extension looks safe", async () => {
    temporaryDirectory = mkdtempSync(path.join(tmpdir(), "levelup-certificates-"));
    process.env.CERTIFICATE_UPLOAD_DIR = temporaryDirectory;
    const file = new File([Buffer.from("<script>alert(1)</script>")], "proof.pdf", {
      type: "application/pdf",
    });

    await expect(
      storeCertificateFile("learner-1", file),
    ).rejects.toThrowError(/PDF, PNG, JPEG, or WebP/i);
  });
});
