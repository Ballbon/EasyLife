import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase", () => ({ supabase: {} }));

import { validateTransaction } from "@/lib/finance";
import type { Account, Category, TransactionDraft } from "@/types/finance";

const accounts = [
  { id: "10000000-0000-4000-8000-000000000001" },
  { id: "10000000-0000-4000-8000-000000000002" },
] as Account[];
const categories = [
  {
    id: "20000000-0000-0000-0000-000000000001",
    transaction_type: "expense",
  },
  {
    id: "20000000-0000-0000-0000-000000000002",
    transaction_type: "income",
  },
] as Category[];

function draft(overrides: Partial<TransactionDraft> = {}): TransactionDraft {
  return {
    transactionType: "expense",
    amount: "1250.50",
    accountId: accounts[0].id,
    destinationAccountId: "",
    categoryId: categories[0].id,
    occurredAt: "2026-08-31T23:59",
    note: "",
    ...overrides,
  };
}

describe("transaction validation", () => {
  it("normalizes a valid expense amount and Bangkok timestamp", () => {
    expect(validateTransaction(draft(), accounts, categories)).toMatchObject({
      errors: {},
      amount: 125_050,
      occurredAt: "2026-08-31T16:59:00.000Z",
    });
  });

  it("requires an owned destination account for transfers", () => {
    const sameAccount = validateTransaction(
      draft({
        transactionType: "transfer",
        categoryId: "",
        destinationAccountId: accounts[0].id,
      }),
      accounts,
      categories,
    );
    const unknownAccount = validateTransaction(
      draft({
        transactionType: "transfer",
        categoryId: "",
        destinationAccountId: "30000000-0000-4000-8000-000000000001",
      }),
      accounts,
      categories,
    );

    expect(sameAccount.errors.destinationAccountId).toBeTruthy();
    expect(unknownAccount.errors.destinationAccountId).toBeTruthy();
  });

  it("rejects a category whose type does not match the transaction", () => {
    const result = validateTransaction(
      draft({ categoryId: categories[1].id }),
      accounts,
      categories,
    );
    expect(result.errors.categoryId).toBeTruthy();
  });

  it("rejects zero, values above the product limit, and malformed dates", () => {
    expect(
      validateTransaction(draft({ amount: "0" }), accounts, categories).errors
        .amount,
    ).toBeTruthy();
    expect(
      validateTransaction(
        draft({ amount: "999999999.999" }),
        accounts,
        categories,
      ).errors.amount,
    ).toBeTruthy();
    expect(
      validateTransaction(
        draft({ occurredAt: "2026-02-30T12:00" }),
        accounts,
        categories,
      ).errors.occurredAt,
    ).toBeTruthy();
  });
});
