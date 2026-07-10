import { act, render, screen } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DESKTOP, installMatchMedia } from "../test/match-media.js";

vi.mock("../core/support.js", () => ({ isSupported: vi.fn(() => true) }));
vi.mock("../core/map.js", () => ({
  createMapUrl: vi.fn(async () => ({ url: "blob:mock-map", revoke: vi.fn() })),
  mapGeometry: vi.fn(),
}));

import { isSupported } from "../core/support.js";
import { useLiquidGlass } from "./use-liquid-glass.js";

class ResizeObserverStub {
  observe = vi.fn();
  disconnect = vi.fn();
}

function Probe(props: { enabled?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { tier } = useLiquidGlass(ref, { enabled: props.enabled ?? true });
  return (
    <div ref={ref} data-testid="glass">
      tier:{tier}
    </div>
  );
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", ResizeObserverStub);
  // Deferred like the real API so tests can set element dimensions between
  // render and engine init.
  vi.stubGlobal("requestIdleCallback", (cb: () => void) => setTimeout(cb, 0));
  vi.stubGlobal("cancelIdleCallback", (handle: number) => clearTimeout(handle));
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("useLiquidGlass", () => {
  it("marks the element off (styling hook) when the tier is off", () => {
    installMatchMedia({});
    vi.mocked(isSupported).mockReturnValue(false);
    render(<Probe />);
    const el = screen.getByTestId("glass");
    expect(el.getAttribute("data-lg-quality")).toBe("off");
    expect(el.hasAttribute("data-lg-active")).toBe(false);
    expect(el.textContent).toBe("tier:off");
  });

  it("initializes on supported desktop and tears down on unmount", async () => {
    installMatchMedia({ [DESKTOP]: true });
    vi.mocked(isSupported).mockReturnValue(true);

    const { unmount } = render(<Probe />);
    const probe = screen.getByTestId("glass");
    Object.defineProperty(probe, "offsetWidth", { get: () => 200 });
    Object.defineProperty(probe, "offsetHeight", { get: () => 50 });

    // Let the deferred idle init and the async map resolution complete.
    await act(() => new Promise((r) => setTimeout(r, 10)));
    expect(probe.getAttribute("data-lg-quality")).toBe("high");
    expect(probe.hasAttribute("data-lg-active")).toBe(true);

    unmount();
    expect(document.querySelectorAll("svg[data-lg-host]").length).toBe(0);
  });

  it("does not initialize while enabled is false", () => {
    installMatchMedia({ [DESKTOP]: true });
    vi.mocked(isSupported).mockReturnValue(true);
    render(<Probe enabled={false} />);
    const el = screen.getByTestId("glass");
    expect(el.hasAttribute("data-lg-active")).toBe(false);
    expect(el.getAttribute("data-lg-quality")).toBe("off");
  });
});
