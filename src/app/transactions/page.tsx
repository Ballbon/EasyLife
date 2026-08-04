import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Search,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatSatang } from "@/lib/money";
import { createClient } from "@/lib/supabase/server";
import {
  formatBangkokDateTime,
  transactionTypeLabels,
  type TransactionType,
} from "@/lib/transactions";
import { cn } from "@/lib/utils";

export const metadata = { title: "ประวัติรายการ" };
export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const filters = await searchParams;
  const value = (key: string) =>
    typeof filters[key] === "string" ? filters[key] : "";
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");

  const [{ data: accounts }, { data: categories }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, name")
      .eq("user_id", userId)
      .order("name"),
    supabase
      .from("categories")
      .select("id, name")
      .eq("user_id", userId)
      .order("name"),
  ]);
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("occurred_at", { ascending: false })
    .limit(200);
  if (["income", "expense", "transfer"].includes(value("type")))
    query = query.eq("transaction_type", value("type"));
  if (accounts?.some((account) => account.id === value("account")))
    query = query.or(
      `account_id.eq.${value("account")},destination_account_id.eq.${value("account")}`,
    );
  if (categories?.some((category) => category.id === value("category")))
    query = query.eq("category_id", value("category"));
  if (/^\d{4}-\d{2}-\d{2}$/.test(value("from")))
    query = query.gte("occurred_at", `${value("from")}T00:00:00+07:00`);
  if (/^\d{4}-\d{2}-\d{2}$/.test(value("to")))
    query = query.lte("occurred_at", `${value("to")}T23:59:59.999+07:00`);
  const { data: rawTransactions } = await query;
  const accountNames = new Map(accounts?.map((item) => [item.id, item.name]));
  const categoryNames = new Map(
    categories?.map((item) => [item.id, item.name]),
  );
  const search = value("q").trim().toLocaleLowerCase("th");
  const transactions = (rawTransactions ?? []).filter((item) => {
    if (!search) return true;
    return [
      item.note,
      accountNames.get(item.account_id),
      item.destination_account_id
        ? accountNames.get(item.destination_account_id)
        : "",
      item.category_id ? categoryNames.get(item.category_id) : "",
    ].some((text) => text?.toLocaleLowerCase("th").includes(search));
  });

  return (
    <AppShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-muted-foreground text-sm">การเงินของคุณ</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            รายการทั้งหมด
          </h1>
        </div>
        <Link href="/transactions/new" className={buttonVariants()}>
          เพิ่มรายการ
        </Link>
      </div>
      <Card className="mb-6">
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="relative sm:col-span-2">
              <Search className="text-muted-foreground absolute top-2.5 left-2.5 size-4" />
              <Input
                name="q"
                defaultValue={value("q")}
                placeholder="ค้นหาโน้ต บัญชี หมวดหมู่"
                className="pl-8"
              />
            </div>
            <FilterSelect
              name="type"
              defaultValue={value("type")}
              label="ทุกประเภท"
              options={[
                { id: "expense", name: "รายจ่าย" },
                { id: "income", name: "รายรับ" },
                { id: "transfer", name: "โอนเงิน" },
              ]}
            />
            <FilterSelect
              name="account"
              defaultValue={value("account")}
              label="ทุกบัญชี"
              options={accounts ?? []}
            />
            <FilterSelect
              name="category"
              defaultValue={value("category")}
              label="ทุกหมวดหมู่"
              options={categories ?? []}
            />
            <button className={buttonVariants()} type="submit">
              กรองรายการ
            </button>
            <Input
              name="from"
              type="date"
              defaultValue={value("from")}
              aria-label="ตั้งแต่วันที่"
            />
            <Input
              name="to"
              type="date"
              defaultValue={value("to")}
              aria-label="ถึงวันที่"
            />
            <Link
              href="/transactions"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "sm:col-span-2",
              )}
            >
              ล้างตัวกรอง
            </Link>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {transactions.length ? (
          transactions.map((item) => {
            const type = item.transaction_type as TransactionType;
            const Icon =
              type === "expense"
                ? ArrowUpRight
                : type === "income"
                  ? ArrowDownLeft
                  : ArrowLeftRight;
            const title =
              type === "transfer"
                ? `${accountNames.get(item.account_id) ?? "บัญชี"} → ${accountNames.get(item.destination_account_id ?? "") ?? "บัญชี"}`
                : (categoryNames.get(item.category_id ?? "") ??
                  transactionTypeLabels[type]);
            return (
              <Link
                key={item.id}
                href={`/transactions/${item.id}/edit`}
                className="block"
              >
                <Card className="hover:bg-muted/50 transition-colors" size="sm">
                  <CardContent className="flex items-center gap-3">
                    <span
                      className={cn(
                        "flex size-10 items-center justify-center rounded-full",
                        type === "expense"
                          ? "bg-red-100 text-red-700"
                          : type === "income"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-blue-100 text-blue-700",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{title}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {item.note || accountNames.get(item.account_id)} ·{" "}
                        {formatBangkokDateTime(item.occurred_at)}
                      </p>
                    </div>
                    <p
                      className={cn(
                        "font-semibold tabular-nums",
                        type === "expense"
                          ? "text-red-600"
                          : type === "income"
                            ? "text-emerald-600"
                            : "text-foreground",
                      )}
                    >
                      {type === "expense" ? "−" : type === "income" ? "+" : ""}
                      {formatSatang(Number(item.amount_satang))}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        ) : (
          <Card>
            <CardContent className="text-muted-foreground py-10 text-center">
              ยังไม่พบรายการ ลองเปลี่ยนตัวกรองหรือเพิ่มรายการแรก
            </CardContent>
          </Card>
        )}
      </div>
    </AppShell>
  );
}

function FilterSelect({
  name,
  defaultValue,
  label,
  options,
}: {
  name: string;
  defaultValue: string;
  label: string;
  options: { id: string; name: string }[];
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      className="border-input bg-background h-8 w-full rounded-lg border px-2.5 text-sm"
    >
      <option value="">{label}</option>
      {options.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  );
}
