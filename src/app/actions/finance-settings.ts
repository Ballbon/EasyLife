"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { parseMoneyToSatang } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/types/transactions";

const accountSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อบัญชี").max(80),
  accountType: z.enum(["cash", "bank", "card", "ewallet"]),
  initialBalance: z.string(),
});
const categorySchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อหมวดหมู่").max(80),
  transactionType: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  icon: z.string().trim().min(1).max(40),
});

async function authenticatedClient() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  return { supabase, userId };
}

export async function createAccount(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "กรุณาตรวจสอบข้อมูลบัญชี",
      errors: parsed.error.flatten().fieldErrors,
    };
  }
  const initialBalance = parseMoneyToSatang(parsed.data.initialBalance);
  if (initialBalance === null) {
    return {
      status: "error",
      message: "ยอดตั้งต้นไม่ถูกต้อง",
      errors: { initialBalance: ["กรอกเป็นเงินบาทไม่เกิน 2 ตำแหน่ง"] },
    };
  }
  const { supabase, userId } = await authenticatedClient();
  const { error } = await supabase.from("accounts").insert({
    user_id: userId,
    name: parsed.data.name,
    account_type: parsed.data.accountType,
    initial_balance_satang: initialBalance,
  });
  if (error) return { status: "error", message: "เพิ่มบัญชีไม่สำเร็จ" };
  revalidatePath("/settings/accounts");
  revalidatePath("/transactions/new");
  revalidatePath("/dashboard");
  return { status: "success", message: "เพิ่มบัญชีแล้ว" };
}

export async function toggleAccount(accountId: string, isActive: boolean) {
  if (!z.string().uuid().safeParse(accountId).success) return;
  const { supabase, userId } = await authenticatedClient();
  await supabase
    .from("accounts")
    .update({ is_active: isActive })
    .eq("id", accountId)
    .eq("user_id", userId);
  revalidatePath("/settings/accounts");
  revalidatePath("/transactions/new");
  revalidatePath("/dashboard");
}

export async function createCategory(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "กรุณาตรวจสอบข้อมูลหมวดหมู่",
      errors: parsed.error.flatten().fieldErrors,
    };
  }
  const { supabase, userId } = await authenticatedClient();
  const { error } = await supabase.from("categories").insert({
    user_id: userId,
    name: parsed.data.name,
    transaction_type: parsed.data.transactionType,
    color: parsed.data.color,
    icon: parsed.data.icon,
  });
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505"
          ? "มีชื่อหมวดหมู่นี้แล้ว"
          : "เพิ่มหมวดหมู่ไม่สำเร็จ",
    };
  }
  revalidatePath("/settings/categories");
  revalidatePath("/transactions/new");
  return { status: "success", message: "เพิ่มหมวดหมู่แล้ว" };
}

export async function deleteCategory(categoryId: string) {
  if (!z.string().uuid().safeParse(categoryId).success) return;
  const { supabase, userId } = await authenticatedClient();
  const { count } = await supabase
    .from("transactions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("category_id", categoryId);
  if (count) return;
  await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId)
    .eq("is_default", false);
  revalidatePath("/settings/categories");
  revalidatePath("/transactions/new");
}
