import Link from "next/link";

import { register } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "สมัครสมาชิก" };

export default function RegisterPage() {
  return (
    <AuthCard
      title="เริ่มต้นใช้ EasyLife"
      description="สร้างบัญชีเพื่อจัดการเงินและสิ่งสำคัญในแต่ละวัน"
      footer={
        <>
          มีบัญชีแล้ว?{" "}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
            เข้าสู่ระบบ
          </Link>
        </>
      }
    >
      <AuthForm action={register} mode="register" />
    </AuthCard>
  );
}
