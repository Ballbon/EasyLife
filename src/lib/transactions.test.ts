import { describe, expect, it } from "vitest";

import {
  bangkokLocalInputToIso,
  isoToBangkokLocalInput,
} from "@/lib/transactions";

describe("Bangkok transaction dates", () => {
  it("converts a Bangkok wall-clock value to UTC", () => {
    expect(bangkokLocalInputToIso("2026-08-04T13:30")).toBe(
      "2026-08-04T06:30:00.000Z",
    );
  });

  it("round-trips through a datetime-local value", () => {
    expect(isoToBangkokLocalInput("2026-08-04T06:30:00.000Z")).toBe(
      "2026-08-04T13:30",
    );
  });

  it("crosses month and year boundaries using the fixed Bangkok offset", () => {
    expect(bangkokLocalInputToIso("2026-01-01T00:00")).toBe(
      "2025-12-31T17:00:00.000Z",
    );
    expect(isoToBangkokLocalInput("2028-02-29T17:00:00.000Z")).toBe(
      "2028-03-01T00:00",
    );
  });

  it("rejects malformed local values", () => {
    expect(bangkokLocalInputToIso("04/08/2026 13:30")).toBeNull();
    expect(bangkokLocalInputToIso("2026-02-31T13:30")).toBeNull();
  });
});
