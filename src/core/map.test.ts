import { describe, expect, it } from "vitest";
import { mapGeometry } from "./map.js";

describe("mapGeometry", () => {
  it("computes inset from the smaller side", () => {
    const g = mapGeometry(200, 100, 12, 0.07);
    expect(g.inset).toBeCloseTo(7);
  });

  it("clamps rounded-full (9999px) radii to half the smaller side", () => {
    const g = mapGeometry(300, 56, 9999, 0.07);
    // min(9999, 150, 28) = 28, minus inset 3.92
    expect(g.radius).toBeCloseTo(28 - 0.07 * 56);
    expect(g.radius).toBeLessThanOrEqual(28);
  });

  it("never returns a radius below the 2px floor", () => {
    const g = mapGeometry(20, 20, 0, 0.4);
    expect(g.radius).toBe(2);
  });

  it("leaves ordinary radii intact (minus inset)", () => {
    const g = mapGeometry(400, 300, 24, 0.05);
    expect(g.radius).toBeCloseTo(24 - 0.05 * 300);
  });
});
