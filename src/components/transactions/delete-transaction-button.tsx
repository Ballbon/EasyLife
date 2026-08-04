"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import { deleteTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";

export function DeleteTransactionButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="destructive"
      disabled={pending}
      onClick={() => {
        if (window.confirm("ยืนยันการลบรายการนี้?"))
          startTransition(() => deleteTransaction(id));
      }}
    >
      <Trash2 className="size-4" />
      {pending ? "กำลังลบ..." : "ลบรายการ"}
    </Button>
  );
}
