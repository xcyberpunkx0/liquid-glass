import { createRoot } from "react-dom/client";
import {
  liquidGlass,
  resolveQuality,
  type LiquidGlassInstance,
  type LiquidGlassOptions,
} from "../src/index.js";
import { LiquidGlass } from "../src/react/index.js";
import "../src/styles.css";

// ?lg=high|lite|off forces the tier — DevTools device emulation can't spoof
// navigator.deviceMemory, so this is how the lite pipeline is inspected and
// CPU-throttle-traced on a desktop machine.
const forced = new URLSearchParams(location.search).get("lg");
const quality: "auto" | "high" | "lite" | "off" =
  forced === "high" || forced === "lite" || forced === "off" ? forced : "auto";

const tier = resolveQuality({ quality });
document.getElementById("tier")!.textContent = tier;
document.getElementById("tier-badge")!.textContent =
  quality === "auto" ? `auto → ${tier}` : tier;

const SLIDERS = ["scale", "chroma", "mapBlur"] as const;
const slider = (id: string) => document.getElementById(id) as HTMLInputElement;

const instances: LiquidGlassInstance[] = [];

function init(): void {
  for (const i of instances.splice(0)) i.destroy();
  const opts: LiquidGlassOptions = {
    quality,
    scale: Number(slider("scale").value),
    chroma: Number(slider("chroma").value),
    mapBlur: Number(slider("mapBlur").value),
  };
  // The controls panel gets the effect too — dogfooding on a fixed element.
  for (const id of ["pill", "card", "sticky-pill", "controls"]) {
    const el = document.getElementById(id)!;
    const instance = liquidGlass(el, opts);
    if (instance.tier === "off") el.setAttribute("data-lg-quality", "off");
    instances.push(instance);
  }
}

for (const id of SLIDERS) {
  const out = document.getElementById(`${id}-out`)!;
  // Live readout while dragging; rebuild only on release.
  slider(id).addEventListener("input", () => (out.textContent = slider(id).value));
  slider(id).addEventListener("change", init);
}

init();

createRoot(document.getElementById("react-root")!).render(
  <LiquidGlass className="glass card" quality={quality} scale={-64}>
    <strong>React &lt;LiquidGlass&gt;</strong>
    <p>
      Same engine through the hook: idle-deferred init, tier via
      useSyncExternalStore, destroy on unmount.
    </p>
  </LiquidGlass>,
);
