import { updatePassword } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "ตั้งรหัสผ่านใหม่" };

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="ตั้งรหัสผ่านใหม่"
      description="ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร"
    >
      <AuthForm action={updatePassword} mode="reset" />
    </AuthCard>
  );
}
