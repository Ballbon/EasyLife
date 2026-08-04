import { notFound, redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { DeleteTransactionButton } from "@/components/transactions/delete-transaction-button";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import {
  isoToBangkokLocalInput,
  type TransactionType,
} from "@/lib/transactions";

export const metadata = { title: "แก้ไขรายการ" };
export const dynamic = "force-dynamic";

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: transaction }, { data: accounts }, { data: categories }] =
    await Promise.all([
      supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("accounts")
        .select("id, name")
        .eq("user_id", userId)
        .order("created_at"),
      supabase
        .from("categories")
        .select("id, name, transaction_type, color, icon")
        .eq("user_id", userId)
        .order("name"),
    ]);
  if (!transaction) notFound();
  return (
    <AppShell>
      <Card className="mx-auto max-w-2xl">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-xl">แก้ไขรายการ</CardTitle>
          <DeleteTransactionButton id={transaction.id} />
        </CardHeader>
        <CardContent>
          <TransactionForm
            accounts={accounts ?? []}
            categories={categories ?? []}
            defaults={{
              id: transaction.id,
              transactionType: transaction.transaction_type as TransactionType,
              amount: (Number(transaction.amount_satang) / 100).toFixed(2),
              accountId: transaction.account_id,
              destinationAccountId: transaction.destination_account_id ?? "",
              categoryId: transaction.category_id ?? "",
              occurredAt: isoToBangkokLocalInput(transaction.occurred_at),
              note: transaction.note ?? "",
            }}
          />
        </CardContent>
      </Card>
    </AppShell>
  );
}
