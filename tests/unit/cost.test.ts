import { describe, it, expect, beforeEach } from "vitest";
import { calculateOverheadFromEnv } from "@/lib/cost";

describe("calculateOverheadFromEnv", () => {
  beforeEach(() => {
    process.env.OVERHEAD_GAS = "100";
    process.env.OVERHEAD_ENERGY = "200";
    process.env.OVERHEAD_WATER = "50";
    process.env.OVERHEAD_PACKAGING = "70";
  });

  it("soma todos os componentes", () => {
    expect(calculateOverheadFromEnv()).toBe(420);
  });

  it("resiste a valores ausentes", () => {
    delete process.env.OVERHEAD_WATER;
    expect(calculateOverheadFromEnv()).toBe(370);
  });
});
