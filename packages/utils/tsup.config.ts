import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/index.tsx"].filter(Boolean) as string[],
  format: ["esm", "cjs"],
  dts: {
    // Fix TS5074 from dts plugin in some TS versions/configs
    compilerOptions: {
      incremental: false,
      composite: false,
    },
  },
  sourcemap: true,
  clean: true,
  external: ["react"],
  target: "es2020",
});
