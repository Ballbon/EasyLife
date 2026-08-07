import { z } from "zod";

import { parseMoneyToSatang } from "@/lib/money";
import { supabase } from "@/lib/supabase";
import { bangkokLocalInputToIso, transactionTypes } from "@/lib/transactions";
import type {
  Account,
  Budget,
  Category,
  FieldErrors,
  FinancialPlan,
  PlanAllocation,
  Profile,
  Transaction,
  TransactionDraft,
} from "@/types/finance";

export type FinanceData = {
  profile: Profile;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  plans: FinancialPlan[];
  allocations: PlanAllocation[];
  budgets: Budget[];
};

export async function currentUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("ไม่พบผู้ใช้ที่เข้าสู่ระบบ");
  return data.user.id;
}

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
    if (!data || data.length < pageSize) break;
  }

  return transactions;
}

export async function loadFinanceData(): Promise<FinanceData> {
  const userId = await currentUserId();
  const [
    profileResult,
    accountsResult,
    categoriesResult,
    transactionsResult,
    plansResult,
    allocationsResult,
    budgetsResult,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).single(),
    supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at"),
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name"),
    loadAllTransactions(userId),
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
    supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .order("month", { ascending: false }),
  ]);
  const error =
    profileResult.error ??
    accountsResult.error ??
    categoriesResult.error ??
    plansResult.error ??
    allocationsResult.error ??
    budgetsResult.error;
  if (error) throw error;
  if (!profileResult.data) throw new Error("ไม่พบโปรไฟล์ผู้ใช้");
  return {
    profile: profileResult.data,
    accounts: accountsResult.data ?? [],
    categories: categoriesResult.data ?? [],
    transactions: transactionsResult,
    plans: plansResult.data ?? [],
    allocations: allocationsResult.data ?? [],
    budgets: budgetsResult.data ?? [],
  };
}

const transactionSchema = z.object({
  transactionType: z.enum(transactionTypes),
  amount: z.string(),
  accountId: z.string().uuid("กรุณาเลือกบัญชี"),
  destinationAccountId: z.string(),
  categoryId: z.string(),
  occurredAt: z.string(),
  note: z.string().trim().max(500, "โน้ตต้องไม่เกิน 500 ตัวอักษร"),
});

export function validateTransaction(
  draft: TransactionDraft,
  accounts: Account[],
  categories: Category[],
) {
  const parsed = transactionSchema.safeParse(draft);
  const errors: FieldErrors = {};
  if (!parsed.success) {
    for (const [key, messages] of Object.entries(
      parsed.error.flatten().fieldErrors,
    ))
      errors[key] = messages?.[0];
    return { errors };
  }
  const amount = parseMoneyToSatang(draft.amount);
  if (amount === null || amount < 1 || amount > 99_999_999_999)
    errors.amount = "จำนวนต้องมากกว่า 0 และไม่เกิน ฿999,999,999.99";
  const occurredAt = bangkokLocalInputToIso(draft.occurredAt);
  if (!occurredAt) errors.occurredAt = "วันที่และเวลาไม่ถูกต้อง";
  if (!accounts.some((account) => account.id === draft.accountId))
    errors.accountId = "ไม่พบบัญชีต้นทาง";
  if (draft.transactionType === "transfer") {
    if (
      !draft.destinationAccountId ||
      draft.destinationAccountId === draft.accountId
    )
      errors.destinationAccountId = "บัญชีปลายทางต้องต่างจากบัญชีต้นทาง";
    else if (
      !accounts.some((account) => account.id === draft.destinationAccountId)
    )
      errors.destinationAccountId = "ไม่พบบัญชีปลายทาง";
  } else if (
    !categories.some(
      (category) =>
        category.id === draft.categoryId &&
        category.transaction_type === draft.transactionType,
    )
  ) {
    errors.categoryId = "กรุณาเลือกหมวดหมู่ที่ตรงกับประเภทรายการ";
  }
  return { errors, amount, occurredAt };
}

export async function saveTransaction(
  id: string | undefined,
  draft: TransactionDraft,
  accounts: Account[],
  categories: Category[],
) {
  const validated = validateTransaction(draft, accounts, categories);
  if (
    Object.values(validated.errors).some(Boolean) ||
    validated.amount == null ||
    !validated.occurredAt
  )
    return validated.errors;
  const userId = await currentUserId();
  const values = {
    user_id: userId,
    account_id: draft.accountId,
    destination_account_id:
      draft.transactionType === "transfer" ? draft.destinationAccountId : null,
    category_id: draft.transactionType === "transfer" ? null : draft.categoryId,
    transaction_type: draft.transactionType,
    amount_satang: validated.amount,
    occurred_at: validated.occurredAt,
    note: draft.note.trim() || null,
  };
  const result = id
    ? await supabase
        .from("transactions")
        .update(values)
        .eq("id", id)
        .eq("user_id", userId)
    : await supabase.from("transactions").insert(values);
  if (result.error) throw result.error;
  return {};
}

export async function deleteTransaction(id: string) {
  const userId = await currentUserId();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);
  if (error) throw error;
}
