import type { OrderStatus, PaymentStatus } from "@prisma/client";
import { describe, expect, it } from "vitest";
import {
  COD_ORDER_STATUS_TRANSITIONS,
  ORDER_STATUSES,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_TRANSITIONS,
  canTransitionOrder,
  canTransitionPayment,
  hasReservedStock,
  nextOrderStatuses,
  nextPaymentStatuses,
  orderStatusTransitions,
} from "./status";

/** The business rules from the module docblock, restated independently so a table change is caught. */
const EXPECTED: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};

const TERMINAL: readonly OrderStatus[] = ["DELIVERED", "CANCELLED"];

const matrix = ORDER_STATUSES.flatMap((from) =>
  ORDER_STATUSES.map((to) => [from, to, EXPECTED[from].includes(to)] as const),
);

describe("ORDER_STATUSES", () => {
  it("lists every status exactly once", () => {
    expect([...ORDER_STATUSES].sort()).toEqual(
      ["CANCELLED", "DELIVERED", "PAID", "PENDING", "SHIPPED"].sort(),
    );
    expect(new Set(ORDER_STATUSES).size).toBe(ORDER_STATUSES.length);
  });

  it("matches the keys of the transition table", () => {
    expect(Object.keys(ORDER_STATUS_TRANSITIONS).sort()).toEqual([...ORDER_STATUSES].sort());
  });
});

describe("ORDER_STATUS_TRANSITIONS", () => {
  it("encodes the documented lifecycle", () => {
    expect(ORDER_STATUS_TRANSITIONS).toEqual(EXPECTED);
  });

  it("only points at known statuses", () => {
    for (const targets of Object.values(ORDER_STATUS_TRANSITIONS)) {
      for (const target of targets) expect(ORDER_STATUSES).toContain(target);
    }
  });
});

describe("canTransitionOrder", () => {
  it.each(matrix)("%s -> %s is %s", (from, to, allowed) => {
    expect(canTransitionOrder(from, to)).toBe(allowed);
  });

  it("never allows a self-transition", () => {
    for (const status of ORDER_STATUSES) expect(canTransitionOrder(status, status)).toBe(false);
  });

  it.each(TERMINAL)("%s is terminal", (status) => {
    for (const to of ORDER_STATUSES) expect(canTransitionOrder(status, to)).toBe(false);
  });

  it("never allows moving backwards to PENDING", () => {
    for (const from of ORDER_STATUSES) expect(canTransitionOrder(from, "PENDING")).toBe(false);
  });

  it("requires payment before shipping", () => {
    expect(canTransitionOrder("PENDING", "SHIPPED")).toBe(false);
    expect(canTransitionOrder("PENDING", "DELIVERED")).toBe(false);
  });

  it("does not allow cancelling after shipment", () => {
    expect(canTransitionOrder("SHIPPED", "CANCELLED")).toBe(false);
    expect(canTransitionOrder("DELIVERED", "CANCELLED")).toBe(false);
  });
});

describe("nextOrderStatuses", () => {
  it.each(ORDER_STATUSES)("returns the allowed targets for %s", (from) => {
    expect(nextOrderStatuses(from)).toEqual(EXPECTED[from]);
  });

  it("agrees with canTransitionOrder", () => {
    for (const from of ORDER_STATUSES) {
      const next = nextOrderStatuses(from);
      for (const to of ORDER_STATUSES) {
        expect(next.includes(to)).toBe(canTransitionOrder(from, to));
      }
    }
  });

  it("returns an empty list for terminal statuses", () => {
    for (const status of TERMINAL) expect(nextOrderStatuses(status)).toEqual([]);
  });

  it("reaches every status from PENDING and never leaves an order stuck", () => {
    const seen = new Set<OrderStatus>();
    const queue: OrderStatus[] = ["PENDING"];
    while (queue.length > 0) {
      const current = queue.shift();
      if (current === undefined || seen.has(current)) continue;
      seen.add(current);
      queue.push(...nextOrderStatuses(current));
    }

    expect([...seen].sort()).toEqual([...ORDER_STATUSES].sort());
    // Every non-terminal status has at least one way forward.
    for (const status of ORDER_STATUSES) {
      if (!TERMINAL.includes(status)) expect(nextOrderStatuses(status).length).toBeGreaterThan(0);
    }
  });
});

// ───────────────────── Cash on delivery (goods before money) ─────────────────────

const COD_EXPECTED: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING: ["PAID", "SHIPPED", "CANCELLED"],
  PAID: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

describe("orderStatusTransitions", () => {
  it("uses the prepaid table for Stripe and by default", () => {
    expect(orderStatusTransitions()).toBe(ORDER_STATUS_TRANSITIONS);
    expect(orderStatusTransitions("STRIPE")).toBe(ORDER_STATUS_TRANSITIONS);
  });

  it.each(["BANK_TRANSFER", "ESEWA", "IME_PAY"] as const)(
    "keeps prepaid rules for %s (the money arrives before the parcel leaves)",
    (method) => {
      expect(orderStatusTransitions(method)).toBe(ORDER_STATUS_TRANSITIONS);
    },
  );

  it("uses the cash-on-delivery table for CASH_ON_DELIVERY", () => {
    expect(orderStatusTransitions("CASH_ON_DELIVERY")).toBe(COD_ORDER_STATUS_TRANSITIONS);
    expect(COD_ORDER_STATUS_TRANSITIONS).toEqual(COD_EXPECTED);
  });
});

describe("canTransitionOrder (cash on delivery)", () => {
  it("lets a pending order ship before it is paid", () => {
    expect(canTransitionOrder("PENDING", "SHIPPED", "CASH_ON_DELIVERY")).toBe(true);
    expect(canTransitionOrder("PENDING", "SHIPPED", "STRIPE")).toBe(false);
  });

  it("lets a shipped order be cancelled when delivery is refused", () => {
    expect(canTransitionOrder("SHIPPED", "CANCELLED", "CASH_ON_DELIVERY")).toBe(true);
    expect(canTransitionOrder("SHIPPED", "CANCELLED", "STRIPE")).toBe(false);
  });

  it("still refuses to move backwards or out of a terminal state", () => {
    for (const from of ORDER_STATUSES) {
      expect(canTransitionOrder(from, "PENDING", "CASH_ON_DELIVERY")).toBe(false);
    }
    for (const to of ORDER_STATUSES) {
      expect(canTransitionOrder("DELIVERED", to, "CASH_ON_DELIVERY")).toBe(false);
      expect(canTransitionOrder("CANCELLED", to, "CASH_ON_DELIVERY")).toBe(false);
    }
  });

  it("never allows a self-transition", () => {
    for (const status of ORDER_STATUSES) {
      expect(canTransitionOrder(status, status, "CASH_ON_DELIVERY")).toBe(false);
    }
  });

  it("agrees with nextOrderStatuses", () => {
    for (const from of ORDER_STATUSES) {
      const next = nextOrderStatuses(from, "CASH_ON_DELIVERY");
      expect(next).toEqual(COD_EXPECTED[from]);
      for (const to of ORDER_STATUSES) {
        expect(next.includes(to)).toBe(canTransitionOrder(from, to, "CASH_ON_DELIVERY"));
      }
    }
  });
});

// ───────────────────────────── Payment status ─────────────────────────────

const PAYMENT_EXPECTED: Record<PaymentStatus, readonly PaymentStatus[]> = {
  UNPAID: ["PAID", "FAILED"],
  PAID: ["REFUNDED"],
  FAILED: ["PAID", "UNPAID"],
  REFUNDED: [],
};

describe("PAYMENT_STATUSES", () => {
  it("lists every payment status exactly once", () => {
    expect([...PAYMENT_STATUSES].sort()).toEqual(["FAILED", "PAID", "REFUNDED", "UNPAID"].sort());
    expect(Object.keys(PAYMENT_STATUS_TRANSITIONS).sort()).toEqual([...PAYMENT_STATUSES].sort());
  });
});

describe("canTransitionPayment", () => {
  it("encodes the documented payment lifecycle", () => {
    expect(PAYMENT_STATUS_TRANSITIONS).toEqual(PAYMENT_EXPECTED);
  });

  it("lets an admin record a manual payment and later refund it", () => {
    expect(canTransitionPayment("UNPAID", "PAID")).toBe(true);
    expect(canTransitionPayment("PAID", "REFUNDED")).toBe(true);
  });

  it("lets a failed transfer be retried", () => {
    expect(canTransitionPayment("FAILED", "PAID")).toBe(true);
    expect(canTransitionPayment("FAILED", "UNPAID")).toBe(true);
  });

  it("never un-refunds or re-collects a paid order", () => {
    for (const to of PAYMENT_STATUSES) {
      expect(canTransitionPayment("REFUNDED", to)).toBe(false);
    }
    expect(canTransitionPayment("PAID", "UNPAID")).toBe(false);
    expect(canTransitionPayment("PAID", "FAILED")).toBe(false);
  });

  it("never allows a self-transition and agrees with nextPaymentStatuses", () => {
    for (const from of PAYMENT_STATUSES) {
      expect(canTransitionPayment(from, from)).toBe(false);
      const next = nextPaymentStatuses(from);
      expect(next).toEqual(PAYMENT_EXPECTED[from]);
      for (const to of PAYMENT_STATUSES) {
        expect(next.includes(to)).toBe(canTransitionPayment(from, to));
      }
    }
  });
});

describe("hasReservedStock", () => {
  it.each(["CASH_ON_DELIVERY", "BANK_TRANSFER", "ESEWA", "IME_PAY"] as const)(
    "is true for %s regardless of payment status (stock is held at placement)",
    (paymentMethod) => {
      for (const paymentStatus of PAYMENT_STATUSES) {
        expect(hasReservedStock({ paymentMethod, paymentStatus })).toBe(true);
      }
    },
  );

  it("is false for an unpaid or failed Stripe order (nothing left the shelf)", () => {
    expect(hasReservedStock({ paymentMethod: "STRIPE", paymentStatus: "UNPAID" })).toBe(false);
    expect(hasReservedStock({ paymentMethod: "STRIPE", paymentStatus: "FAILED" })).toBe(false);
  });

  it("is true once a Stripe order has been fulfilled", () => {
    expect(hasReservedStock({ paymentMethod: "STRIPE", paymentStatus: "PAID" })).toBe(true);
    expect(hasReservedStock({ paymentMethod: "STRIPE", paymentStatus: "REFUNDED" })).toBe(true);
  });
});
