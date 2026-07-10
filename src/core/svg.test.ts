import { describe, expect, it } from "vitest";
import { createFilter } from "./svg.js";

const hosts = () => document.querySelectorAll("svg[data-lg-host]");

describe("singleton SVG defs host", () => {
  it("shares one host across instances and removes it with the last filter", () => {
    const a = createFilter([-48, -45.5, -43]);
    const b = createFilter([-36]);
    expect(hosts().length).toBe(1);
    expect(document.querySelectorAll("filter").length).toBe(2);

    a.remove();
    expect(hosts().length).toBe(1);
    b.remove();
    expect(hosts().length).toBe(0);

    // Idempotent remove must not corrupt the refcount.
    b.remove();
    const c = createFilter([-48]);
    expect(hosts().length).toBe(1);
    c.remove();
    expect(hosts().length).toBe(0);
  });

  it("builds 3 displacement passes with fringe recombination for high", () => {
    const parts = createFilter([-48, -45.5, -43]);
    const filter = document.getElementById(parts.id)!;
    expect(filter.querySelectorAll("feDisplacementMap").length).toBe(3);
    expect(filter.querySelectorAll("feColorMatrix").length).toBe(3);
    expect(filter.querySelectorAll("feBlend").length).toBe(2);
    expect(filter.getAttribute("color-interpolation-filters")).toBe("sRGB");
    parts.remove();
  });

  it("builds a single cheap pass for lite", () => {
    const parts = createFilter([-29]);
    const filter = document.getElementById(parts.id)!;
    expect(filter.querySelectorAll("feDisplacementMap").length).toBe(1);
    expect(filter.querySelectorAll("feColorMatrix").length).toBe(0);
    expect(filter.querySelectorAll("feBlend").length).toBe(0);
    parts.remove();
  });
});
