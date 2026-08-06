import { describe, expect, it } from "vitest";

import {
  allocationAmount,
  budgetStatuses,
  validateAllocations,
  type AllocationDraft,
} from "@/lib/plan-calculations";
import type { Budget, Category, Transaction } from "@/types/finance";

const food = {
  id: "food",
  name: "อาหาร",
  color: "#F97316",
  transaction_type: "expense",
} as Category;
const budget = {
  id: "budget",
  category_id: "food",
  month: "2026-08-01",
  limit_satang: 400_000,
} as Budget;

function expense(amount: number, occurredAt: string) {
  return {
    transaction_type: "expense",
    amount_satang: amount,
    occurred_at: occurredAt,
    category_id: "food",
  } as Transaction;
}

function allocation(
  type: "percentage" | "fixed",
  value: string,
): AllocationDraft {
  return { id: value, name: "ออม", type, value, categoryId: "" };
}

describe("monthly budget status", () => {
  it("calculates actual, remaining, and percentage in the Bangkok month", () => {
    const [status] = budgetStatuses(
      "2026-08",
      [budget],
      [food],
      [
        expense(150_000, "2026-08-31T16:59:59.000Z"),
        expense(900_000, "2026-08-31T17:00:00.000Z"),
      ],
    );

    expect(status).toMatchObject({
      actualSatang: 150_000,
      remainingSatang: 250_000,
      percentage: 37.5,
      state: "safe",
    });
  });

  it("marks a negative remainder as over budget", () => {
    const [status] = budgetStatuses(
      "2026-08",
      [budget],
      [food],
      [expense(425_000, "2026-08-10T05:00:00.000Z")],
    );
    expect(status.remainingSatang).toBe(-25_000);
    expect(status.state).toBe("over");
  });
});

describe("financial plan validation", () => {
  it("rounds percentage allocations to satang half-up", () => {
    expect(
      allocationAmount(
        {
          allocation_type: "percentage",
          percentage: 50,
          planned_amount_satang: null,
        },
        101,
      ),
    ).toBe(51);
  });

  it("accepts a mix of percentage and fixed allocations within income", () => {
    expect(
      validateAllocations("30000", [
        allocation("percentage", "50"),
        allocation("fixed", "10000"),
      ]),
    ).toMatchObject({
      incomeSatang: 3_000_000,
      totalSatang: 2_500_000,
      percentageTotal: 50,
    });
  });

  it("rejects percentage totals above 100 percent", () => {
    const result = validateAllocations("30000", [
      allocation("percentage", "60"),
      allocation("percentage", "45"),
    ]);
    expect(result.error).toContain("เกิน 100%");
  });

  it("rejects allocated amounts above expected income", () => {
    const result = validateAllocations("30000", [
      allocation("percentage", "80"),
      allocation("fixed", "10000"),
    ]);
    expect(result.error).toContain("เกินรายได้");
  });
});
