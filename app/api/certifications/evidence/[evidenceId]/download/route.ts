import { requireUser } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";
import { jsonError } from "@/lib/http";
import { getCertificateFileRecord } from "@/lib/services/certificates";
import { readCertificateFile } from "@/lib/storage/certificate-files";

export const runtime = "nodejs";

function safeDownloadName(fileName: string): string {
  return fileName.replace(/[\r\n"\\]/g, "_").slice(0, 180) || "certificate";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ evidenceId: string }> },
) {
  try {
    const { evidenceId } = await context.params;
    const db = getDatabase();
    const user = await requireUser(db);
    const evidence = getCertificateFileRecord(db, user.id, evidenceId);
    const file = await readCertificateFile(evidence.storedFileName);
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": evidence.mimeType,
        "Content-Length": String(file.length),
        "Content-Disposition": `attachment; filename="${safeDownloadName(evidence.originalFileName)}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    return jsonError(error);
  }
}
