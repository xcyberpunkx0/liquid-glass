import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { liquidGlass } from "../core/engine.js";
import { observeQuality, resolveQuality } from "../core/tiers.js";
import type {
  LiquidGlassInstance,
  LiquidGlassOptions,
  QualityTier,
} from "../core/types.js";

export interface UseLiquidGlassOptions extends LiquidGlassOptions {
  /**
   * Gate for conditionally-mounted elements (AnimatePresence etc.). Pass
   * the mount condition so the effect re-runs once the element exists.
   * Default `true`.
   */
  enabled?: boolean;
  onTierChange?: (tier: QualityTier) => void;
}

function scheduleIdle(cb: () => void): () => void {
  // requestIdleCallback is missing in Safari — irrelevant to the refraction
  // path (Safari resolves off) but the hook must not throw there.
  if (typeof window.requestIdleCallback === "function") {
    const handle = window.requestIdleCallback(cb, { timeout: 500 });
    return () => window.cancelIdleCallback(handle);
  }
  const handle = setTimeout(cb, 200);
  return () => clearTimeout(handle);
}

/**
 * React binding for {@link liquidGlass}.
 *
 * SSR/hydration-safe: the server snapshot is `"off"` and the engine only
 * runs client-side, in an idle slot after hydration, so LCP is unaffected
 * and server/client markup never differs. Tier changes (OS preference
 * flips, Save-Data toggles) re-run the effect live.
 */
export function useLiquidGlass<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  options: UseLiquidGlassOptions = {},
): { tier: QualityTier; refresh: () => void } {
  const { enabled = true, onTierChange, ...glassOptions } = options;
  const {
    quality = "auto",
    allowLite = true,
    respectReducedMotion = true,
  } = glassOptions;

  const subscribe = useCallback(
    (onStoreChange: () => void) =>
      observeQuality({ quality, allowLite, respectReducedMotion }, onStoreChange),
    [quality, allowLite, respectReducedMotion],
  );
  const tier = useSyncExternalStore(
    subscribe,
    () => resolveQuality({ quality, allowLite, respectReducedMotion }),
    () => "off" as const,
  );

  // Filter/geometry options are init-time constants: changing them across
  // renders does not rebuild the instance (matches the imperative engine).
  const optionsRef = useRef(glassOptions);
  optionsRef.current = glassOptions;
  const instanceRef = useRef<LiquidGlassInstance | null>(null);

  const onTierChangeRef = useRef(onTierChange);
  onTierChangeRef.current = onTierChange;
  useEffect(() => {
    onTierChangeRef.current?.(tier);
  }, [tier]);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || tier === "off") {
      // Styling hook for fallback CSS even when the engine never runs.
      el?.setAttribute("data-lg-quality", "off");
      return () => {
        if (el?.getAttribute("data-lg-quality") === "off") {
          el.removeAttribute("data-lg-quality");
        }
      };
    }
    if (!el) return;

    const cancelIdle = scheduleIdle(() => {
      instanceRef.current = liquidGlass(el, optionsRef.current);
    });
    return () => {
      cancelIdle();
      instanceRef.current?.destroy();
      instanceRef.current = null;
    };
  }, [ref, tier, enabled]);

  return {
    tier,
    refresh: useCallback(() => instanceRef.current?.refresh(), []),
  };
}
