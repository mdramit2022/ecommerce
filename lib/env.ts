import { z } from "zod";

/**
 * Server-side environment validation. Import `env` instead of reading `process.env`
 * directly so misconfiguration fails fast at boot with a readable message.
 *
 * Must not be imported from Client Components or from `lib/auth.config.ts` (Edge).
 */
const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  AUTH_URL: z.preprocess(emptyToUndefined, z.string().url().optional()),
  STRIPE_SECRET_KEY: z.string().startsWith("sk_"),
  STRIPE_WEBHOOK_SECRET: z.preprocess(emptyToUndefined, z.string().startsWith("whsec_").optional()),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  AUTH_GOOGLE_ID: z.preprocess(emptyToUndefined, z.string().optional()),
  AUTH_GOOGLE_SECRET: z.preprocess(emptyToUndefined, z.string().optional()),
  RESEND_API_KEY: z.preprocess(emptyToUndefined, z.string().optional()),
  EMAIL_FROM: z.preprocess(emptyToUndefined, z.string().optional()),
});

const parsed = serverSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables. See .env.example.");
}

export const env = parsed.data;
