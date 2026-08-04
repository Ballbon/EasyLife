import { redirect } from "next/navigation";
import { Check, Clock3, ShieldCheck } from "lucide-react";

import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "ตั้งค่าเริ่มต้น" };
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, onboarding_completed_at")
    .eq("id", userId)
    .single();
  if (profile?.onboarding_completed_at) redirect("/dashboard");

  return (
    <main className="min-h-svh bg-linear-to-br from-emerald-50 via-white to-teal-50 px-4 py-10">
      <div className="mx-auto grid max-w-4xl gap-8 lg:grid-cols-[1fr_440px] lg:items-center">
        <section className="hidden space-y-6 lg:block">
          <p className="text-primary font-semibold">EasyLife</p>
          <h1 className="text-4xl font-semibold tracking-tight">
            เริ่มเห็นภาพการเงินของคุณในไม่กี่นาที
          </h1>
          <p className="text-muted-foreground text-lg">
            สร้างบัญชีแรก จากนั้นระบบจะเตรียมหมวดหมู่พื้นฐานให้พร้อมบันทึกรายการ
          </p>
          <ul className="space-y-4 text-sm">
            <Feature icon={Clock3}>ตั้งค่าเพียงครั้งเดียว</Feature>
            <Feature icon={Check}>ยอดตั้งต้นไม่ถูกนับเป็นรายรับ</Feature>
            <Feature icon={ShieldCheck}>
              ข้อมูลถูกแยกด้วย Row Level Security
            </Feature>
          </ul>
        </section>
        <Card className="shadow-xl shadow-emerald-900/5">
          <CardHeader>
            <CardTitle className="text-2xl">ตั้งค่าเริ่มต้น</CardTitle>
            <CardDescription>
              ข้อมูลนี้แก้ไขภายหลังได้ใน Settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <OnboardingForm defaultName={profile?.display_name ?? ""} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Feature({
  icon: Icon,
  children,
}: {
  icon: typeof Check;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-center gap-3">
      <span className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        <Icon className="size-4" />
      </span>
      {children}
    </li>
  );
}
