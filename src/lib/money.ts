const MONEY_PATTERN = /^(?:\d{1,3}(?:,\d{3})+|\d{1,9})(?:\.\d{1,2})?$/;

export function parseMoneyToSatang(value: string): number | null {
  const trimmed = value.trim();

  if (!MONEY_PATTERN.test(trimmed)) {
    return null;
  }

  const normalized = trimmed.replaceAll(",", "");
  const [baht, fraction = ""] = normalized.split(".");
  const satang = Number(baht) * 100 + Number(fraction.padEnd(2, "0"));

  return Number.isSafeInteger(satang) ? satang : null;
}

export function formatSatang(satang: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 2,
  }).format(satang / 100);
}

export type BalanceTransaction = {
  account_id: string;
  destination_account_id: string | null;
  transaction_type: string;
  amount_satang: number;
};

export function calculateAccountBalance(
  initialBalanceSatang: number,
  accountId: string,
  transactions: BalanceTransaction[],
): number {
  return transactions.reduce((balance, transaction) => {
    const amount = Number(transaction.amount_satang);

    if (
      transaction.transaction_type === "income" &&
      transaction.account_id === accountId
    ) {
      return balance + amount;
    }
    if (
      transaction.transaction_type === "expense" &&
      transaction.account_id === accountId
    ) {
      return balance - amount;
    }
    if (transaction.transaction_type === "transfer") {
      if (transaction.account_id === accountId) return balance - amount;
      if (transaction.destination_account_id === accountId)
        return balance + amount;
    }

    return balance;
  }, initialBalanceSatang);
}

export function signedTransactionAmount(
  transactionType: string,
  amountSatang: number,
): number {
  if (transactionType === "expense") return -amountSatang;
  if (transactionType === "income") return amountSatang;
  return 0;
}
