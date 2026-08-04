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
