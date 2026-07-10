import { createElement, useCallback, useRef } from "react";
import type { QualityTier } from "../core/types.js";
import { useLiquidGlass, type UseLiquidGlassOptions } from "./use-liquid-glass.js";

type OptionProps = Pick<
  UseLiquidGlassOptions,
  | "quality"
  | "allowLite"
  | "respectReducedMotion"
  | "scale"
  | "chroma"
  | "border"
  | "mapBlur"
  | "radius"
  | "passes"
  | "liteOverrides"
  | "enabled"
  | "onTierChange"
>;

const OPTION_KEYS = [
  "quality",
  "allowLite",
  "respectReducedMotion",
  "scale",
  "chroma",
  "border",
  "mapBlur",
  "radius",
  "passes",
  "liteOverrides",
  "enabled",
  "onTierChange",
] as const satisfies readonly (keyof OptionProps)[];

export interface LiquidGlassProps
  extends OptionProps,
    Omit<React.HTMLAttributes<HTMLElement>, keyof OptionProps> {
  /** Element type to render. Default `"div"`. */
  as?: keyof React.JSX.IntrinsicElements;
  ref?: React.Ref<HTMLElement | null>;
  children?: React.ReactNode;
}

export type { QualityTier };

/**
 * Thin styling-free wrapper around {@link useLiquidGlass}. Renders `as`
 * (default div), wires the engine, and forwards everything else. Pair with
 * `@xcyberpunkx0/liquid-glass/styles.css` or your own
 * `[data-lg-active]` rules.
 */
export function LiquidGlass(props: LiquidGlassProps) {
  const { as = "div", ref, children, ...rest } = props;

  const options: Record<string, unknown> = {};
  const domProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rest)) {
    if ((OPTION_KEYS as readonly string[]).includes(key)) options[key] = value;
    else domProps[key] = value;
  }

  const innerRef = useRef<HTMLElement | null>(null);
  const mergedRef = useCallback(
    (node: HTMLElement | null) => {
      innerRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useLiquidGlass(innerRef, options as UseLiquidGlassOptions);

  return createElement(as, { ...domProps, ref: mergedRef }, children);
}
