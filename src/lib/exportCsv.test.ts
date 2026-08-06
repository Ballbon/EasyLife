import { describe, expect, it } from "vitest";
import { generateTransactionsCsv } from "@/lib/exportCsv";
import type { Account, Category, Transaction } from "@/types/finance";

describe("exportCsv", () => {
  it("generates valid UTF-8 BOM CSV for transactions", () => {
    const mockAccounts = [
      {
        id: "acc-1",
        user_id: "u1",
        name: "เงินสด",
        account_type: "cash",
        initial_balance_satang: 100000,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ] as Account[];

    const mockCategories = [
      {
        id: "cat-1",
        user_id: "u1",
        name: "อาหาร",
        transaction_type: "expense",
        icon: "food",
        color: "#ff0000",
        is_default: false,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ] as Category[];

    const mockTransactions = [
      {
        id: "tx-1",
        user_id: "u1",
        account_id: "acc-1",
        destination_account_id: null,
        category_id: "cat-1",
        transaction_type: "expense",
        amount_satang: 15000,
        note: "ข้าวผัดปู, กาแฟ",
        occurred_at: "2026-08-01T12:00:00Z",
        created_at: "2026-08-01T12:00:00Z",
      },
    ] as Transaction[];

    const csv = generateTransactionsCsv(
      mockTransactions,
      mockAccounts,
      mockCategories,
    );

    // Starts with UTF-8 BOM
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("วันที่เวลา,ประเภท,หมวดหมู่");
    expect(csv).toContain("รายจ่าย");
    expect(csv).toContain("อาหาร");
    expect(csv).toContain("เงินสด");
    expect(csv).toContain("150.00");
    expect(csv).toContain('"ข้าวผัดปู, กาแฟ"');
  });
});
