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

document.getElementById("tier")!.textContent = resolveQuality({ quality });

const instances: LiquidGlassInstance[] = [];

function init(): void {
  for (const i of instances.splice(0)) i.destroy();
  const opts: LiquidGlassOptions = {
    quality,
    scale: Number((document.getElementById("scale") as HTMLInputElement).value),
    chroma: Number((document.getElementById("chroma") as HTMLInputElement).value),
    mapBlur: Number((document.getElementById("mapBlur") as HTMLInputElement).value),
  };
  for (const id of ["pill", "card", "sticky-pill"]) {
    const el = document.getElementById(id)!;
    const instance = liquidGlass(el, opts);
    if (instance.tier === "off") el.setAttribute("data-lg-quality", "off");
    instances.push(instance);
  }
}

init();
document.getElementById("reinit")!.addEventListener("click", init);

createRoot(document.getElementById("react-root")!).render(
  <LiquidGlass className="glass card" quality={quality} scale={-64}>
    <strong>React &lt;LiquidGlass&gt;</strong>
    <p>
      Same engine through the hook: idle-deferred init, tier via
      useSyncExternalStore, destroy on unmount.
    </p>
  </LiquidGlass>,
);
