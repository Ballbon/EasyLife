export const transactionTypes = ["expense", "income", "transfer"] as const;
export type TransactionType = (typeof transactionTypes)[number];

export const transactionTypeLabels: Record<TransactionType, string> = {
  expense: "รายจ่าย",
  income: "รายรับ",
  transfer: "โอนเงิน",
};

export const accountTypeLabels: Record<string, string> = {
  cash: "เงินสด",
  bank: "บัญชีธนาคาร",
  card: "บัตร",
  ewallet: "e-Wallet",
};

export function bangkokLocalInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const date = new Date(`${value}:00+07:00`);
  if (
    Number.isNaN(date.getTime()) ||
    isoToBangkokLocalInput(date.toISOString()) !== value
  ) {
    return null;
  }
  return date.toISOString();
}

export function isoToBangkokLocalInput(value: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bangkok",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function formatBangkokDateTime(value: string): string {
  return new Intl.DateTimeFormat("th-TH", {
    timeZone: "Asia/Bangkok",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
