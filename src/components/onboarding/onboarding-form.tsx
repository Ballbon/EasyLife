"use client";

import { useActionState } from "react";

import { completeOnboarding } from "@/app/actions/onboarding";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialAuthState } from "@/types/auth";

export function OnboardingForm({ defaultName = "" }: { defaultName?: string }) {
  const [state, action, pending] = useActionState(
    completeOnboarding,
    initialAuthState,
  );

  return (
    <form action={action} className="space-y-5">
      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="displayName">ชื่อที่ใช้ในแอป</Label>
        <Input
          id="displayName"
          name="displayName"
          defaultValue={defaultName}
          required
          maxLength={80}
        />
        <FieldError error={state.errors?.displayName?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accountName">ชื่อบัญชีแรก</Label>
        <Input
          id="accountName"
          name="accountName"
          defaultValue="เงินสด"
          required
          maxLength={80}
        />
        <FieldError error={state.errors?.accountName?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accountType">ประเภทบัญชี</Label>
        <select
          id="accountType"
          name="accountType"
          defaultValue="cash"
          className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm shadow-xs outline-none focus-visible:ring-2"
        >
          <option value="cash">เงินสด</option>
          <option value="bank">บัญชีธนาคาร</option>
          <option value="card">บัตร</option>
          <option value="ewallet">e-Wallet</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="initialBalance">ยอดคงเหลือปัจจุบัน (บาท)</Label>
        <Input
          id="initialBalance"
          name="initialBalance"
          inputMode="decimal"
          defaultValue="0.00"
          placeholder="0.00"
          required
        />
        <p className="text-muted-foreground text-xs">
          ยอดนี้จะเป็นจุดเริ่มต้นในการคำนวณ ไม่ถูกนับเป็นรายรับ
        </p>
        <FieldError error={state.errors?.initialBalance?.[0]} />
      </div>
      <Button className="w-full" size="lg" disabled={pending}>
        {pending ? "กำลังตั้งค่า..." : "เริ่มใช้ EasyLife"}
      </Button>
    </form>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="text-destructive text-sm">{error}</p> : null;
}
