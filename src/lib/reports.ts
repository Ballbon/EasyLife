import type { Category, Transaction } from "@/types/finance";

const BANGKOK_OFFSET = "+07:00";
const MONTH_PATTERN = /^(\d{4})-(\d{2})$/;

export type DailyTotal = {
  day: number;
  income: number;
  expense: number;
};

export type CategoryTotal = {
  id: string;
  name: string;
  color: string;
  icon: string;
  amount: number;
  percentage: number;
};

export type PeriodTotals = {
  income: number;
  expense: number;
  net: number;
  transactionCount: number;
};

export type MonthlyReport = PeriodTotals & {
  month: string;
  daily: DailyTotal[];
  categories: CategoryTotal[];
};

function monthParts(month: string) {
  const match = MONTH_PATTERN.exec(month);
  if (!match) throw new Error("Invalid month");
  const year = Number(match[1]);
  const monthNumber = Number(match[2]);
  if (monthNumber < 1 || monthNumber > 12) throw new Error("Invalid month");
  return { year, monthNumber };
}

export function currentBangkokMonth(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
  }).format(now);
}

export function previousMonth(month: string): string {
  const { year, monthNumber } = monthParts(month);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function nextMonth(month: string): string {
  const { year, monthNumber } = monthParts(month);
  const date = new Date(Date.UTC(year, monthNumber, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function bangkokMonthRange(month: string) {
  const { year, monthNumber } = monthParts(month);
  const next = nextMonth(month);
  return {
    start: `${year}-${String(monthNumber).padStart(2, "0")}-01T00:00:00${BANGKOK_OFFSET}`,
    end: `${next}-01T00:00:00${BANGKOK_OFFSET}`,
  };
}

export function formatReportMonth(month: string): string {
  const { year, monthNumber } = monthParts(month);
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "long",
  }).format(
    new Date(
      `${year}-${String(monthNumber).padStart(2, "0")}-01T12:00:00${BANGKOK_OFFSET}`,
    ),
  );
}

export function buildMonthlyReport(
  month: string,
  transactions: Transaction[],
  categories: Category[],
): MonthlyReport {
  const { year, monthNumber } = monthParts(month);
  const range = bangkokMonthRange(month);
  const startMs = new Date(range.start).getTime();
  const endMs = new Date(range.end).getTime();
  const daysInMonth = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  const daily = Array.from({ length: daysInMonth }, (_, index) => ({
    day: index + 1,
    income: 0,
    expense: 0,
  }));
  const categoryAmounts = new Map<string, number>();
  let income = 0;
  let expense = 0;
  let transactionCount = 0;

  for (const transaction of transactions) {
    const occurredMs = new Date(transaction.occurred_at).getTime();
    if (occurredMs < startMs || occurredMs >= endMs) continue;
    if (transaction.transaction_type === "transfer") continue;

    const amount = Number(transaction.amount_satang);
    const day = Number(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Bangkok",
        day: "numeric",
      }).format(new Date(transaction.occurred_at)),
    );
    transactionCount += 1;

    if (transaction.transaction_type === "income") {
      income += amount;
      daily[day - 1].income += amount;
    } else {
      expense += amount;
      daily[day - 1].expense += amount;
      if (transaction.category_id) {
        categoryAmounts.set(
          transaction.category_id,
          (categoryAmounts.get(transaction.category_id) ?? 0) + amount,
        );
      }
    }
  }

  const categoryMap = new Map(
    categories.map((category) => [category.id, category]),
  );
  const categoryTotals = [...categoryAmounts.entries()]
    .map(([id, amount]) => {
      const category = categoryMap.get(id);
      return {
        id,
        name: category?.name ?? "ไม่ระบุหมวดหมู่",
        color: category?.color ?? "#8A8D93",
        icon: category?.icon ?? "shape-outline",
        amount,
        percentage: expense === 0 ? 0 : (amount / expense) * 100,
      };
    })
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name, "th"));

  return {
    month,
    income,
    expense,
    net: income - expense,
    transactionCount,
    daily,
    categories: categoryTotals,
  };
}

export function percentageChange(
  current: number,
  previous: number,
): number | null {
  return previous === 0 ? null : ((current - previous) / previous) * 100;
}

export function todayTotals(
  transactions: Transaction[],
  now = new Date(),
): PeriodTotals {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  let income = 0;
  let expense = 0;
  let transactionCount = 0;

  for (const transaction of transactions) {
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(transaction.occurred_at));
    if (date !== today || transaction.transaction_type === "transfer") continue;
    transactionCount += 1;
    if (transaction.transaction_type === "income")
      income += Number(transaction.amount_satang);
    if (transaction.transaction_type === "expense")
      expense += Number(transaction.amount_satang);
  }

  return { income, expense, net: income - expense, transactionCount };
}
