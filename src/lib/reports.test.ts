import { describe, expect, it } from "vitest";

import {
  bangkokMonthRange,
  buildMonthlyReport,
  nextMonth,
  percentageChange,
  previousMonth,
  todayTotals,
} from "@/lib/reports";
import type { Category, Transaction } from "@/types/finance";

const categories = [
  { id: "food", name: "อาหาร", color: "#F97316", icon: "utensils" },
  { id: "travel", name: "เดินทาง", color: "#3B82F6", icon: "bus" },
] as Category[];

function transaction(
  id: string,
  type: "income" | "expense" | "transfer",
  amount: number,
  occurredAt: string,
  categoryId: string | null = null,
) {
  return {
    id,
    transaction_type: type,
    amount_satang: amount,
    occurred_at: occurredAt,
    category_id: categoryId,
  } as Transaction;
}

describe("Bangkok report months", () => {
  it("creates half-open UTC boundaries from Bangkok midnight", () => {
    const range = bangkokMonthRange("2026-08");
    expect(new Date(range.start).toISOString()).toBe(
      "2026-07-31T17:00:00.000Z",
    );
    expect(new Date(range.end).toISOString()).toBe("2026-08-31T17:00:00.000Z");
  });

  it("moves across year boundaries", () => {
    expect(previousMonth("2026-01")).toBe("2025-12");
    expect(nextMonth("2026-12")).toBe("2027-01");
  });

  it("includes the last second of a month and excludes the next midnight", () => {
    const report = buildMonthlyReport(
      "2026-08",
      [
        transaction("last", "expense", 100, "2026-08-31T16:59:59.000Z", "food"),
        transaction("next", "expense", 200, "2026-08-31T17:00:00.000Z", "food"),
      ],
      categories,
    );
    expect(report.expense).toBe(100);
    expect(report.daily[30].expense).toBe(100);
  });

  it("supports leap-day reports", () => {
    const report = buildMonthlyReport(
      "2028-02",
      [transaction("leap", "income", 500, "2028-02-29T05:00:00.000Z", "food")],
      categories,
    );
    expect(report.daily).toHaveLength(29);
    expect(report.daily[28].income).toBe(500);
  });
});

describe("monthly report calculations", () => {
  it("excludes transfers and sorts equally-valued categories by name", () => {
    const report = buildMonthlyReport(
      "2026-08",
      [
        transaction("income", "income", 10_000, "2026-08-04T06:00:00.000Z"),
        transaction(
          "food",
          "expense",
          2_000,
          "2026-08-05T06:00:00.000Z",
          "food",
        ),
        transaction(
          "travel",
          "expense",
          2_000,
          "2026-08-06T06:00:00.000Z",
          "travel",
        ),
        transaction("transfer", "transfer", 8_000, "2026-08-07T06:00:00.000Z"),
      ],
      categories,
    );
    expect(report).toMatchObject({
      income: 10_000,
      expense: 4_000,
      net: 6_000,
      transactionCount: 3,
    });
    expect(report.categories.map((item) => item.name)).toEqual([
      "เดินทาง",
      "อาหาร",
    ]);
    expect(report.categories[0].percentage).toBe(50);
  });

  it("returns no percentage when the previous value is zero", () => {
    expect(percentageChange(100, 0)).toBeNull();
    expect(percentageChange(120, 100)).toBe(20);
  });

  it("uses the Bangkok calendar date for today's totals", () => {
    const totals = todayTotals(
      [
        transaction(
          "today",
          "expense",
          300,
          "2026-08-05T17:30:00.000Z",
          "food",
        ),
        transaction(
          "yesterday",
          "expense",
          900,
          "2026-08-05T16:59:59.000Z",
          "food",
        ),
      ],
      new Date("2026-08-06T03:00:00.000Z"),
    );
    expect(totals.expense).toBe(300);
  });
});
