"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, LogOut, Plus, Settings, Sprout } from "lucide-react";

import { logout } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "หน้าหลัก", icon: Home },
  { href: "/transactions", label: "รายการ", icon: List },
  { href: "/settings/accounts", label: "ตั้งค่า", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="bg-muted/30 min-h-svh pb-20">
      <header className="bg-background sticky top-0 z-30 border-b">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <span className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg">
              <Sprout className="size-4" />
            </span>
            EasyLife
          </Link>
          <form action={logout}>
            <Button type="submit" variant="ghost" aria-label="ออกจากระบบ">
              <LogOut className="size-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </Button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">{children}</main>
      {(pathname === "/dashboard" || pathname.startsWith("/transactions")) && (
        <Link
          href="/transactions/new"
          aria-label="เพิ่มรายการ"
          className={cn(
            buttonVariants({ size: "icon-lg" }),
            "fixed right-5 bottom-20 z-40 size-14 rounded-full shadow-lg sm:right-8",
          )}
        >
          <Plus className="size-6" />
        </Link>
      )}
      <nav className="bg-background fixed inset-x-0 bottom-0 z-30 border-t">
        <div className="mx-auto grid h-16 max-w-md grid-cols-3">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(
                  item.href.split("/").slice(0, 2).join("/"),
                ));
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-muted-foreground flex flex-col items-center justify-center gap-1 text-xs",
                  active && "text-primary font-medium",
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
