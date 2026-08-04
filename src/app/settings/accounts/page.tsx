import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, EyeOff, WalletCards } from "lucide-react";

import { toggleAccount } from "@/app/actions/finance-settings";
import { AppShell } from "@/components/app-shell";
import { AccountForm } from "@/components/settings/account-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateAccountBalance, formatSatang } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import { accountTypeLabels } from "@/lib/transactions";
import { cn } from "@/lib/utils";

export const metadata = { title: "จัดการบัญชี" };
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: accounts }, { data: transactions }] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at"),
    supabase
      .from("transactions")
      .select(
        "account_id, destination_account_id, transaction_type, amount_satang",
      )
      .eq("user_id", userId),
  ]);
  return (
    <AppShell>
      <SettingsTabs active="accounts" />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-3">
          {accounts?.map((account) => {
            const balance = calculateAccountBalance(
              Number(account.initial_balance_satang),
              account.id,
              transactions ?? [],
            );
            return (
              <Card
                key={account.id}
                size="sm"
                className={cn(!account.is_active && "opacity-60")}
              >
                <CardContent className="flex items-center gap-3">
                  <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-full">
                    <WalletCards className="size-5" />
                  </span>
                  <div className="flex-1">
                    <p className="font-medium">{account.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {accountTypeLabels[account.account_type]} ·{" "}
                      {account.is_active ? "ใช้งาน" : "ซ่อนอยู่"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={cn(
                        "font-semibold",
                        balance < 0 && "text-destructive",
                      )}
                    >
                      {formatSatang(balance)}
                    </p>
                    <form
                      action={toggleAccount.bind(
                        null,
                        account.id,
                        !account.is_active,
                      )}
                    >
                      <Button type="submit" variant="ghost" size="sm">
                        {account.is_active ? <EyeOff /> : <Eye />}
                        {account.is_active ? "ซ่อน" : "เปิดใช้"}
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>เพิ่มบัญชี</CardTitle>
          </CardHeader>
          <CardContent>
            <AccountForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function SettingsTabs({ active }: { active: "accounts" | "categories" }) {
  return (
    <div className="mb-6">
      <h1 className="mb-4 text-3xl font-semibold">ตั้งค่าการเงิน</h1>
      <div className="flex gap-2">
        <Link
          href="/settings/accounts"
          className={cn(
            buttonVariants({
              variant: active === "accounts" ? "default" : "outline",
            }),
          )}
        >
          บัญชี
        </Link>
        <Link
          href="/settings/categories"
          className={cn(
            buttonVariants({
              variant: active === "categories" ? "default" : "outline",
            }),
          )}
        >
          หมวดหมู่
        </Link>
      </div>
    </div>
  );
}
