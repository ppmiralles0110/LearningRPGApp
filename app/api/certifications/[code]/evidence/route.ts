import { NextResponse } from "next/server";
import Busboy from "busboy";
import { once } from "node:events";
import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { AppError } from "@/lib/errors";
import { assertSameOrigin, jsonError } from "@/lib/http";
import { recordCertificateEvidence } from "@/lib/services/certificates";
import {
  MAX_CERTIFICATE_FILE_BYTES,
  removeCertificateFile,
  storeCertificateFile,
} from "@/lib/storage/certificate-files";
import { certificateEvidenceSchema } from "@/lib/validation";

export const runtime = "nodejs";

const MAX_MULTIPART_OVERHEAD_BYTES = 512 * 1024;

async function readCertificateForm(request: Request): Promise<{
  fields: Record<string, string>;
  file: File | null;
}> {
  const maximumBytes =
    MAX_CERTIFICATE_FILE_BYTES + MAX_MULTIPART_OVERHEAD_BYTES;
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) {
    throw new AppError(
      "Certificate upload is larger than the allowed request size.",
      413,
      "CERTIFICATE_REQUEST_TOO_LARGE",
    );
  }
  if (!request.body) {
    throw new AppError(
      "Certificate upload body is required.",
      400,
      "CERTIFICATE_BODY_REQUIRED",
    );
  }

  const fields: Record<string, string> = {};
  let uploadedFile:
    | {
        fileName: string;
        mimeType: string;
        chunks: Buffer[];
      }
    | undefined;
  let formError: AppError | null = null;
  const parser = Busboy({
    headers: Object.fromEntries(request.headers),
    limits: {
      files: 1,
      fields: 4,
      parts: 5,
      fileSize: MAX_CERTIFICATE_FILE_BYTES,
      fieldSize: 2048,
    },
  });
  parser.on("field", (name, value, info) => {
    if (info.valueTruncated) {
      formError = new AppError(
        "Certificate metadata is too large.",
        400,
        "CERTIFICATE_METADATA_TOO_LARGE",
      );
      return;
    }
    if (
      ["earnedOn", "expiresOn", "credentialId", "verificationUrl"].includes(
        name,
      )
    ) {
      fields[name] = value;
    }
  });
  parser.on("file", (name, stream, info) => {
    if (name !== "certificate") {
      formError = new AppError(
        "Unexpected file field.",
        400,
        "INVALID_CERTIFICATE_FIELD",
      );
      stream.resume();
      return;
    }
    const chunks: Buffer[] = [];
    uploadedFile = {
      fileName: info.filename,
      mimeType: info.mimeType,
      chunks,
    };
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("limit", () => {
      formError = new AppError(
        "Certificate evidence must be no larger than 8 MB.",
        413,
        "CERTIFICATE_FILE_TOO_LARGE",
      );
    });
  });
  for (const eventName of ["filesLimit", "fieldsLimit", "partsLimit"]) {
    parser.on(eventName, () => {
      formError = new AppError(
        "Certificate upload contains too many form parts.",
        400,
        "CERTIFICATE_FORM_LIMIT_EXCEEDED",
      );
    });
  }

  const parsed = new Promise<void>((resolve, reject) => {
    parser.on("close", resolve);
    parser.on("error", reject);
  });
  const reader = request.body.getReader();
  let receivedBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      receivedBytes += value.byteLength;
      if (receivedBytes > maximumBytes) {
        await reader.cancel();
        parser.destroy();
        throw new AppError(
          "Certificate upload is larger than the allowed request size.",
          413,
          "CERTIFICATE_REQUEST_TOO_LARGE",
        );
      }
      if (!parser.write(Buffer.from(value))) {
        await once(parser, "drain");
      }
    }
    parser.end();
    await parsed;
  } catch (error) {
    parser.destroy();
    throw error;
  }
  if (formError) throw formError;
  return {
    fields,
    file: uploadedFile
      ? new File([new Uint8Array(Buffer.concat(uploadedFile.chunks))], uploadedFile.fileName, {
          type: uploadedFile.mimeType,
        })
      : null,
  };
}

export async function POST(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  let storedFileName: string | null = null;
  try {
    assertSameOrigin(request);
    const { code } = await context.params;
    const db = getDatabase();
    const user = await requireUser(db);
    if (
      !(request.headers.get("content-type") ?? "")
        .toLowerCase()
        .includes("multipart/form-data")
    ) {
      throw new AppError(
        "Content-Type must be multipart/form-data.",
        415,
        "UNSUPPORTED_MEDIA_TYPE",
      );
    }
    let parsedForm: Awaited<ReturnType<typeof readCertificateForm>>;
    try {
      parsedForm = await readCertificateForm(request);
    } catch (parseError) {
      console.error("Unable to parse certificate multipart form.", parseError);
      if (parseError instanceof AppError) throw parseError;
      throw new AppError(
        "The certificate upload form is malformed.",
        400,
        "INVALID_MULTIPART_FORM",
      );
    }
    const file = parsedForm.file;
    if (!file) {
      throw new AppError(
        "Choose a certificate file to upload.",
        400,
        "CERTIFICATE_FILE_REQUIRED",
      );
    }
    const metadata = certificateEvidenceSchema.parse({
      earnedOn: parsedForm.fields.earnedOn,
      expiresOn: parsedForm.fields.expiresOn,
      credentialId: parsedForm.fields.credentialId,
      verificationUrl: parsedForm.fields.verificationUrl,
    });
    const stored = await storeCertificateFile(user.id, file);
    storedFileName = stored.storedFileName;
    const result = recordCertificateEvidence(db, {
      userId: user.id,
      certificationCode: code,
      earnedOn: metadata.earnedOn,
      expiresOn: metadata.expiresOn || undefined,
      credentialId: metadata.credentialId || undefined,
      verificationUrl: metadata.verificationUrl || undefined,
      originalFileName: file.name,
      ...stored,
    });
    if (result.replacedStoredFileName) {
      try {
        await removeCertificateFile(result.replacedStoredFileName);
      } catch (cleanupError) {
        console.error("Unable to remove replaced certificate file.", cleanupError);
      }
    }
    return NextResponse.json({ evidence: result.evidence }, { status: 201 });
  } catch (error) {
    if (storedFileName) {
      try {
        await removeCertificateFile(storedFileName);
      } catch (cleanupError) {
        console.error("Unable to clean up rejected certificate file.", cleanupError);
      }
    }
    return jsonError(error);
  }
}
