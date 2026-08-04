"use client";

import Link from "next/link";
import { useActionState, useState } from "react";

import {
  createTransaction,
  updateTransaction,
} from "@/app/actions/transactions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  transactionTypeLabels,
  type TransactionType,
} from "@/lib/transactions";
import { cn } from "@/lib/utils";
import { initialFormState } from "@/types/transactions";

type Option = { id: string; name: string };
type CategoryOption = Option & {
  transaction_type: string;
  color: string;
  icon: string;
};
type Defaults = {
  id?: string;
  transactionType: TransactionType;
  amount: string;
  accountId: string;
  destinationAccountId: string;
  categoryId: string;
  occurredAt: string;
  note: string;
};

export function TransactionForm({
  accounts,
  categories,
  defaults,
}: {
  accounts: Option[];
  categories: CategoryOption[];
  defaults: Defaults;
}) {
  const action = defaults.id
    ? updateTransaction.bind(null, defaults.id)
    : createTransaction;
  const [state, formAction, pending] = useActionState(action, initialFormState);
  const [type, setType] = useState<TransactionType>(defaults.transactionType);
  const filteredCategories = categories.filter(
    (category) => category.transaction_type === type,
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.message ? (
        <Alert variant="destructive">
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      ) : null}
      <fieldset className="grid grid-cols-3 gap-2">
        <legend className="sr-only">ประเภทรายการ</legend>
        {(["expense", "income", "transfer"] as const).map((item) => (
          <label
            key={item}
            className={cn(
              "border-input cursor-pointer rounded-lg border px-3 py-2 text-center text-sm font-medium",
              type === item &&
                "border-primary bg-primary text-primary-foreground",
            )}
          >
            <input
              className="sr-only"
              type="radio"
              name="transactionType"
              value={item}
              checked={type === item}
              onChange={() => setType(item)}
            />
            {transactionTypeLabels[item]}
          </label>
        ))}
      </fieldset>
      <div className="space-y-2">
        <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
        <Input
          id="amount"
          name="amount"
          inputMode="decimal"
          placeholder="0.00"
          defaultValue={defaults.amount}
          required
          className="h-12 text-2xl font-semibold"
        />
        <FieldError error={state.errors?.amount?.[0]} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          name="accountId"
          label={type === "transfer" ? "บัญชีต้นทาง" : "บัญชี"}
          defaultValue={defaults.accountId}
          options={accounts}
          error={state.errors?.accountId?.[0]}
        />
        {type === "transfer" ? (
          <SelectField
            name="destinationAccountId"
            label="บัญชีปลายทาง"
            defaultValue={defaults.destinationAccountId}
            options={accounts}
            error={state.errors?.destinationAccountId?.[0]}
          />
        ) : (
          <SelectField
            name="categoryId"
            label="หมวดหมู่"
            defaultValue={defaults.categoryId}
            options={filteredCategories}
            error={state.errors?.categoryId?.[0]}
          />
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="occurredAt">วันที่และเวลา (เวลาไทย)</Label>
        <Input
          id="occurredAt"
          name="occurredAt"
          type="datetime-local"
          defaultValue={defaults.occurredAt}
          required
        />
        <FieldError error={state.errors?.occurredAt?.[0]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="note">โน้ต</Label>
        <textarea
          id="note"
          name="note"
          defaultValue={defaults.note}
          maxLength={500}
          placeholder="เพิ่มรายละเอียด..."
          className="border-input bg-background focus-visible:border-ring focus-visible:ring-ring/50 min-h-24 w-full rounded-lg border px-3 py-2 text-sm outline-none focus-visible:ring-3"
        />
        <FieldError error={state.errors?.note?.[0]} />
      </div>
      <div className="flex gap-3">
        <Link
          href="/transactions"
          className={cn(
            buttonVariants({ variant: "outline", size: "lg" }),
            "flex-1",
          )}
        >
          ยกเลิก
        </Link>
        <Button type="submit" size="lg" className="flex-1" disabled={pending}>
          {pending ? "กำลังบันทึก..." : "บันทึกรายการ"}
        </Button>
      </div>
    </form>
  );
}

function SelectField({
  name,
  label,
  defaultValue,
  options,
  error,
}: {
  name: string;
  label: string;
  defaultValue: string;
  options: Option[];
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        required
        className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-2"
      >
        <option value="">เลือก{label}</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.name}
          </option>
        ))}
      </select>
      <FieldError error={error} />
    </div>
  );
}

function FieldError({ error }: { error?: string }) {
  return error ? <p className="text-destructive text-sm">{error}</p> : null;
}
