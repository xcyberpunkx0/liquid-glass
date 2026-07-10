import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONTRAST_MORE,
  DESKTOP,
  installMatchMedia,
  REDUCED_MOTION,
  REDUCED_TRANSPARENCY,
  type MatchMediaController,
} from "../test/match-media.js";

vi.mock("./support.js", () => ({ isSupported: vi.fn(() => true) }));

import { isSupported } from "./support.js";
import { observeQuality, resolveQuality } from "./tiers.js";

let mm: MatchMediaController;

beforeEach(() => {
  mm = installMatchMedia({ [DESKTOP]: true });
  vi.mocked(isSupported).mockReturnValue(true);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("resolveQuality", () => {
  it("resolves high on supported desktop", () => {
    expect(resolveQuality()).toBe("high");
  });

  it("is off when unsupported (Safari/Firefox/iOS)", () => {
    vi.mocked(isSupported).mockReturnValue(false);
    expect(resolveQuality()).toBe("off");
    expect(resolveQuality({ quality: "high" })).toBe("off");
  });

  it.each([REDUCED_TRANSPARENCY, CONTRAST_MORE])(
    "treats %s as a hard gate, even for explicit tiers",
    (query) => {
      mm.set(query, true);
      expect(resolveQuality()).toBe("off");
      expect(resolveQuality({ quality: "high" })).toBe("off");
      expect(resolveQuality({ quality: "lite" })).toBe("off");
    },
  );

  it("respects reduced motion by default, opt-out available", () => {
    mm.set(REDUCED_MOTION, true);
    expect(resolveQuality()).toBe("off");
    expect(resolveQuality({ respectReducedMotion: false })).toBe("high");
  });

  it("is off under Save-Data", () => {
    vi.stubGlobal("navigator", {
      ...navigator,
      connection: { saveData: true },
    });
    expect(resolveQuality()).toBe("off");
  });

  it("resolves lite on capable non-desktop devices", () => {
    mm.set(DESKTOP, false);
    vi.stubGlobal("navigator", {
      ...navigator,
      deviceMemory: 8,
      hardwareConcurrency: 8,
    });
    expect(resolveQuality()).toBe("lite");
    expect(resolveQuality({ allowLite: false })).toBe("off");
  });

  it("is off on low-memory / low-core devices", () => {
    mm.set(DESKTOP, false);
    vi.stubGlobal("navigator", {
      ...navigator,
      deviceMemory: 2,
      hardwareConcurrency: 8,
    });
    expect(resolveQuality()).toBe("off");
  });

  it("explicit quality skips device heuristics only", () => {
    mm.set(DESKTOP, false);
    vi.stubGlobal("navigator", {
      ...navigator,
      deviceMemory: 2,
      hardwareConcurrency: 2,
    });
    expect(resolveQuality({ quality: "high" })).toBe("high");
    expect(resolveQuality({ quality: "off" })).toBe("off");
  });
});

describe("observeQuality", () => {
  it("emits on tier changes and unsubscribes cleanly", () => {
    const cb = vi.fn();
    const unsubscribe = observeQuality({}, cb);

    mm.set(REDUCED_MOTION, true); // high -> off
    expect(cb).toHaveBeenCalledWith("off");
    mm.set(REDUCED_MOTION, false); // off -> high
    expect(cb).toHaveBeenCalledWith("high");
    expect(cb).toHaveBeenCalledTimes(2);

    // No emission when the tier is unchanged.
    mm.set(CONTRAST_MORE, false);
    expect(cb).toHaveBeenCalledTimes(2);

    unsubscribe();
    expect(mm.listenerCount()).toBe(0);
  });
});
