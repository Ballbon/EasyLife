import type { Database } from "@/types/database";
import type { TransactionType } from "@/lib/transactions";

export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export type TransactionDraft = {
  transactionType: TransactionType;
  amount: string;
  accountId: string;
  destinationAccountId: string;
  categoryId: string;
  occurredAt: string;
  note: string;
};

export type FieldErrors = Record<string, string | undefined>;
