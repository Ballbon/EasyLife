import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  CircleDollarSign,
  ListChecks,
  PiggyBank,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAccountBalance, formatSatang } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import {
  formatBangkokDateTime,
  transactionTypeLabels,
  type TransactionType,
} from "@/lib/transactions";
import { cn } from "@/lib/utils";

export const metadata = { title: "ภาพรวม" };
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const [
    { data: profile },
    { data: accounts },
    { data: transactions },
    { data: categories },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, onboarding_completed_at")
      .eq("id", userId)
      .single(),
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("occurred_at", { ascending: false }),
    supabase.from("categories").select("id, name").eq("user_id", userId),
  ]);
  if (!profile?.onboarding_completed_at) redirect("/onboarding");

  const allTransactions = transactions ?? [];
  const totalBalance = (accounts ?? []).reduce(
    (sum, account) =>
      sum +
      calculateAccountBalance(
        Number(account.initial_balance_satang),
        account.id,
        allTransactions,
      ),
    0,
  );
  const bangkokToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const monthPrefix = bangkokToday.slice(0, 7);
  const monthly = allTransactions.filter((item) => {
    const localDate = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Bangkok",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date(item.occurred_at));
    return localDate.startsWith(monthPrefix);
  });
  const income = monthly
    .filter((item) => item.transaction_type === "income")
    .reduce((sum, item) => sum + Number(item.amount_satang), 0);
  const expense = monthly
    .filter((item) => item.transaction_type === "expense")
    .reduce((sum, item) => sum + Number(item.amount_satang), 0);
  const accountNames = new Map(accounts?.map((item) => [item.id, item.name]));
  const categoryNames = new Map(
    categories?.map((item) => [item.id, item.name]),
  );

  return (
    <AppShell>
      <div className="mb-8">
        <p className="text-muted-foreground text-sm">สวัสดี</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {profile.display_name ?? "ผู้ใช้ EasyLife"}
        </h1>
      </div>
      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="ยอดคงเหลือรวม"
          value={formatSatang(totalBalance)}
          icon={CircleDollarSign}
          destructive={totalBalance < 0}
        />
        <SummaryCard
          title="รายรับเดือนนี้"
          value={formatSatang(income)}
          icon={ArrowDownLeft}
        />
        <SummaryCard
          title="รายจ่ายเดือนนี้"
          value={formatSatang(expense)}
          icon={ArrowUpRight}
        />
        <SummaryCard
          title="รายการเดือนนี้"
          value={`${monthly.length} รายการ`}
          icon={ListChecks}
        />
      </section>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>รายการล่าสุด</CardTitle>
            <Link
              href="/transactions"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              ดูทั้งหมด
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {allTransactions.length ? (
              allTransactions.slice(0, 5).map((item) => {
                const type = item.transaction_type as TransactionType;
                const Icon =
                  type === "expense"
                    ? ArrowUpRight
                    : type === "income"
                      ? ArrowDownLeft
                      : ArrowLeftRight;
                const title =
                  type === "transfer"
                    ? `${accountNames.get(item.account_id)} → ${accountNames.get(item.destination_account_id ?? "")}`
                    : (categoryNames.get(item.category_id ?? "") ??
                      transactionTypeLabels[type]);
                return (
                  <Link
                    key={item.id}
                    href={`/transactions/${item.id}/edit`}
                    className="hover:bg-muted flex items-center gap-3 rounded-lg p-2"
                  >
                    <Icon className="text-muted-foreground size-4" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{title}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatBangkokDateTime(item.occurred_at)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "font-semibold",
                        type === "expense" && "text-red-600",
                        type === "income" && "text-emerald-600",
                      )}
                    >
                      {type === "expense" ? "−" : type === "income" ? "+" : ""}
                      {formatSatang(Number(item.amount_satang))}
                    </p>
                  </Link>
                );
              })
            ) : (
              <div className="text-muted-foreground py-10 text-center">
                <p>ยังไม่มีรายการ</p>
                <Link
                  href="/transactions/new"
                  className={buttonVariants({ variant: "link" })}
                >
                  เพิ่มรายการแรก
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>บัญชีของฉัน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {accounts?.map((account) => {
              const balance = calculateAccountBalance(
                Number(account.initial_balance_satang),
                account.id,
                allTransactions,
              );
              return (
                <div key={account.id} className="flex items-center gap-2">
                  <PiggyBank className="text-primary size-4" />
                  <span className="min-w-0 flex-1 truncate">
                    {account.name}
                  </span>
                  <span
                    className={cn(
                      "font-medium",
                      balance < 0 && "text-destructive",
                    )}
                  >
                    {formatSatang(balance)}
                  </span>
                </div>
              );
            })}
            <Link
              href="/settings/accounts"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "mt-2 w-full",
              )}
            >
              จัดการบัญชี
            </Link>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  destructive = false,
}: {
  title: string;
  value: string;
  icon: typeof CircleDollarSign;
  destructive?: boolean;
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
        <p
          className={cn(
            "text-2xl font-semibold",
            destructive && "text-destructive",
          )}
        >
          {value}
        </p>
        {destructive ? (
          <p className="text-destructive mt-1 text-xs">ยอดบัญชีติดลบ</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
