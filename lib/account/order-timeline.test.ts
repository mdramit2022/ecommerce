import { describe, expect, it } from "vitest";
import { buildOrderTimeline } from "./order-timeline";
import { toOrderDetail } from "@/lib/orders/serialize";
import { makeOrderDetailRow } from "@/tests/helpers/rows";
import type { OrderDetailRow } from "@/lib/orders/serialize";
import type { OrderDetail } from "@/types/order";

function order(overrides: Partial<OrderDetailRow> = {}): OrderDetail {
  return toOrderDetail(makeOrderDetailRow(overrides));
}

const stateOf = (steps: ReturnType<typeof buildOrderTimeline>, key: string) =>
  steps.find((step) => step.key === key)?.state;

const descriptionOf = (steps: ReturnType<typeof buildOrderTimeline>, key: string) =>
  steps.find((step) => step.key === key)?.description ?? "";

describe("buildOrderTimeline", () => {
  it("always starts with the placed step", () => {
    const steps = buildOrderTimeline(order({ status: "PENDING", paymentStatus: "UNPAID" }));
    expect(steps[0]?.key).toBe("placed");
    expect(steps[0]?.state).toBe("done");
  });

  it("collapses to a short branch for a cancelled order", () => {
    const steps = buildOrderTimeline(order({ status: "CANCELLED", paymentStatus: "UNPAID" }));
    expect(steps.map((step) => step.key)).toEqual(["placed", "cancelled"]);
    expect(steps[1]?.state).toBe("cancelled");
  });

  it("walks a paid card order through to delivery", () => {
    const shipped = buildOrderTimeline(
      order({ status: "SHIPPED", paymentStatus: "PAID", paymentMethod: "STRIPE" }),
    );
    expect(stateOf(shipped, "paid")).toBe("done");
    expect(stateOf(shipped, "shipped")).toBe("done");
    expect(stateOf(shipped, "delivered")).toBe("current");

    const delivered = buildOrderTimeline(
      order({ status: "DELIVERED", paymentStatus: "PAID", paymentMethod: "STRIPE" }),
    );
    expect(stateOf(delivered, "delivered")).toBe("done");
  });

  describe("cash on delivery", () => {
    const cod = { paymentMethod: "CASH_ON_DELIVERY" } as const;

    it("keeps the payment step open while the parcel is on its way", () => {
      const steps = buildOrderTimeline(
        order({ ...cod, status: "SHIPPED", paymentStatus: "UNPAID" }),
      );

      expect(stateOf(steps, "paid")).toBe("current");
      expect(stateOf(steps, "shipped")).toBe("done");
      expect(descriptionOf(steps, "paid")).toContain("cash when your order is delivered");
    });

    it("marks the payment done once the courier collects it", () => {
      const steps = buildOrderTimeline(
        order({ ...cod, status: "DELIVERED", paymentStatus: "PAID" }),
      );
      expect(stateOf(steps, "paid")).toBe("done");
      expect(stateOf(steps, "delivered")).toBe("done");
    });
  });

  describe("wallet and bank transfers", () => {
    it.each(["ESEWA", "IME_PAY", "BANK_TRANSFER"] as const)(
      "tells the customer their %s payment is being verified",
      (paymentMethod) => {
        const steps = buildOrderTimeline(
          order({ paymentMethod, status: "PENDING", paymentStatus: "UNPAID" }),
        );

        expect(stateOf(steps, "paid")).toBe("current");
        expect(descriptionOf(steps, "paid")).toContain("verifying");
      },
    );

    it("flags a payment that could not be verified", () => {
      const steps = buildOrderTimeline(
        order({ paymentMethod: "ESEWA", status: "PENDING", paymentStatus: "FAILED" }),
      );
      expect(stateOf(steps, "paid")).toBe("cancelled");
    });
  });

  it("treats a refunded payment as settled", () => {
    const steps = buildOrderTimeline(order({ paymentMethod: "ESEWA", paymentStatus: "REFUNDED" }));
    expect(stateOf(steps, "paid")).toBe("done");
    expect(descriptionOf(steps, "paid")).toContain("refunded");
  });
});
