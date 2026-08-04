import { redirect } from "next/navigation";
import { CircleDollarSign, ListChecks, PiggyBank, Sprout } from "lucide-react";

import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatSatang } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "ภาพรวม" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: profile }, { data: accounts }] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, onboarding_completed_at")
      .eq("id", userId)
      .single(),
    supabase
      .from("accounts")
      .select("initial_balance_satang, is_active")
      .eq("user_id", userId),
  ]);
  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const initialBalance =
    accounts?.reduce(
      (sum, account) => sum + Number(account.initial_balance_satang),
      0,
    ) ?? 0;

  return (
    <main className="bg-muted/30 min-h-svh">
      <header className="bg-background border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2 font-semibold">
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Sprout className="size-4" />
            </span>
            EasyLife
          </div>
          <form action={logout}>
            <Button variant="ghost">ออกจากระบบ</Button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <div>
          <p className="text-muted-foreground text-sm">สวัสดี</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {profile.display_name ?? "ผู้ใช้ EasyLife"}
          </h1>
        </div>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="ยอดตั้งต้นรวม"
            value={formatSatang(initialBalance)}
            icon={CircleDollarSign}
          />
          <SummaryCard
            title="บัญชีที่ใช้งาน"
            value={`${accounts?.filter((account) => account.is_active).length ?? 0} บัญชี`}
            icon={PiggyBank}
          />
          <SummaryCard
            title="รายการเดือนนี้"
            value="0 รายการ"
            icon={ListChecks}
          />
          <SummaryCard title="Quest วันนี้" value="0 / 0" icon={Sprout} />
        </section>
        <Card>
          <CardHeader>
            <CardTitle>Foundation พร้อมแล้ว</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground space-y-2 text-sm">
            <p>
              Authentication, onboarding, database schema และ RLS
              ถูกเชื่อมต่อแล้ว
            </p>
            <p>
              Phase ถัดไปจะเพิ่มบัญชี หมวดหมู่ และการบันทึกธุรกรรมจริงบน
              Dashboard นี้
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: typeof Sprout;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-muted-foreground text-sm font-medium">
          {title}
        </CardTitle>
        <Icon className="text-primary size-4" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
