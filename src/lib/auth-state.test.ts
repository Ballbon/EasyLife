import { describe, expect, it } from "vitest";

import { authStateDestination } from "@/lib/auth-state";

describe("authStateDestination", () => {
  it("does not redirect while the initial session is established", () => {
    expect(authStateDestination(undefined, "user-1")).toBeNull();
    expect(authStateDestination(undefined, null)).toBeNull();
  });

  it("does not redirect when the active user is unchanged", () => {
    expect(authStateDestination("user-1", "user-1")).toBeNull();
  });

  it("leaves a normal sign-in redirect to the auth view", () => {
    expect(authStateDestination(null, "user-1")).toBeNull();
  });

  it("redirects away from protected state after sign-out", () => {
    expect(authStateDestination("user-1", null)).toBe("/login");
  });

  it("remounts user-scoped views after an account switch", () => {
    expect(authStateDestination("user-1", "user-2")).toBe("/");
  });
});
