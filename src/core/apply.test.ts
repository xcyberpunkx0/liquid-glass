import { describe, expect, it } from "vitest";
import { applyGlass, clearGlass } from "./apply.js";

describe("element contract", () => {
  it("sets property and attributes together", () => {
    const el = document.createElement("div");
    applyGlass(el, "lg-filter-7", "high");
    expect(el.style.getPropertyValue("--lg-filter-url")).toBe("url(#lg-filter-7)");
    expect(el.hasAttribute("data-lg-active")).toBe(true);
    expect(el.getAttribute("data-lg-quality")).toBe("high");
  });

  it("clears everything on teardown", () => {
    const el = document.createElement("div");
    applyGlass(el, "lg-filter-7", "lite");
    clearGlass(el);
    expect(el.style.getPropertyValue("--lg-filter-url")).toBe("");
    expect(el.hasAttribute("data-lg-active")).toBe(false);
    expect(el.hasAttribute("data-lg-quality")).toBe(false);
  });
});
