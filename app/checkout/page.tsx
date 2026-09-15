import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { listUserAddresses } from "@/lib/account/addresses";
import { defaultPaymentMethod, listPaymentMethods } from "@/lib/payments/methods";
import { isStripeConfigured } from "@/lib/stripe";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { PageHeader } from "@/components/ui/Card";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Choose how to pay and place your order.",
  robots: { index: false, follow: false },
};

// Reads the session and the customer's saved addresses.
export const dynamic = "force-dynamic";

/**
 * Server Component. Supplies everything the checkout form cannot know on its own - which payment
 * methods this deployment accepts, the signed-in customer's email and saved addresses - and lets
 * the Client Component render the cart from the persisted store.
 *
 * Guests may check out: `Order.userId` is nullable and the email is captured on the form.
 */
export default async function CheckoutPage() {
  const session = await auth();
  const user = session?.user ?? null;

  const addresses = user ? await listUserAddresses(user.id) : [];
  const availability = { stripeConfigured: isStripeConfigured };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Checkout"
        description="Confirm where your order is going and how you would like to pay."
      />
      <CheckoutForm
        methods={listPaymentMethods(availability)}
        defaultMethod={defaultPaymentMethod(availability)}
        defaultEmail={user?.email ?? ""}
        signedIn={Boolean(user)}
        addresses={addresses}
      />
    </main>
  );
}
