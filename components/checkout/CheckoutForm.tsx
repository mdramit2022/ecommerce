"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { PaymentMethod } from "@prisma/client";
import { Alert, type AlertTone } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Card, EmptyState } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Input";
import { Field } from "@/components/ui/Label";
import { PaymentMethodSelect } from "@/components/checkout/PaymentMethodSelect";
import type { AddressData } from "@/lib/account/addresses";
import { startCheckout, type CheckoutFieldErrors } from "@/lib/cart/client";
import { DEFAULT_SHIPPING_COUNTRY, SHIPPING_COUNTRIES } from "@/lib/payments/countries";
import { getPaymentMethod, type PaymentMethodConfig } from "@/lib/payments/methods";
import { selectItemCount, selectSubtotal, useCart } from "@/lib/store/useCart";
import { useHydrated } from "@/lib/store/useHydrated";
import { formatPrice } from "@/lib/utils";

export type CheckoutFormProps = {
  /** Methods this deployment can accept, from `listPaymentMethods` on the server. */
  methods: PaymentMethodConfig[];
  defaultMethod: PaymentMethod;
  defaultEmail: string;
  signedIn: boolean;
  /** Saved addresses of the signed-in customer, newest default first. Empty for guests. */
  addresses: AddressData[];
};

type ShippingFields = {
  fullName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
};

type Notice = { tone: AlertTone; title?: string; message: string };

const EMPTY_SHIPPING: ShippingFields = {
  fullName: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  country: DEFAULT_SHIPPING_COUNTRY,
  phone: "",
};

function shippingFromAddress(address: AddressData): ShippingFields {
  return {
    fullName: address.fullName,
    line1: address.line1,
    line2: address.line2 ?? "",
    city: address.city,
    state: address.state ?? "",
    postalCode: address.postalCode,
    country: address.country,
    phone: address.phone ?? "",
  };
}

const linkButton =
  "inline-flex h-10 items-center justify-center rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition hover:bg-neutral-700";

/**
 * Client Component: the whole checkout. The cart lives in the persisted Zustand store, so the
 * page cannot be rendered on the server; contact details, the shipping address and the payment
 * method are collected here and posted to `POST /api/checkout`.
 *
 * Card payments hand off to Stripe; every other method places the order immediately and lands on
 * the confirmation page with the instructions for paying.
 */
export function CheckoutForm({
  methods,
  defaultMethod,
  defaultEmail,
  signedIn,
  addresses,
}: CheckoutFormProps) {
  const hydrated = useHydrated();
  const items = useCart((state) => state.items);
  const itemCount = useCart(selectItemCount);
  const subtotal = useCart(selectSubtotal);
  const setStock = useCart((state) => state.setStock);
  const removeItem = useCart((state) => state.removeItem);

  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0] ?? null;

  const [email, setEmail] = useState(defaultEmail);
  const [shipping, setShipping] = useState<ShippingFields>(
    defaultAddress ? shippingFromAddress(defaultAddress) : EMPTY_SHIPPING,
  );
  const [addressId, setAddressId] = useState(defaultAddress?.id ?? "");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(defaultMethod);
  const [reference, setReference] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});

  const selectedMethod = getPaymentMethod(paymentMethod);
  const outOfStockLines = items.filter((line) => line.stock <= 0);
  const canSubmit = hydrated && items.length > 0 && outOfStockLines.length === 0 && !pending;

  const errorOf = (key: string): string | undefined => fieldErrors[key]?.[0];
  const setField = (key: keyof ShippingFields, value: string) =>
    setShipping((current) => ({ ...current, [key]: value }));

  const titleOf = (productId: string): string =>
    items.find((line) => line.productId === productId)?.title ?? "An item";

  const applySavedAddress = (id: string) => {
    setAddressId(id);
    const address = addresses.find((entry) => entry.id === id);
    setShipping(address ? shippingFromAddress(address) : EMPTY_SHIPPING);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setPending(true);
    setNotice(null);
    setFieldErrors({});

    const outcome = await startCheckout(items, {
      email: email.trim(),
      shipping: {
        fullName: shipping.fullName.trim(),
        line1: shipping.line1.trim(),
        line2: shipping.line2.trim() || undefined,
        city: shipping.city.trim(),
        state: shipping.state.trim() || undefined,
        postalCode: shipping.postalCode.trim(),
        country: shipping.country.trim().toUpperCase(),
        phone: shipping.phone.trim(),
      },
      paymentMethod,
      ...(selectedMethod.requiresReference ? { paymentReference: reference.trim() } : {}),
      saveAddress: signedIn && saveAddress,
    });

    switch (outcome.kind) {
      case "redirect":
      case "placed":
        // Keep the spinner on while the browser navigates away.
        window.location.assign(outcome.kind === "redirect" ? outcome.url : outcome.redirectTo);
        return;

      case "invalid":
        setFieldErrors(outcome.fieldErrors);
        setNotice({ tone: "danger", message: outcome.message });
        break;

      case "payments-unavailable":
        setNotice({
          tone: "warning",
          title: "Payment method unavailable",
          message: outcome.message,
        });
        break;

      case "insufficient-stock": {
        const changes = outcome.items.map((issue) => {
          const title = issue.title ?? titleOf(issue.productId);
          setStock(issue.productId, issue.available);
          return issue.available > 0
            ? `${title} (reduced to ${issue.available})`
            : `${title} (sold out, removed)`;
        });
        setNotice({
          tone: "warning",
          title: "Some quantities were adjusted",
          message: `Stock changed while you were checking out: ${changes.join(", ")}. Review your order and place it again.`,
        });
        break;
      }

      case "unavailable": {
        const titles = outcome.productIds.map(titleOf);
        outcome.productIds.forEach(removeItem);
        setNotice({
          tone: "warning",
          title: "Some items are no longer available",
          message: `${titles.join(", ")} ${titles.length === 1 ? "was" : "were"} removed from your order.`,
        });
        break;
      }

      case "error":
        setNotice({ tone: "danger", message: outcome.message });
        break;
    }

    setPending(false);
  };

  if (!hydrated) return <CheckoutSkeleton />;

  if (items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add something to your cart before checking out."
        action={
          <Link href="/" className={linkButton}>
            Browse products
          </Link>
        }
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"
    >
      <div className="space-y-6">
        {notice && (
          <Alert tone={notice.tone} title={notice.title}>
            {notice.message}
          </Alert>
        )}

        {outOfStockLines.length > 0 && (
          <Alert tone="danger" title="Remove sold-out items">
            {outOfStockLines.map((line) => line.title).join(", ")} sold out.{" "}
            <Link href="/cart" className="underline">
              Update your cart
            </Link>{" "}
            to continue.
          </Alert>
        )}

        <Card>
          <h2 className="text-base font-semibold text-neutral-900">Contact</h2>
          <p className="mt-1 text-sm text-neutral-500">
            We send the order confirmation and delivery updates here.
          </p>
          <div className="mt-4">
            <Field id="email" label="Email" required error={errorOf("email")}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                aria-invalid={Boolean(errorOf("email")) || undefined}
              />
            </Field>
          </div>
          {!signedIn && (
            <p className="mt-3 text-sm text-neutral-500">
              Checking out as a guest.{" "}
              <Link href="/sign-in?callbackUrl=/checkout" className="underline">
                Sign in
              </Link>{" "}
              to save this order to your account.
            </p>
          )}
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-neutral-900">Shipping address</h2>

          {addresses.length > 0 && (
            <div className="mt-4">
              <Field id="savedAddress" label="Use a saved address">
                <Select
                  id="savedAddress"
                  value={addressId}
                  onChange={(event) => applySavedAddress(event.target.value)}
                >
                  <option value="">Enter a new address</option>
                  {addresses.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.fullName} - {address.line1}, {address.city}
                      {address.isDefault ? " (default)" : ""}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          )}

          <div className="mt-4 space-y-4">
            <Field id="fullName" label="Full name" required error={errorOf("shipping.fullName")}>
              <Input
                id="fullName"
                autoComplete="name"
                required
                value={shipping.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                aria-invalid={Boolean(errorOf("shipping.fullName")) || undefined}
              />
            </Field>

            <Field id="line1" label="Street address" required error={errorOf("shipping.line1")}>
              <Input
                id="line1"
                autoComplete="address-line1"
                required
                value={shipping.line1}
                onChange={(event) => setField("line1", event.target.value)}
                aria-invalid={Boolean(errorOf("shipping.line1")) || undefined}
              />
            </Field>

            <Field
              id="line2"
              label="Apartment, suite, landmark"
              error={errorOf("shipping.line2")}
              hint="Optional"
            >
              <Input
                id="line2"
                autoComplete="address-line2"
                value={shipping.line2}
                onChange={(event) => setField("line2", event.target.value)}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="city" label="City" required error={errorOf("shipping.city")}>
                <Input
                  id="city"
                  autoComplete="address-level2"
                  required
                  value={shipping.city}
                  onChange={(event) => setField("city", event.target.value)}
                  aria-invalid={Boolean(errorOf("shipping.city")) || undefined}
                />
              </Field>
              <Field
                id="state"
                label="State / Province"
                error={errorOf("shipping.state")}
                hint="Optional"
              >
                <Input
                  id="state"
                  autoComplete="address-level1"
                  value={shipping.state}
                  onChange={(event) => setField("state", event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="postalCode"
                label="Postal code"
                required
                error={errorOf("shipping.postalCode")}
              >
                <Input
                  id="postalCode"
                  autoComplete="postal-code"
                  required
                  value={shipping.postalCode}
                  onChange={(event) => setField("postalCode", event.target.value)}
                  aria-invalid={Boolean(errorOf("shipping.postalCode")) || undefined}
                />
              </Field>
              <Field id="country" label="Country" required error={errorOf("shipping.country")}>
                <Select
                  id="country"
                  autoComplete="country"
                  value={shipping.country}
                  onChange={(event) => setField("country", event.target.value)}
                >
                  {SHIPPING_COUNTRIES.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field
              id="phone"
              label="Phone"
              required
              error={errorOf("shipping.phone")}
              hint="Our courier calls this number before delivery"
            >
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                required
                value={shipping.phone}
                onChange={(event) => setField("phone", event.target.value)}
                aria-invalid={Boolean(errorOf("shipping.phone")) || undefined}
              />
            </Field>

            {signedIn && (
              <label className="flex items-start gap-3 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-neutral-300 accent-neutral-900"
                  checked={saveAddress}
                  onChange={(event) => setSaveAddress(event.target.checked)}
                />
                <span>Save this address to my address book</span>
              </label>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-base font-semibold text-neutral-900">Payment method</h2>
          <p className="mt-1 mb-4 text-sm text-neutral-500">
            Choose how you want to pay for this order.
          </p>
          <PaymentMethodSelect
            methods={methods}
            value={paymentMethod}
            onChange={(value) => {
              setPaymentMethod(value);
              setReference("");
              setFieldErrors({});
            }}
            reference={reference}
            onReferenceChange={setReference}
            referenceError={errorOf("paymentReference")}
            disabled={pending}
          />
        </Card>
      </div>

      <Card className="p-0 lg:sticky lg:top-6">
        <h2 className="border-b border-neutral-200 px-5 py-4 text-base font-semibold text-neutral-900">
          Order summary
        </h2>

        <ul className="divide-y divide-neutral-100">
          {items.map((line) => (
            <li key={line.productId} className="flex items-center gap-3 px-5 py-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                {line.image ? (
                  <Image src={line.image} alt="" fill sizes="48px" className="object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-neutral-900">{line.title}</p>
                <p className="text-xs text-neutral-500">
                  {formatPrice(line.price)} x {line.quantity}
                </p>
              </div>
              <p className="shrink-0 text-sm font-medium text-neutral-900 tabular-nums">
                {formatPrice(Math.round(line.price * line.quantity * 100) / 100)}
              </p>
            </li>
          ))}
        </ul>

        <dl className="space-y-2 border-t border-neutral-200 px-5 py-4 text-sm">
          <div className="flex justify-between text-neutral-600">
            <dt>
              Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
            </dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-neutral-600">
            <dt>Shipping</dt>
            <dd>Free</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-semibold text-neutral-900">
            <dt>Total</dt>
            <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
          </div>
        </dl>

        <div className="border-t border-neutral-200 px-5 py-4">
          <p className="mb-3 text-sm text-neutral-500">
            Paying with <span className="font-medium text-neutral-800">{selectedMethod.label}</span>
          </p>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!canSubmit}
            loading={pending}
          >
            {selectedMethod.manual ? "Place order" : "Continue to payment"}
          </Button>
          <p className="mt-3 text-center text-xs text-neutral-500">
            <Link href="/cart" className="hover:underline">
              Back to cart
            </Link>
          </p>
        </div>
      </Card>
    </form>
  );
}

function CheckoutSkeleton() {
  return (
    <div
      className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start"
      aria-busy="true"
      aria-label="Loading checkout"
    >
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-xl border border-neutral-200 bg-white"
          />
        ))}
      </div>
      <div className="h-80 animate-pulse rounded-xl border border-neutral-200 bg-white" />
    </div>
  );
}
