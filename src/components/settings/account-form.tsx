"use client";

import { useActionState } from "react";

import { createAccount } from "@/app/actions/finance-settings";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initialFormState } from "@/types/transactions";

export function AccountForm() {
  const [state, action, pending] = useActionState(
    createAccount,
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
        <Label htmlFor="name">ชื่อบัญชี</Label>
        <Input id="name" name="name" required maxLength={80} />
        <FieldError error={state.errors?.name?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="accountType">ประเภท</Label>
        <select
          id="accountType"
          name="accountType"
          className="border-input bg-background h-9 w-full rounded-lg border px-3 text-sm"
        >
          <option value="cash">เงินสด</option>
          <option value="bank">บัญชีธนาคาร</option>
          <option value="card">บัตร</option>
          <option value="ewallet">e-Wallet</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="initialBalance">ยอดตั้งต้น (บาท)</Label>
        <Input
          id="initialBalance"
          name="initialBalance"
          inputMode="decimal"
          defaultValue="0.00"
          required
        />
        <FieldError error={state.errors?.initialBalance?.[0]} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "กำลังเพิ่ม..." : "เพิ่มบัญชี"}
      </Button>
    </form>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="text-destructive text-sm">{error}</p> : null;
}
