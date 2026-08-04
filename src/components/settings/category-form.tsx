"use client";

import { useActionState } from "react";

import { createCategory } from "@/app/actions/finance-settings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialFormState } from "@/types/transactions";

export function CategoryForm() {
  const [state, action, pending] = useActionState(
    createCategory,
    initialFormState,
  );
  return (
    <form action={action} className="space-y-4">
      {state.message ? (
        <Alert variant={state.status === "error" ? "destructive" : "default"}>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="name">ชื่อหมวดหมู่</Label>
        <Input id="name" name="name" required maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="transactionType">ประเภท</Label>
        <select
          id="transactionType"
          name="transactionType"
          className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
        >
          <option value="expense">รายจ่าย</option>
          <option value="income">รายรับ</option>
        </select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="icon">ไอคอน</Label>
          <select
            id="icon"
            name="icon"
            className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
          >
            <option value="circle">ทั่วไป</option>
            <option value="utensils">อาหาร</option>
            <option value="car">เดินทาง</option>
            <option value="home">บ้าน</option>
            <option value="briefcase">งาน</option>
            <option value="heart">สุขภาพ</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">สี</Label>
          <Input
            id="color"
            name="color"
            type="color"
            defaultValue="#16A34A"
            className="p-1"
          />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังเพิ่ม..." : "เพิ่มหมวดหมู่"}
      </Button>
    </form>
  );
}
