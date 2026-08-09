import { parseMoneyToSatang } from "@/lib/money";
import { bangkokMonthRange } from "@/lib/reports";
import type {
  Budget,
  Category,
  FinancialPlan,
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

export type AllocationOverviewItem = {
  id: string;
  name: string;
  type: "percentage" | "fixed";
  percentageOfIncome: number;
  plannedSatang: number;
  actualSatang: number;
  remainingSatang: number;
  spendingPercentage: number;
  status: "unspent" | "safe" | "near" | "over";
  categoryId: string | null;
  categoryName?: string;
  color: string;
};

export type AllocationOverviewData = {
  hasPlan: boolean;
  hasBudgets: boolean;
  month: string;
  expectedIncomeSatang: number;
  totalAllocatedSatang: number;
  unallocatedSatang: number;
  allocatedRatio: number;
  items: AllocationOverviewItem[];
};

const DEFAULT_PALETTE = [
  "#6366F1", // Indigo
  "#10B981", // Emerald
  "#8B5CF6", // Violet
  "#F59E0B", // Amber
  "#EC4899", // Pink
  "#06B6D4", // Cyan
  "#3B82F6", // Blue
  "#F97316", // Orange
  "#14B8A6", // Teal
  "#A855F7", // Purple
];

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

export function buildAllocationOverview(
  month: string,
  plans: FinancialPlan[],
  allocations: PlanAllocation[],
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
): AllocationOverviewData {
  const currentMonthDate = monthDate(month);
  const plan = plans.find((p) => p.month === currentMonthDate);
  const planAllocations = plan
    ? allocations.filter((a) => a.financial_plan_id === plan.id)
    : [];

  const range = bangkokMonthRange(month);
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime();

  const categoryExpenses = new Map<string, number>();
  transactions.forEach((item) => {
    const occurredAtMs = new Date(item.occurred_at).getTime();
    if (
      item.transaction_type === "expense" &&
      item.category_id &&
      occurredAtMs >= startMs &&
      occurredAtMs < endMs
    ) {
      categoryExpenses.set(
        item.category_id,
        (categoryExpenses.get(item.category_id) ?? 0) + Number(item.amount_satang),
      );
    }
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));

  if (plan && planAllocations.length > 0) {
    const expectedIncomeSatang = Number(plan.expected_income_satang);
    let totalAllocatedSatang = 0;

    const items: AllocationOverviewItem[] = planAllocations.map((alloc, idx) => {
      const plannedSatang = allocationAmount(alloc, expectedIncomeSatang);
      totalAllocatedSatang += plannedSatang;

      const percentageOfIncome =
        expectedIncomeSatang > 0
          ? (plannedSatang / expectedIncomeSatang) * 100
          : 0;

      const category = alloc.category_id
        ? categoryMap.get(alloc.category_id)
        : undefined;
      const actualSatang = alloc.category_id
        ? (categoryExpenses.get(alloc.category_id) ?? 0)
        : 0;

      const remainingSatang = plannedSatang - actualSatang;
      const spendingPercentage =
        plannedSatang > 0 ? (actualSatang / plannedSatang) * 100 : 0;

      let status: AllocationOverviewItem["status"] = "safe";
      if (actualSatang === 0) status = "unspent";
      else if (spendingPercentage > 100) status = "over";
      else if (spendingPercentage >= 80) status = "near";

      const color =
        category?.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];

      return {
        id: alloc.id,
        name: alloc.name,
        type: alloc.allocation_type as "percentage" | "fixed",
        percentageOfIncome,
        plannedSatang,
        actualSatang,
        remainingSatang,
        spendingPercentage,
        status,
        categoryId: alloc.category_id,
        categoryName: category?.name,
        color,
      };
    });

    const unallocatedSatang = Math.max(
      0,
      expectedIncomeSatang - totalAllocatedSatang,
    );
    const allocatedRatio =
      expectedIncomeSatang > 0
        ? Math.min(100, (totalAllocatedSatang / expectedIncomeSatang) * 100)
        : 0;

    return {
      hasPlan: true,
      hasBudgets: budgets.some((b) => b.month === currentMonthDate),
      month,
      expectedIncomeSatang,
      totalAllocatedSatang,
      unallocatedSatang,
      allocatedRatio,
      items,
    };
  }

  const activeBudgets = budgetStatuses(month, budgets, categories, transactions);
  if (activeBudgets.length > 0) {
    const totalAllocatedSatang = activeBudgets.reduce(
      (sum, b) => sum + Number(b.budget.limit_satang),
      0,
    );

    const items: AllocationOverviewItem[] = activeBudgets.map((b, idx) => {
      const plannedSatang = Number(b.budget.limit_satang);
      const percentageOfIncome =
        totalAllocatedSatang > 0
          ? (plannedSatang / totalAllocatedSatang) * 100
          : 0;

      let status: AllocationOverviewItem["status"] = "safe";
      if (b.actualSatang === 0) status = "unspent";
      else if (b.state === "over") status = "over";
      else if (b.state === "near") status = "near";

      return {
        id: b.budget.id,
        name: b.category.name,
        type: "fixed",
        percentageOfIncome,
        plannedSatang,
        actualSatang: b.actualSatang,
        remainingSatang: b.remainingSatang,
        spendingPercentage: b.percentage,
        status,
        categoryId: b.category.id,
        categoryName: b.category.name,
        color: b.category.color || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length],
      };
    });

    return {
      hasPlan: false,
      hasBudgets: true,
      month,
      expectedIncomeSatang: totalAllocatedSatang,
      totalAllocatedSatang,
      unallocatedSatang: 0,
      allocatedRatio: 100,
      items,
    };
  }

  return {
    hasPlan: false,
    hasBudgets: false,
    month,
    expectedIncomeSatang: 0,
    totalAllocatedSatang: 0,
    unallocatedSatang: 0,
    allocatedRatio: 0,
    items: [],
  };
}

