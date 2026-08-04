"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { parseMoneyToSatang } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { bangkokLocalInputToIso, transactionTypes } from "@/lib/transactions";
import type { FormState } from "@/types/transactions";

const uuid = z.string().uuid("ข้อมูลที่เลือกไม่ถูกต้อง");
const transactionSchema = z.object({
  transactionType: z.enum(transactionTypes),
  amount: z.string(),
  accountId: uuid,
  destinationAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  occurredAt: z.string(),
  note: z.string().trim().max(500, "โน้ตต้องไม่เกิน 500 ตัวอักษร").optional(),
});

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

function invalid(errors: Record<string, string[]>): FormState {
  return { status: "error", message: "กรุณาตรวจสอบข้อมูลอีกครั้ง", errors };
}

async function saveTransaction(
  transactionId: string | null,
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = transactionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error.flatten().fieldErrors);

  const amount = parseMoneyToSatang(parsed.data.amount);
  if (amount === null || amount < 1 || amount > 99_999_999_999) {
    return invalid({
      amount: ["จำนวนต้องมากกว่า 0 และไม่เกิน ฿999,999,999.99"],
    });
  }
  const occurredAt = bangkokLocalInputToIso(parsed.data.occurredAt);
  if (!occurredAt) return invalid({ occurredAt: ["วันที่และเวลาไม่ถูกต้อง"] });

  const { supabase, userId } = await authenticatedClient();
  const { data: accounts } = await supabase
    .from("accounts")
    .select("id")
    .eq("user_id", userId)
    .in(
      "id",
      [parsed.data.accountId, parsed.data.destinationAccountId].filter(
        Boolean,
      ) as string[],
    );
  if (!accounts?.some((account) => account.id === parsed.data.accountId)) {
    return invalid({ accountId: ["ไม่พบบัญชีต้นทาง"] });
  }

  let categoryId: string | null = null;
  let destinationAccountId: string | null = null;
  if (parsed.data.transactionType === "transfer") {
    destinationAccountId = parsed.data.destinationAccountId ?? null;
    if (
      !destinationAccountId ||
      destinationAccountId === parsed.data.accountId
    ) {
      return invalid({
        destinationAccountId: ["บัญชีปลายทางต้องต่างจากบัญชีต้นทาง"],
      });
    }
    if (!accounts?.some((account) => account.id === destinationAccountId)) {
      return invalid({ destinationAccountId: ["ไม่พบบัญชีปลายทาง"] });
    }
  } else {
    categoryId = parsed.data.categoryId ?? null;
    if (!categoryId) return invalid({ categoryId: ["กรุณาเลือกหมวดหมู่"] });
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("id", categoryId)
      .eq("user_id", userId)
      .eq("transaction_type", parsed.data.transactionType)
      .maybeSingle();
    if (!category)
      return invalid({ categoryId: ["หมวดหมู่ไม่ตรงกับประเภทรายการ"] });
  }

  const values = {
    user_id: userId,
    account_id: parsed.data.accountId,
    destination_account_id: destinationAccountId,
    category_id: categoryId,
    transaction_type: parsed.data.transactionType,
    amount_satang: amount,
    occurred_at: occurredAt,
    note: parsed.data.note || null,
  };
  if (transactionId) {
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("id", transactionId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!existing) {
      return { status: "error", message: "ไม่พบรายการที่ต้องการแก้ไข" };
    }
  }
  const query = transactionId
    ? supabase
        .from("transactions")
        .update(values)
        .eq("id", transactionId)
        .eq("user_id", userId)
    : supabase.from("transactions").insert(values);
  const { error } = await query;
  if (error)
    return { status: "error", message: "บันทึกรายการไม่สำเร็จ กรุณาลองใหม่" };

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/settings/accounts");
  redirect("/transactions");
}

export async function createTransaction(
  previousState: FormState,
  formData: FormData,
) {
  return saveTransaction(null, previousState, formData);
}

export async function updateTransaction(
  transactionId: string,
  previousState: FormState,
  formData: FormData,
) {
  if (!z.string().uuid().safeParse(transactionId).success) return invalid({});
  return saveTransaction(transactionId, previousState, formData);
}

export async function deleteTransaction(transactionId: string) {
  if (!z.string().uuid().safeParse(transactionId).success) return;
  const { supabase, userId } = await authenticatedClient();
  await supabase
    .from("transactions")
    .delete()
    .eq("id", transactionId)
    .eq("user_id", userId);
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/settings/accounts");
  redirect("/transactions");
}
