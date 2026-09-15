import { googleSignInAction } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/Button";

export type GoogleSignInFormProps = {
  /** Safe, same-site path to land on after the OAuth round-trip. */
  callbackUrl: string;
};

/**
 * Server Component. Renders a divider plus a "Continue with Google" button that posts to a
 * Server Action. Only render this when `env.AUTH_GOOGLE_ID` is configured.
 */
export function GoogleSignInForm({ callbackUrl }: GoogleSignInFormProps) {
  return (
    <div className="mt-6">
      <div className="relative mb-6">
        <div aria-hidden="true" className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-2 text-xs tracking-wide text-neutral-500 uppercase">or</span>
        </div>
      </div>

      <form action={googleSignInAction}>
        <input type="hidden" name="callbackUrl" value={callbackUrl} />
        <Button type="submit" variant="outline" className="w-full">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
            <path
              fill="#EA4335"
              d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.8-5.5 3.8-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.9 1.5l2.6-2.5C16.9 3.1 14.7 2 12 2 6.5 2 2 6.5 2 12s4.5 10 10 10c5.8 0 9.6-4.1 9.6-9.8 0-.7-.1-1.2-.2-1.7H12z"
            />
          </svg>
          Continue with Google
        </Button>
      </form>
    </div>
  );
}
