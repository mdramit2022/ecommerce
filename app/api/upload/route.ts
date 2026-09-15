import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { saveUpload } from "@/lib/uploads/save";
import { MAX_UPLOAD_BYTES } from "@/lib/validations/upload";

/**
 * POST /api/upload  (admin only)
 * multipart/form-data with a single "file" field (JPEG/PNG/WebP/GIF, <= 5 MB).
 * Returns 201 { data: { url: "/uploads/<name>", size, type } }.
 *
 * Writes to the local filesystem via node:fs, so it must run on the Node.js runtime.
 * NOTE: this stores files in public/uploads for local / single-server use. On serverless hosts
 * (Vercel, Lambda, ...) the filesystem is ephemeral - swap lib/uploads/save.ts for S3, R2,
 * UploadThing or Vercel Blob and keep the same response shape.
 */
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.error }, { status: guard.status });
  }

  // Cheap early rejection before buffering an oversized body (multipart overhead allowance: 64 KB).
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_UPLOAD_BYTES + 64 * 1024) {
    return NextResponse.json({ error: "File must be 5 MB or smaller" }, { status: 413 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: 'Expected multipart/form-data with a "file" field' },
      { status: 400 },
    );
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Missing "file" field' }, { status: 400 });
  }

  try {
    const result = await saveUpload(file);
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, ...(result.issues ? { issues: result.issues } : {}) },
        { status: 400 },
      );
    }
    return NextResponse.json({ data: result.data }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/upload]", error);
    return NextResponse.json({ error: "Failed to store upload" }, { status: 500 });
  }
}
