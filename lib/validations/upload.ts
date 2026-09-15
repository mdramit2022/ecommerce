import { z } from "zod";

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

/** 5 MB */
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export const IMAGE_EXTENSIONS: Record<AllowedImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

/** Metadata of a file received by POST /api/upload. */
export const uploadFileSchema = z.object({
  name: z.string().max(255).optional(),
  type: z.enum(ALLOWED_IMAGE_TYPES, {
    errorMap: () => ({ message: "Only JPEG, PNG, WebP and GIF images are allowed" }),
  }),
  size: z
    .number()
    .int()
    .positive("File is empty")
    .max(MAX_UPLOAD_BYTES, "File must be 5 MB or smaller"),
});
export type UploadFileInput = z.infer<typeof uploadFileSchema>;
