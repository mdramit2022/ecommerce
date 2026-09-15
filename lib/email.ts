import { Resend } from "resend";
import { env } from "@/lib/env";

/**
 * Transactional email via Resend. Server only.
 * When RESEND_API_KEY is not configured, sends are logged and skipped so local
 * development works without an account.
 */
const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export const isEmailConfigured = resend !== null;

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = { sent: true; id: string | null } | { sent: false; reason: string };

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  if (!resend) {
    console.info(
      `[email] skipped (RESEND_API_KEY not set): "${input.subject}" -> ${String(input.to)}`,
    );
    return { sent: false, reason: "not-configured" };
  }

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM ?? "Ecommerce <onboarding@resend.dev>",
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
  });

  if (error) {
    console.error("[email] send failed", error);
    return { sent: false, reason: error.message };
  }

  return { sent: true, id: data?.id ?? null };
}
