import { copyFileSync } from "node:fs";
import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm"],
    dts: true,
    clean: true,
    onSuccess: async () => {
      copyFileSync("src/styles.css", "dist/styles.css");
    },
  },
  {
    entry: { "react/index": "src/react/index.ts" },
    format: ["esm"],
    dts: true,
    external: ["react"],
    // Next.js App Router: the adapter is client-only.
    banner: { js: '"use client";' },
  },
]);
