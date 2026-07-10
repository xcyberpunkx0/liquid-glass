/**
 * @xcyberpunkx0/liquid-glass — Apple-style liquid glass refraction.
 *
 * Headless SVG-displacement engine with adaptive quality tiers; React
 * adapter at `@xcyberpunkx0/liquid-glass/react`. Displacement-map core
 * derives from Deepika Rao's MIT-licensed liquid-glass (see LICENSE).
 */
export { liquidGlass } from "./core/engine.js";
export { isSupported } from "./core/support.js";
export { resolveQuality, observeQuality } from "./core/tiers.js";
export { mapGeometry } from "./core/map.js";
export type {
  LiquidGlassInstance,
  LiquidGlassOptions,
  QualityOptions,
  QualityTier,
} from "./core/types.js";
