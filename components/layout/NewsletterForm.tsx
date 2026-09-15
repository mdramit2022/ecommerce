"use client";

import { useState, type FormEvent } from "react";

/**
 * Client Component: footer newsletter box. There is no mailing-list provider wired up yet, so a
 * valid address is acknowledged locally and nothing is sent anywhere - the form says so.
 */
export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "invalid" | "done">("idle");

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setState("invalid");
      return;
    }
    setState("done");
    setEmail("");
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex overflow-hidden rounded-md bg-white">
        <input
          id="newsletter-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (state !== "idle") setState("idle");
          }}
          placeholder="Your email address"
          aria-invalid={state === "invalid" || undefined}
          className="min-w-0 flex-1 bg-transparent px-3 text-sm text-neutral-900 outline-none placeholder:text-neutral-400"
        />
        <button
          type="submit"
          className="bg-brand-blue hover:bg-brand-blue-dark shrink-0 px-4 py-2 text-sm font-semibold text-white transition"
        >
          Subscribe
        </button>
      </div>
      {state === "invalid" && (
        <p role="alert" className="text-xs text-rose-300">
          Enter a valid email address.
        </p>
      )}
      {state === "done" && (
        <p role="status" className="text-xs text-emerald-300">
          Thanks! Newsletter sign-up is not connected to a mailing list yet, so nothing was sent.
        </p>
      )}
    </form>
  );
}
