import { describe, expect, it } from "vitest";

import {
  allocationAmount,
  budgetStatuses,
  buildAllocationOverview,
  validateAllocations,
  type AllocationDraft,
} from "@/lib/plan-calculations";
import type {
  Budget,
  Category,
  FinancialPlan,
  PlanAllocation,
  Transaction,
} from "@/types/finance";

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

describe("buildAllocationOverview", () => {
  const mockPlan: FinancialPlan = {
    id: "plan-1",
    user_id: "user-1",
    month: "2026-08-01",
    expected_income_satang: 5_000_000,
    status: "draft",
    created_at: "2026-08-01T00:00:00Z",
    updated_at: "2026-08-01T00:00:00Z",
  };

  const mockAllocations: PlanAllocation[] = [
    {
      id: "alloc-1",
      financial_plan_id: "plan-1",
      user_id: "user-1",
      name: "ค่าอาหาร",
      allocation_type: "fixed",
      percentage: null,
      planned_amount_satang: 1_000_000,
      category_id: "food",
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
    },
    {
      id: "alloc-2",
      financial_plan_id: "plan-1",
      user_id: "user-1",
      name: "เงินออม",
      allocation_type: "percentage",
      percentage: 20,
      planned_amount_satang: null,
      category_id: null,
      created_at: "2026-08-01T00:00:00Z",
      updated_at: "2026-08-01T00:00:00Z",
    },
  ];

  it("builds allocation overview from plan and allocations", () => {
    const overview = buildAllocationOverview(
      "2026-08",
      [mockPlan],
      mockAllocations,
      [],
      [food],
      [expense(200_000, "2026-08-05T10:00:00Z")],
    );

    expect(overview.hasPlan).toBe(true);
    expect(overview.expectedIncomeSatang).toBe(5_000_000);
    expect(overview.totalAllocatedSatang).toBe(2_000_000);
    expect(overview.unallocatedSatang).toBe(3_000_000);
    expect(overview.allocatedRatio).toBe(40);
    expect(overview.items).toHaveLength(2);

    expect(overview.items[0]).toMatchObject({
      name: "ค่าอาหาร",
      plannedSatang: 1_000_000,
      actualSatang: 200_000,
      remainingSatang: 800_000,
      spendingPercentage: 20,
      status: "safe",
    });

    expect(overview.items[1]).toMatchObject({
      name: "เงินออม",
      plannedSatang: 1_000_000,
      actualSatang: 0,
      status: "unspent",
    });
  });

  it("falls back to budgets when no financial plan exists", () => {
    const overview = buildAllocationOverview(
      "2026-08",
      [],
      [],
      [budget],
      [food],
      [expense(100_000, "2026-08-05T10:00:00Z")],
    );

    expect(overview.hasPlan).toBe(false);
    expect(overview.hasBudgets).toBe(true);
    expect(overview.totalAllocatedSatang).toBe(400_000);
    expect(overview.items[0]).toMatchObject({
      name: "อาหาร",
      plannedSatang: 400_000,
      actualSatang: 100_000,
    });
  });
});

