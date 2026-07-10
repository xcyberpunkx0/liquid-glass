import { createRoot } from "react-dom/client";
import {
  liquidGlass,
  resolveQuality,
  type LiquidGlassInstance,
  type LiquidGlassOptions,
} from "../src/index.js";
import { LiquidGlass } from "../src/react/index.js";
import "../src/styles.css";
// Swap the background by pointing this at any image in src/images.
import bgUrl from "../src/images/4415313.jpg";

document.body.style.setProperty("--bg-image", `url(${bgUrl})`);

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
  // Nav and controls get the effect too — dogfooding on fixed elements.
  for (const id of ["nav", "pill", "card", "sticky-pill", "controls", "drag-pill"]) {
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

// Draggable inspector pill — transform-only moves, so the displacement map
// never regenerates; the GPU just re-filters the new backdrop each frame.
{
  const pill = document.getElementById("drag-pill")!;
  let startX = 0, startY = 0, baseX = 0, baseY = 0, x = 0, y = 0;
  let dragging = false;
  pill.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    startY = e.clientY;
    baseX = x;
    baseY = y;
    try {
      pill.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointers can't be captured; window listeners still track.
    }
  });
  // Window-level listeners so fast drags that outrun the pill keep tracking
  // even where pointer capture isn't available.
  window.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    x = baseX + e.clientX - startX;
    y = baseY + e.clientY - startY;
    pill.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  });
  const release = () => (dragging = false);
  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
}

createRoot(document.getElementById("react-root")!).render(
  <LiquidGlass className="tile span-2" quality={quality} scale={-64}>
    <p className="cap">React</p>
    <h3>&lt;LiquidGlass&gt;</h3>
    <p>
      Same engine through a hook — idle-deferred init, SSR-safe, destroy on
      unmount.
    </p>
  </LiquidGlass>,
);
