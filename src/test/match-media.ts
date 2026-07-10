import { vi } from "vitest";

export interface MatchMediaController {
  /** Flip a query's matches state and fire its change listeners. */
  set(query: string, matches: boolean): void;
  listenerCount(): number;
}

/** Install a controllable window.matchMedia (jsdom ships none). */
export function installMatchMedia(
  initial: Record<string, boolean> = {},
): MatchMediaController {
  const state = new Map(Object.entries(initial));
  const listeners = new Map<string, Set<() => void>>();

  vi.stubGlobal(
    "matchMedia",
    (query: string): MediaQueryList =>
      ({
        get matches() {
          return state.get(query) ?? false;
        },
        media: query,
        addEventListener(_type: string, cb: () => void) {
          if (!listeners.has(query)) listeners.set(query, new Set());
          listeners.get(query)!.add(cb);
        },
        removeEventListener(_type: string, cb: () => void) {
          listeners.get(query)?.delete(cb);
        },
        onchange: null,
        addListener() {},
        removeListener() {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList,
  );

  return {
    set(query, matches) {
      state.set(query, matches);
      for (const cb of listeners.get(query) ?? []) cb();
    },
    listenerCount() {
      let n = 0;
      for (const set of listeners.values()) n += set.size;
      return n;
    },
  };
}

export const DESKTOP = "(hover: hover) and (pointer: fine)";
export const REDUCED_TRANSPARENCY = "(prefers-reduced-transparency: reduce)";
export const CONTRAST_MORE = "(prefers-contrast: more)";
export const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";
