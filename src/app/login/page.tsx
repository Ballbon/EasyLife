import Link from "next/link";

import { login } from "@/app/actions/auth";
import { AuthCard } from "@/components/auth/auth-card";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata = { title: "เข้าสู่ระบบ" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <AuthCard
      title="ยินดีต้อนรับกลับ"
      description="เข้าสู่ระบบเพื่อดูสถานะการเงินและ Quest ของคุณ"
      footer={
        <>
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/register"
            className="text-primary font-medium hover:underline"
          >
            สมัครสมาชิก
          </Link>
        </>
      }
    >
      {params.reset === "success" ? (
        <p className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          ตั้งรหัสผ่านใหม่สำเร็จแล้ว กรุณาเข้าสู่ระบบ
        </p>
      ) : null}
      {params.error === "callback" ? (
        <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-800">
          ลิงก์ไม่ถูกต้องหรือหมดอายุ กรุณาลองใหม่
        </p>
      ) : null}
      <AuthForm action={login} mode="login" />
    </AuthCard>
  );
}
