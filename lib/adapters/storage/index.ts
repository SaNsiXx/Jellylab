import "server-only";
import { env } from "@/lib/server/env";
import { CV_MAX_BYTES, CV_TYPES } from "@/lib/forms/schemas";

export class StorageUnavailableError extends Error {}
export class InvalidFileError extends Error {
  constructor(public readonly reason: "fileType" | "fileSize") {
    super(reason);
  }
}

export interface CvStorage {
  /** Stores the CV privately and returns an opaque reference (never a public URL). */
  save(file: File, submissionId: string): Promise<string>;
}

/** Validates by declared type, size AND magic bytes (PDF "%PDF", DOCX zip "PK\x03\x04"). */
export async function validateCv(file: File): Promise<"pdf" | "docx"> {
  if (file.size > CV_MAX_BYTES) throw new InvalidFileError("fileSize");
  const ext = CV_TYPES[file.type as keyof typeof CV_TYPES];
  if (!ext) throw new InvalidFileError("fileType");
  const head = new Uint8Array(await file.slice(0, 4).arrayBuffer());
  const isPdf = head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46;
  const isZip = head[0] === 0x50 && head[1] === 0x4b && head[2] === 0x03 && head[3] === 0x04;
  if ((ext === "pdf" && !isPdf) || (ext === "docx" && !isZip)) throw new InvalidFileError("fileType");
  return ext;
}

/**
 * Mock storage: in development it accepts the file and discards it (logs size only).
 * In production it refuses, so CVs are never silently lost — configure real private storage
 * (e.g. S3/R2 with server-side encryption + malware scanning, 05_FORMS_LEGAL_CRM.md §8) first.
 */
const mock: CvStorage = {
  async save(file, id) {
    if (env.isProd) throw new StorageUnavailableError("CV storage not configured");
    const ext = await validateCv(file);
    console.info(`[storage:mock] CV accepted (${ext}, ${Math.round(file.size / 1024)} KB) — discarded in dev`);
    return `mock://cv/${id}.${ext}`;
  },
};

export function getCvStorage(): CvStorage {
  switch (env.cvStorageProvider) {
    default:
      return mock;
  }
}
