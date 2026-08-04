"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { parseMoneyToSatang } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import type { AuthFormState } from "@/types/auth";

const onboardingSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  accountName: z.string().trim().min(1).max(80),
  accountType: z.enum(["cash", "bank", "card", "ewallet"]),
  initialBalance: z.string(),
});

export async function completeOnboarding(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = onboardingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      status: "error",
      message: "กรุณากรอกข้อมูลให้ครบ",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const initialBalance = parseMoneyToSatang(parsed.data.initialBalance);
  if (initialBalance === null) {
    return {
      status: "error",
      message: "ยอดตั้งต้นต้องเป็นจำนวนเงินบาทไม่เกิน 2 ตำแหน่งทศนิยม",
      errors: { initialBalance: ["ตัวอย่าง: 1250.50"] },
    };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims?.sub) redirect("/login");

  const { error } = await supabase.rpc("complete_onboarding", {
    display_name_input: parsed.data.displayName,
    account_name_input: parsed.data.accountName,
    account_type_input: parsed.data.accountType,
    initial_balance_satang_input: initialBalance,
  });

  if (error) {
    return {
      status: "error",
      message: "ตั้งค่าเริ่มต้นไม่สำเร็จ กรุณาลองใหม่",
    };
  }

  redirect("/dashboard");
}
