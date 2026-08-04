"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { AuthFormState } from "@/types/auth";

const emailSchema = z.string().trim().email("กรุณากรอกอีเมลให้ถูกต้อง");
const passwordSchema = z
  .string()
  .min(8, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร")
  .max(72, "รหัสผ่านยาวเกินไป");

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

const registerSchema = z
  .object({
    displayName: z
      .string()
      .trim()
      .min(2, "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร")
      .max(80, "ชื่อต้องไม่เกิน 80 ตัวอักษร"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
  });

function validationError(error: z.ZodError): AuthFormState {
  return {
    status: "error",
    message: "กรุณาตรวจสอบข้อมูลอีกครั้ง",
    errors: error.flatten().fieldErrors,
  };
}

export async function login(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return {
      status: "error",
      message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    };
  }

  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) {
    return { status: "error", message: "ไม่สามารถตรวจสอบผู้ใช้ได้" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed_at")
    .eq("id", userId)
    .maybeSingle();

  redirect(profile?.onboarding_completed_at ? "/dashboard" : "/onboarding");
}

export async function register(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
      emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    return {
      status: "error",
      message:
        error.code === "user_already_exists"
          ? "อีเมลนี้ถูกใช้งานแล้ว"
          : "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่",
    };
  }

  if (data.session) redirect("/onboarding");

  return {
    status: "success",
    message: "สมัครสำเร็จ กรุณาเปิดอีเมลเพื่อยืนยันบัญชี",
  };
}

export async function requestPasswordReset(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  return {
    status: "success",
    message: "หากอีเมลอยู่ในระบบ เราได้ส่งลิงก์ตั้งรหัสผ่านใหม่แล้ว",
  };
}

export async function updatePassword(
  _previousState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = z
    .object({
      password: passwordSchema,
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      path: ["confirmPassword"],
      message: "รหัสผ่านทั้งสองช่องไม่ตรงกัน",
    })
    .safeParse(Object.fromEntries(formData));

  if (!parsed.success) return validationError(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { status: "error", message: "ตั้งรหัสผ่านใหม่ไม่สำเร็จ" };
  }

  await supabase.auth.signOut();
  redirect("/login?reset=success");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
