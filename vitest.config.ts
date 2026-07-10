import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    // SSR-safety tests run in plain node via a docblock override
    // (@vitest-environment node) inside the test file.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
});
