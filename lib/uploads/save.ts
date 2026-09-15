import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ZodIssue } from "zod";
import {
  type AllowedImageType,
  IMAGE_EXTENSIONS,
  uploadFileSchema,
} from "@/lib/validations/upload";

/**
 * Local-disk upload storage.
 *
 * Files are written to `public/uploads/` and served by Next.js as static assets under `/uploads/*`.
 * This is intended for local development and single-server deployments only: on serverless hosts
 * (Vercel, Lambda, ...) the filesystem is ephemeral or read-only. Swap this module for an object
 * store (S3, R2, UploadThing, Vercel Blob) and keep the `{ url, size, type }` result shape.
 */
export const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
export const UPLOAD_PUBLIC_PREFIX = "/uploads";

export type SavedUpload = { url: string; size: number; type: AllowedImageType };

export type SaveUploadResult =
  { ok: true; data: SavedUpload } | { ok: false; error: string; issues?: ZodIssue[] };

/** Detect the real image type from magic bytes so a renamed binary cannot pass as an image. */
export function sniffImageType(bytes: Uint8Array): AllowedImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x38
  ) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

/** Validate and persist an uploaded image. Never trusts the client-declared MIME type alone. */
export async function saveUpload(file: File): Promise<SaveUploadResult> {
  const parsed = uploadFileSchema.safeParse({ name: file.name, type: file.type, size: file.size });
  if (!parsed.success) {
    return { ok: false, error: "Invalid file", issues: parsed.error.issues };
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);
  if (sniffed !== parsed.data.type) {
    return { ok: false, error: "File content does not match its declared image type" };
  }

  const fileName = `${randomUUID()}.${IMAGE_EXTENSIONS[parsed.data.type]}`;
  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, fileName), bytes);

  return {
    ok: true,
    data: {
      url: `${UPLOAD_PUBLIC_PREFIX}/${fileName}`,
      size: bytes.byteLength,
      type: parsed.data.type,
    },
  };
}
