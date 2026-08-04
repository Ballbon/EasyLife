import Link from "next/link";

import { requestPasswordReset } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "ลืมรหัสผ่าน" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="ลืมรหัสผ่าน"
      description="กรอกอีเมล เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ให้คุณ"
      footer={
        <Link
          href="/login"
          className="text-primary font-medium hover:underline"
        >
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      }
    >
      <AuthForm action={requestPasswordReset} mode="forgot" />
    </AuthCard>
  );
}
