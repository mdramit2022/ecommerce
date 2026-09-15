"use client";

import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { Input } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";

export type ImageFieldProps = {
  id: string;
  /** Form field name the URL is submitted under. */
  name: string;
  label: string;
  value: string;
  onChange: (url: string) => void;
  required?: boolean;
  error?: string | string[];
  hint?: string;
  /** Preview box shape, e.g. "aspect-[16/6]" for wide banners. */
  previewClassName?: string;
};

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/gif";

/** Narrow the JSON returned by POST /api/upload without `any`. */
function readUploadResponse(json: unknown): { url?: string; error?: string } {
  if (typeof json !== "object" || json === null) return {};
  const body = json as Record<string, unknown>;
  const data = body.data;
  const url =
    typeof data === "object" &&
    data !== null &&
    typeof (data as Record<string, unknown>).url === "string"
      ? String((data as Record<string, unknown>).url)
      : undefined;
  const error = typeof body.error === "string" ? body.error : undefined;
  return { url, error };
}

/**
 * Client Component: one image for a record - paste a URL or upload a file (POST /api/upload).
 * The URL input carries the form field; the file input deliberately has no `name`, so the file
 * itself never travels inside the Server Action payload.
 */
export function ImageField({
  id,
  name,
  label,
  value,
  onChange,
  required = false,
  error,
  hint,
  previewClassName = "aspect-[16/7]",
}: ImageFieldProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/upload", { method: "POST", body });
      const json: unknown = await response.json().catch(() => null);
      const { url, error: message } = readUploadResponse(json);
      if (!response.ok || !url) {
        setUploadError(message ?? "Upload failed. Please try again.");
        return;
      }
      onChange(url);
    } catch {
      setUploadError("Upload failed. Please check your connection and try again.");
    } finally {
      setUploading(false);
      input.value = "";
    }
  };

  return (
    <Field
      id={id}
      label={label}
      required={required}
      error={error ?? uploadError ?? undefined}
      hint={hint ?? "Paste an https:// image URL or upload a JPEG, PNG, WebP or GIF up to 5 MB."}
    >
      <div className="flex flex-col gap-3">
        {value ? (
          <div
            className={`relative w-full overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 ${previewClassName}`}
          >
            <Image src={value} alt="" fill unoptimized className="object-cover" />
          </div>
        ) : (
          <div
            className={`flex w-full items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-neutral-50 text-xs text-neutral-400 ${previewClassName}`}
          >
            No image yet
          </div>
        )}
        <Input
          id={id}
          name={name}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://example.com/banner.jpg"
          required={required}
          aria-invalid={error ? true : undefined}
        />
        <label className="flex flex-col gap-1 text-sm text-neutral-800">
          <span className="font-medium">Upload image</span>
          <input
            type="file"
            accept={ACCEPTED_TYPES}
            onChange={handleUpload}
            disabled={uploading}
            className="block w-full text-xs text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-xs file:font-medium file:text-neutral-800 hover:file:bg-neutral-200 disabled:opacity-60"
          />
          {uploading && <span className="text-xs text-neutral-500">Uploading...</span>}
        </label>
      </div>
    </Field>
  );
}
