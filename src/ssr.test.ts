// @vitest-environment node
//
// Regression test for the #1 integration trap: this package is statically
// imported by "use client" modules, which frameworks still execute during
// SSR. Importing any entry or calling the query functions without a DOM
// must never throw.
import { describe, expect, it } from "vitest";

describe("SSR safety (no DOM)", () => {
  it("imports the core entry and resolves off", async () => {
    const core = await import("./index.js");
    expect(core.isSupported()).toBe(false);
    expect(core.resolveQuality()).toBe("off");
    expect(core.resolveQuality({ quality: "high" })).toBe("off");
    const unsubscribe = core.observeQuality({}, () => {});
    expect(unsubscribe).toBeTypeOf("function");
    unsubscribe();
  });

  it("imports the react entry", async () => {
    const react = await import("./react/index.js");
    expect(react.useLiquidGlass).toBeTypeOf("function");
    expect(react.LiquidGlass).toBeTypeOf("function");
  });
});
