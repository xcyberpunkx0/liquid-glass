/**
 * @xcyberpunkx0/liquid-glass — Apple-style liquid glass refraction.
 *
 * Fork of https://github.com/deepika-builds/liquid-glass (MIT, Deepika Rao;
 * vendored from commit 98ed97b) — rewritten in TypeScript with a headless
 * application model, adaptive quality tiers, and a React adapter
 * (`@xcyberpunkx0/liquid-glass/react`).
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
