import { describe, expect, it } from "vitest";

import { categoryIcon, categoryIconItems } from "./categoryIcons";

const databaseIcons = [
  "wallet-cards",
  "gift",
  "circle-plus",
  "utensils",
  "bus",
  "house",
  "bolt",
  "shopping-bag",
  "heart-pulse",
  "book-open",
  "gamepad-2",
  "ellipsis",
];

describe("category icons", () => {
  it("maps every seeded database icon to a Material Design Icon", () => {
    expect(databaseIcons.map(categoryIcon)).toEqual([
      "mdi-wallet-outline",
      "mdi-gift-outline",
      "mdi-plus-circle-outline",
      "mdi-silverware-fork-knife",
      "mdi-bus",
      "mdi-home-outline",
      "mdi-lightning-bolt-outline",
      "mdi-shopping-outline",
      "mdi-heart-pulse",
      "mdi-book-open-page-variant-outline",
      "mdi-gamepad-variant-outline",
      "mdi-dots-horizontal",
    ]);
  });

  it("offers every seeded database icon in the category form", () => {
    expect(categoryIconItems.map((item) => item.value)).toEqual(
      expect.arrayContaining(databaseIcons),
    );
  });

  it("uses a safe fallback for unknown values", () => {
    expect(categoryIcon("unknown")).toBe("mdi-circle-outline");
  });
});
