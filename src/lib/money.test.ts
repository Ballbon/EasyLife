import { describe, expect, it } from "vitest";

import { parseMoneyToSatang } from "@/lib/money";

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
});
