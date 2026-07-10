# @xcyberpunkx0/liquid-glass

Apple-style **liquid glass refraction** for the web — content behind the
element visibly bends at the rim with a subtle prism fringe while the
interior stays legible. TypeScript, zero dependencies, with a **headless
application model**, **adaptive quality tiers**, and a **React adapter**.

## How it works

A canvas-generated displacement map (red = X, blue = Y) is fed into an SVG
`feDisplacementMap` pipeline applied via `backdrop-filter: url(#…)` — real
DOM refraction: text stays selectable, inputs stay usable. Real refraction
requires **Chromium**; everywhere else the engine deliberately does
*nothing*, leaving your CSS fallback in charge.

## Install

```sh
npm install @xcyberpunkx0/liquid-glass
```

ESM-only. React (`>=18`) is an optional peer dependency, needed only for the
`/react` entry.

## Vanilla

```js
import { liquidGlass } from "@xcyberpunkx0/liquid-glass";
import "@xcyberpunkx0/liquid-glass/styles.css"; // optional batteries

const glass = liquidGlass(document.querySelector(".panel"), { scale: -64 });
// glass.tier      -> "high" | "lite" | "off"
// glass.refresh() -> force a map regeneration
// glass.destroy() -> full teardown
```

## React

```tsx
"use client";
import { useRef } from "react";
import { useLiquidGlass } from "@xcyberpunkx0/liquid-glass/react";

function GlassNav() {
  const ref = useRef<HTMLDivElement>(null);
  const { tier } = useLiquidGlass(ref, { scale: -48, chroma: 2.5 });
  return <nav ref={ref} className="glass-island">…</nav>;
}
```

Or the wrapper: `<LiquidGlass as="section" scale={-64}>…</LiquidGlass>`.

The hook is SSR/hydration-safe (server renders as tier `"off"`, the engine
initializes in an idle slot after hydration — LCP untouched) and re-resolves
the tier live when OS preferences change.

## Headless element contract

The engine never writes `backdrop-filter` inline. It sets, atomically:

| Surface | Meaning |
|---|---|
| `--lg-filter-url` | `url(#lg-filter-…)` custom property |
| `data-lg-active` | present while a filter is wired |
| `data-lg-quality` | `high` \| `lite` \| `off` — style per tier |

Bring your own CSS (recommended if you have a glass design system):

```css
.my-glass[data-lg-active] {
  backdrop-filter: var(--lg-filter-url) blur(6px) saturate(1.4);
}
```

…or import `styles.css` for a ready-made look including a frosted fallback
for the `off` tier.

## Adaptive quality tiers

`quality: "auto"` (default) resolves per device:

1. SSR / non-Chromium (iOS, Safari, Firefox) → **off**
2. `prefers-reduced-transparency`, `prefers-contrast: more`,
   `prefers-reduced-motion` (configurable) → **off** — hard gates, even for
   explicit tiers
3. `Save-Data` → **off**
4. Desktop (`hover` + `pointer: fine`) → **high** — 3 displacement passes
   with chromatic fringe
5. Capable Android (`deviceMemory ≥ 4`, `cores ≥ 4`) → **lite** — single
   pass, no fringe, reduced displacement (needs `allowLite: true`, the default)
6. Everything else → **off**

Tier changes are observed live (`observeQuality`) — flipping an OS
preference mid-session tears down or re-initializes automatically.

## Options

| Option | Default | Notes |
|---|---|---|
| `quality` | `"auto"` | `"auto" \| "high" \| "lite" \| "off"` |
| `allowLite` | `true` | let `auto` pick lite on capable mobile |
| `respectReducedMotion` | `true` | treat reduced-motion as off |
| `scale` | `-112` | displacement strength (negative = magnifying bulge); scale it to element size — small pills want −36…−64 |
| `chroma` | `6` | per-channel stagger (prism fringe); `0` disables |
| `border` | `0.07` | neutral inset, fraction of the smaller side |
| `mapBlur` | `12` | edge-curvature softness (px) |
| `radius` | reads CSS | override corner radius (px); `rounded-full` is clamped automatically |
| `passes` | by tier | `1 \| 3` |
| `liteOverrides` | `scale×0.6, mapBlur×0.75` | lite-tier tuning |

## Performance notes

- Map generation is O(w×h) and runs off the critical path (idle-deferred in
  React; resize-debounced 120 ms with subpixel-delta skip). Maps are
  `blob:` object URLs, revoked on regeneration and destroy.
- The filter is GPU-evaluated **per scroll frame** under the element — keep
  surfaces small (nav pills, cards, capsules; avoid > ~800 px per side) and
  few (2–4 per page).
- One shared 0×0 SVG host carries all filters and is removed with the last
  instance.
- **CSP**: displacement maps need `img-src blob:` (or `data:` for the
  fallback path).

## Browser support

| | |
|---|---|
| Chrome / Edge / Arc / Brave (desktop) | real refraction (**high**) |
| Chrome (Android, capable device) | single-pass refraction (**lite**) |
| Safari / iOS / Firefox | **off** — your CSS fallback |

## License

MIT — see [LICENSE](./LICENSE). The displacement-map rendering core derives
from Deepika Rao's MIT-licensed implementation.
