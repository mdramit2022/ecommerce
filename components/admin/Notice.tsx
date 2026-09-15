import { Alert } from "@/components/ui/Alert";

export type NoticeProps = {
  notice?: string;
  error?: string;
};

/** Renders flash-style messages passed via `?notice=` / `?error=` after a redirecting Server Action. */
export function Notice({ notice, error }: NoticeProps) {
  if (!notice && !error) return null;
  return (
    <div className="mb-6 flex flex-col gap-3">
      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  );
}
