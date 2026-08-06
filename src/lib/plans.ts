import { parseMoneyToSatang } from "@/lib/money";
import { currentUserId } from "@/lib/finance";
import {
  monthDate,
  validateAllocations,
  type AllocationDraft,
} from "@/lib/plan-calculations";
import { previousMonth } from "@/lib/reports";
import { supabase } from "@/lib/supabase";
import type { Json } from "@/types/database";
import type {
  Budget,
  Category,
  FinancialGoal,
  FinancialPlan,
  PlanAllocation,
  Transaction,
} from "@/types/finance";

export type PlansData = {
  budgets: Budget[];
  categories: Category[];
  goals: FinancialGoal[];
  plans: FinancialPlan[];
  allocations: PlanAllocation[];
  transactions: Transaction[];
};

async function loadAllTransactions(userId: string): Promise<Transaction[]> {
  const pageSize = 1_000;
  const transactions: Transaction[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (error) throw error;
    transactions.push(...(data ?? []));
    if (!data || data.length < pageSize) return transactions;
  }
}

export async function loadPlansData(): Promise<PlansData> {
  const userId = await currentUserId();
  const [budgets, categories, goals, plans, allocations, transactions] =
    await Promise.all([
      supabase
        .from("budgets")
        .select("*")
        .eq("user_id", userId)
        .order("month", { ascending: false }),
      supabase
        .from("categories")
        .select("*")
        .eq("user_id", userId)
        .eq("transaction_type", "expense")
        .order("name"),
      supabase
        .from("financial_goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at"),
      supabase
        .from("financial_plans")
        .select("*")
        .eq("user_id", userId)
        .order("month", { ascending: false }),
      supabase
        .from("plan_allocations")
        .select("*")
        .eq("user_id", userId)
        .order("created_at"),
      loadAllTransactions(userId),
    ]);
  const error =
    budgets.error ??
    categories.error ??
    goals.error ??
    plans.error ??
    allocations.error;
  if (error) throw error;
  return {
    budgets: budgets.data ?? [],
    categories: categories.data ?? [],
    goals: goals.data ?? [],
    plans: plans.data ?? [],
    allocations: allocations.data ?? [],
    transactions,
  };
}

export async function saveBudget(
  month: string,
  categoryId: string,
  amountInput: string,
) {
  const limitSatang = parseMoneyToSatang(amountInput);
  if (!limitSatang || limitSatang < 1) throw new Error("วงเงินต้องมากกว่า 0");
  const userId = await currentUserId();
  const { error } = await supabase.from("budgets").upsert(
    {
      user_id: userId,
      month: monthDate(month),
      category_id: categoryId,
      limit_satang: limitSatang,
    },
    { onConflict: "user_id,category_id,month" },
  );
  if (error) throw error;
}

export async function deleteBudget(id: string) {
  const userId = await currentUserId();
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}

export async function copyPreviousBudgets(month: string): Promise<number> {
  const userId = await currentUserId();
  const source = monthDate(previousMonth(month));
  const { data, error } = await supabase
    .from("budgets")
    .select("category_id, limit_satang")
    .eq("user_id", userId)
    .eq("month", source);
  if (error) throw error;
  if (!data?.length) return 0;
  const result = await supabase.from("budgets").upsert(
    data.map((item) => ({ ...item, user_id: userId, month: monthDate(month) })),
    { onConflict: "user_id,category_id,month", ignoreDuplicates: true },
  );
  if (result.error) throw result.error;
  return data.length;
}

export async function savePlan(
  month: string,
  incomeInput: string,
  allocations: AllocationDraft[],
) {
  const validation = validateAllocations(incomeInput, allocations);
  if (validation.error || !validation.incomeSatang)
    throw new Error(validation.error);
  const payload = allocations.map((item) => ({
    name: item.name.trim(),
    allocation_type: item.type,
    percentage: item.type === "percentage" ? Number(item.value) : null,
    planned_amount_satang:
      item.type === "fixed" ? parseMoneyToSatang(item.value) : null,
    category_id: item.categoryId || null,
  }));
  const { error } = await supabase.rpc("save_financial_plan", {
    month_input: monthDate(month),
    expected_income_satang_input: validation.incomeSatang,
    allocations_input: payload as Json,
  });
  if (error) throw error;
}

export async function saveGoal(goal: {
  id?: string;
  name: string;
  target: string;
  saved: string;
  targetDate: string;
  color: string;
}) {
  const target = parseMoneyToSatang(goal.target);
  const saved = parseMoneyToSatang(goal.saved);
  if (!goal.name.trim()) throw new Error("กรุณากรอกชื่อเป้าหมาย");
  if (!target || target < 1) throw new Error("ยอดเป้าหมายต้องมากกว่า 0");
  if (saved === null) throw new Error("ยอดออมแล้วไม่ถูกต้อง");
  const userId = await currentUserId();
  const values = {
    user_id: userId,
    name: goal.name.trim(),
    target_amount_satang: target,
    saved_amount_satang: saved,
    target_date: goal.targetDate || null,
    color: goal.color,
  };
  const result = goal.id
    ? await supabase
        .from("financial_goals")
        .update(values)
        .eq("id", goal.id)
        .eq("user_id", userId)
    : await supabase.from("financial_goals").insert(values);
  if (result.error) throw result.error;
}

export async function deleteGoal(id: string) {
  const userId = await currentUserId();
  const { error } = await supabase
    .from("financial_goals")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
