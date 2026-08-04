import Link from "next/link";
import { redirect } from "next/navigation";
import { Trash2 } from "lucide-react";

import { deleteCategory } from "@/app/actions/finance-settings";
import { AppShell } from "@/components/app-shell";
import { CategoryForm } from "@/components/settings/category-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "จัดการหมวดหมู่" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: categories }, { data: transactions }] = await Promise.all([
    supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("transaction_type")
      .order("name"),
    supabase.from("transactions").select("category_id").eq("user_id", userId),
  ]);
  const usage = new Map<string, number>();
  transactions?.forEach((item) => {
    if (item.category_id)
      usage.set(item.category_id, (usage.get(item.category_id) ?? 0) + 1);
  });
  return (
    <AppShell>
      <div className="mb-6">
        <h1 className="mb-4 text-3xl font-semibold">ตั้งค่าการเงิน</h1>
        <div className="flex gap-2">
          <Link
            href="/settings/accounts"
            className={buttonVariants({ variant: "outline" })}
          >
            บัญชี
          </Link>
          <Link href="/settings/categories" className={buttonVariants()}>
            หมวดหมู่
          </Link>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid gap-3 sm:grid-cols-2">
          {categories?.map((category) => (
            <Card key={category.id} size="sm">
              <CardContent className="flex items-center gap-3">
                <span
                  className="size-4 rounded-full"
                  style={{ backgroundColor: category.color }}
                />
                <div className="flex-1">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {category.transaction_type === "expense"
                      ? "รายจ่าย"
                      : "รายรับ"}{" "}
                    · {usage.get(category.id) ?? 0} รายการ
                  </p>
                </div>
                {!category.is_default && !usage.get(category.id) ? (
                  <form action={deleteCategory.bind(null, category.id)}>
                    <Button
                      type="submit"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`ลบ ${category.name}`}
                    >
                      <Trash2 />
                    </Button>
                  </form>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <CardTitle>เพิ่มหมวดหมู่</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryForm />
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
