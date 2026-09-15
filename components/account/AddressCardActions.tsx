"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { deleteAddress, setDefaultAddress } from "@/app/account/addresses/actions";

export type AddressCardActionsProps = {
  id: string;
  isDefault: boolean;
};

/** Client Component: Set default / Edit / Delete controls for one saved address. */
export function AddressCardActions({ id, isDefault }: AddressCardActionsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (task: () => Promise<{ status: string; message?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await task();
      if (result.status === "error") setError(result.message ?? "Something went wrong.");
    });
  };

  const onDelete = () => {
    if (!window.confirm("Delete this address? This cannot be undone.")) return;
    run(() => deleteAddress(id));
  };

  return (
    <div className="mt-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {!isDefault && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            loading={pending}
            onClick={() => run(() => setDefaultAddress(id))}
          >
            Set default
          </Button>
        )}
        <Link
          href={`/account/addresses/${id}/edit`}
          className="inline-flex h-8 items-center justify-center rounded-lg border border-neutral-300 bg-white px-3 text-xs font-medium text-neutral-900 transition hover:border-neutral-900"
        >
          Edit
        </Link>
        <Button type="button" variant="ghost" size="sm" disabled={pending} onClick={onDelete}>
          Delete
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
}
