import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DESKTOP, installMatchMedia } from "../test/match-media.js";

vi.mock("./support.js", () => ({ isSupported: vi.fn(() => true) }));
vi.mock("./map.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("./map.js")>();
  return {
    ...original,
    createMapUrl: vi.fn(async () => ({
      url: "blob:mock-map",
      revoke: vi.fn(),
    })),
  };
});

import { liquidGlass } from "./engine.js";
import { createMapUrl } from "./map.js";

class ResizeObserverStub {
  static instances: ResizeObserverStub[] = [];
  observe = vi.fn();
  disconnect = vi.fn();
  constructor(public callback: () => void) {
    ResizeObserverStub.instances.push(this);
  }
}

function makeTarget(w = 320, h = 56): HTMLElement {
  const el = document.createElement("div");
  Object.defineProperty(el, "offsetWidth", { get: () => w, configurable: true });
  Object.defineProperty(el, "offsetHeight", { get: () => h, configurable: true });
  el.style.borderRadius = "28px";
  document.body.appendChild(el);
  return el;
}

const flush = () => new Promise((r) => setTimeout(r, 0));

beforeEach(() => {
  installMatchMedia({ [DESKTOP]: true });
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  ResizeObserverStub.instances = [];
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  document.body.innerHTML = "";
});

describe("liquidGlass engine", () => {
  it("applies the element contract only after the first map resolves", async () => {
    const el = makeTarget();
    const instance = liquidGlass(el);
    expect(el.hasAttribute("data-lg-active")).toBe(false);

    await flush();
    expect(el.hasAttribute("data-lg-active")).toBe(true);
    expect(el.getAttribute("data-lg-quality")).toBe("high");
    expect(el.style.getPropertyValue("--lg-filter-url")).toMatch(/^url\(#lg-filter-\d+\)$/);
    expect(instance.tier).toBe("high");
    instance.destroy();
  });

  it("is a complete no-op when the tier resolves off", async () => {
    installMatchMedia({}); // no desktop match, default navigator -> lite? no: jsdom navigator lacks deviceMemory -> defaults 4 -> lite
    const el = makeTarget();
    const instance = liquidGlass(el, { quality: "off" });
    await flush();
    expect(instance.tier).toBe("off");
    expect(el.hasAttribute("data-lg-active")).toBe(false);
    expect(el.style.getPropertyValue("--lg-filter-url")).toBe("");
    expect(createMapUrl).not.toHaveBeenCalled();
  });

  it("destroy() removes the filter, attributes, and revokes the map URL", async () => {
    const el = makeTarget();
    const instance = liquidGlass(el);
    await flush();

    const revoke = vi.mocked(createMapUrl).mock.results[0]!.value as Promise<{
      revoke: () => void;
    }>;
    instance.destroy();

    expect(el.hasAttribute("data-lg-active")).toBe(false);
    expect(el.hasAttribute("data-lg-quality")).toBe(false);
    expect(document.querySelectorAll("svg[data-lg-host]").length).toBe(0);
    expect((await revoke).revoke).toHaveBeenCalled();
    expect(ResizeObserverStub.instances[0]!.disconnect).toHaveBeenCalled();
  });

  it("skips regeneration for subpixel deltas, regenerates for real ones", async () => {
    let width = 320;
    const el = document.createElement("div");
    Object.defineProperty(el, "offsetWidth", { get: () => width });
    Object.defineProperty(el, "offsetHeight", { get: () => 56 });
    document.body.appendChild(el);

    vi.useFakeTimers();
    const instance = liquidGlass(el);
    await vi.runAllTimersAsync();
    expect(createMapUrl).toHaveBeenCalledTimes(1);

    const ro = ResizeObserverStub.instances[0]!;
    width = 320.4; // subpixel
    ro.callback();
    await vi.runAllTimersAsync();
    expect(createMapUrl).toHaveBeenCalledTimes(1);

    width = 480; // real resize
    ro.callback();
    await vi.runAllTimersAsync();
    expect(createMapUrl).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
    instance.destroy();
  });

  it("uses lite parameters (single pass, scaled-down displacement)", async () => {
    const el = makeTarget();
    const instance = liquidGlass(el, { quality: "lite", scale: -100 });
    await flush();

    const filter = document.querySelector("filter")!;
    const passes = filter.querySelectorAll("feDisplacementMap");
    expect(passes.length).toBe(1);
    expect(passes[0]!.getAttribute("scale")).toBe("-60"); // -100 * 0.6
    expect(el.getAttribute("data-lg-quality")).toBe("lite");
    instance.destroy();
  });
});
