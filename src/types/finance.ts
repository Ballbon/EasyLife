import type { Database } from "@/types/database";
import type { TransactionType } from "@/lib/transactions";

export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
export type Budget = Database["public"]["Tables"]["budgets"]["Row"];
export type FinancialPlan =
  Database["public"]["Tables"]["financial_plans"]["Row"];
export type PlanAllocation =
  Database["public"]["Tables"]["plan_allocations"]["Row"];
export type FinancialGoal =
  Database["public"]["Tables"]["financial_goals"]["Row"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskSchedule =
  Database["public"]["Tables"]["task_schedules"]["Row"];
export type TaskCompletion =
  Database["public"]["Tables"]["task_completions"]["Row"];

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
