import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { createClient } from "@/lib/supabase/server";
import { isoToBangkokLocalInput } from "@/lib/transactions";

export const metadata = { title: "เพิ่มรายการ" };
export const dynamic = "force-dynamic";

export default async function NewTransactionPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at"),
    supabase
      .from("categories")
      .select("id, name, transaction_type, color, icon")
      .eq("user_id", userId)
      .order("name"),
  ]);
  return (
    <AppShell>
      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle className="text-xl">เพิ่มรายการ</CardTitle>
        </CardHeader>
        <CardContent>
          {accounts?.length ? (
            <TransactionForm
              accounts={accounts}
              categories={categories ?? []}
              defaults={{
                transactionType: "expense",
                amount: "",
                accountId: accounts[0].id,
                destinationAccountId: "",
                categoryId: "",
                occurredAt: isoToBangkokLocalInput(new Date().toISOString()),
                note: "",
              }}
            />
          ) : (
            <p className="text-muted-foreground">
              กรุณาสร้างบัญชีที่ใช้งานก่อนเพิ่มรายการ
            </p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
