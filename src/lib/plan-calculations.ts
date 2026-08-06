import { parseMoneyToSatang } from "@/lib/money";
import { bangkokMonthRange } from "@/lib/reports";
import type {
  Budget,
  Category,
  PlanAllocation,
  Transaction,
} from "@/types/finance";

export type AllocationDraft = {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  value: string;
  categoryId: string;
};

export type BudgetStatus = {
  budget: Budget;
  category: Category;
  actualSatang: number;
  remainingSatang: number;
  percentage: number;
  state: "safe" | "near" | "over";
};

export function monthDate(month: string): string {
  return `${month}-01`;
}

export function budgetStatuses(
  month: string,
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
): BudgetStatus[] {
  const range = bangkokMonthRange(month);
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime();
  const expenses = new Map<string, number>();
  transactions.forEach((item) => {
    const occurredAtMs = new Date(item.occurred_at).getTime();
    if (
      item.transaction_type === "expense" &&
      item.category_id &&
      occurredAtMs >= startMs &&
      occurredAtMs < endMs
    ) {
      expenses.set(
        item.category_id,
        (expenses.get(item.category_id) ?? 0) + Number(item.amount_satang),
      );
    }
  });
  const categoryMap = new Map(categories.map((item) => [item.id, item]));

  return budgets
    .filter((item) => item.month === monthDate(month))
    .flatMap((budget) => {
      const category = categoryMap.get(budget.category_id);
      if (!category) return [];
      const limit = Number(budget.limit_satang);
      const actualSatang = expenses.get(budget.category_id) ?? 0;
      const percentage = (actualSatang / limit) * 100;
      return [
        {
          budget,
          category,
          actualSatang,
          remainingSatang: limit - actualSatang,
          percentage,
          state: percentage > 100 ? "over" : percentage >= 80 ? "near" : "safe",
        } satisfies BudgetStatus,
      ];
    })
    .sort(
      (a, b) =>
        b.percentage - a.percentage ||
        a.category.name.localeCompare(b.category.name, "th"),
    );
}

export function allocationAmount(
  allocation: Pick<
    PlanAllocation,
    "allocation_type" | "percentage" | "planned_amount_satang"
  >,
  expectedIncomeSatang: number,
): number {
  return allocation.allocation_type === "percentage"
    ? Math.round((expectedIncomeSatang * Number(allocation.percentage)) / 100)
    : Number(allocation.planned_amount_satang);
}

export function validateAllocations(
  incomeInput: string,
  allocations: AllocationDraft[],
): {
  error?: string;
  incomeSatang?: number;
  totalSatang: number;
  percentageTotal: number;
} {
  const incomeSatang = parseMoneyToSatang(incomeInput);
  if (!incomeSatang || incomeSatang < 1)
    return {
      error: "กรุณากรอกรายได้คาดการณ์ให้มากกว่า 0",
      totalSatang: 0,
      percentageTotal: 0,
    };

  let percentageTotal = 0;
  let totalSatang = 0;
  for (const item of allocations) {
    if (!item.name.trim())
      return {
        error: "กรุณากรอกชื่อทุกรายการจัดสรร",
        incomeSatang,
        totalSatang,
        percentageTotal,
      };
    if (item.type === "percentage") {
      const percentage = Number(item.value);
      if (!Number.isFinite(percentage) || percentage < 0.01 || percentage > 100)
        return {
          error: "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0.01–100",
          incomeSatang,
          totalSatang,
          percentageTotal,
        };
      percentageTotal += percentage;
      totalSatang += Math.round((incomeSatang * percentage) / 100);
    } else {
      const amount = parseMoneyToSatang(item.value);
      if (!amount || amount < 1)
        return {
          error: "จำนวนเงินจัดสรรต้องมากกว่า 0",
          incomeSatang,
          totalSatang,
          percentageTotal,
        };
      totalSatang += amount;
    }
  }
  if (percentageTotal > 100)
    return {
      error: `เปอร์เซ็นต์รวมเกิน 100% อยู่ ${(percentageTotal - 100).toFixed(2)}%`,
      incomeSatang,
      totalSatang,
      percentageTotal,
    };
  if (totalSatang > incomeSatang)
    return {
      error: `ยอดจัดสรรเกินรายได้ ${(totalSatang - incomeSatang) / 100} บาท`,
      incomeSatang,
      totalSatang,
      percentageTotal,
    };
  return { incomeSatang, totalSatang, percentageTotal };
}
