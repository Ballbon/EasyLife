import type { Account, Category, Transaction } from "@/types/finance";
import {
  formatBangkokDateTime,
  transactionTypeLabels,
  type TransactionType,
} from "@/lib/transactions";

export function generateTransactionsCsv(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
): string {
  const accountMap = new Map(accounts.map((a) => [a.id, a.name]));
  const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

  const headers = [
    "วันที่เวลา",
    "ประเภท",
    "หมวดหมู่",
    "บัญชีต้นทาง",
    "บัญชีปลายทาง",
    "จำนวนเงิน (บาท)",
    "หมายเหตุ",
  ];

  const escapeCsv = (str: string) => {
    if (str.includes('"') || str.includes(",") || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = transactions.map((t) => {
    const typeLabel =
      transactionTypeLabels[t.transaction_type as TransactionType] ??
      t.transaction_type;
    const catName = t.category_id ? (categoryMap.get(t.category_id) ?? "") : "";
    const accName = accountMap.get(t.account_id) ?? "";
    const destAccName = t.destination_account_id
      ? (accountMap.get(t.destination_account_id) ?? "")
      : "";
    const amountBath = (Number(t.amount_satang) / 100).toFixed(2);
    const dateFormatted = formatBangkokDateTime(t.occurred_at);

    return [
      escapeCsv(dateFormatted),
      escapeCsv(typeLabel),
      escapeCsv(catName),
      escapeCsv(accName),
      escapeCsv(destAccName),
      escapeCsv(amountBath),
      escapeCsv(t.note ?? ""),
    ].join(",");
  });

  // \uFEFF is UTF-8 Byte Order Mark (BOM) so Microsoft Excel opens Thai text cleanly
  return "\uFEFF" + [headers.join(","), ...rows].join("\n");
}

export function downloadCsv(
  csvContent: string,
  filename = "easylife-transactions.csv",
) {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
