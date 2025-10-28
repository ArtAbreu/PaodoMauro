import { describe, it, expect } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("permite chamadas iniciais", () => {
    const result = rateLimit("test-key", "api");
    expect(result.success).toBe(true);
  });

  it("bloqueia após exceder", () => {
    const key = "limited";
    for (let i = 0; i < 60; i++) {
      rateLimit(key, "api");
    }
    const final = rateLimit(key, "api");
    expect(final.success).toBe(false);
  });
});
