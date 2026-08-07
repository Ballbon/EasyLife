import { describe, expect, it } from "vitest";

import {
  calculateAccountBalance,
  formatSatang,
  parseMoneyToSatang,
  signedTransactionAmount,
} from "@/lib/money";

describe("parseMoneyToSatang", () => {
  it.each([
    ["0", 0],
    ["125.5", 12550],
    ["125.50", 12550],
    ["1,234.56", 123456],
    [" 99 ", 9900],
  ])("converts %s to integer satang", (input, expected) => {
    expect(parseMoneyToSatang(input)).toBe(expected);
  });

  it.each(["", "-1", "1.234", "abc", "1000000000", "1,2,3"])(
    "rejects invalid value %s",
    (input) => {
      expect(parseMoneyToSatang(input)).toBeNull();
    },
  );

  it("keeps satang exact at the maximum supported input", () => {
    expect(parseMoneyToSatang("999,999,999.99")).toBe(99_999_999_999);
  });
});

describe("formatSatang", () => {
  it("formats integer satang as Thai baht without losing decimals", () => {
    expect(formatSatang(125_050)).toContain("1,250.50");
  });
});

describe("calculateAccountBalance", () => {
  const transactions = [
    {
      account_id: "cash",
      destination_account_id: null,
      transaction_type: "income",
      amount_satang: 10_000,
    },
    {
      account_id: "cash",
      destination_account_id: null,
      transaction_type: "expense",
      amount_satang: 2_500,
    },
    {
      account_id: "cash",
      destination_account_id: "bank",
      transaction_type: "transfer",
      amount_satang: 3_000,
    },
  ];

  it("applies income, expense and outgoing transfers", () => {
    expect(calculateAccountBalance(1_000, "cash", transactions)).toBe(5_500);
  });

  it("applies incoming transfers without counting them as income", () => {
    expect(calculateAccountBalance(5_000, "bank", transactions)).toBe(8_000);
    expect(signedTransactionAmount("transfer", 3_000)).toBe(0);
  });

  it("allows a negative balance", () => {
    expect(
      calculateAccountBalance(0, "cash", [
        {
          account_id: "cash",
          destination_account_id: null,
          transaction_type: "expense",
          amount_satang: 100,
        },
      ]),
    ).toBe(-100);
  });

  it("does not change unrelated accounts or double count a transfer", () => {
    expect(calculateAccountBalance(500, "other", transactions)).toBe(500);
    expect(signedTransactionAmount("income", 100)).toBe(100);
    expect(signedTransactionAmount("expense", 100)).toBe(-100);
  });
});
