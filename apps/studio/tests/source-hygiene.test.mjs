import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), "../../..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const roots = [
  "apps/studio/app",
  "apps/studio/lib",
  "apps/studio/src",
  "functions/src",
  "packages",
];

const blockedFragments = [
  "@ts-ignore",
  "@ts-nocheck",
  "eslint-disable",
  " as any",
  "TODO",
  "FIXME",
];

const ignoredNames = new Set(["node_modules", ".next", "dist", "build", "coverage"]);
const scannedFiles = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredNames.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }
    if (!/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) continue;
    scannedFiles.push(fullPath);
    const text = fs.readFileSync(fullPath, "utf8");
    for (const fragment of blockedFragments) {
      assert(
        !text.includes(fragment),
        `source hygiene violation in ${path.relative(repoRoot, fullPath)}: ${fragment}`,
      );
    }
  }
}

for (const root of roots) {
  walk(path.join(repoRoot, root));
}

assert(scannedFiles.length > 0, "source hygiene test must scan active code files");

console.log(`source-hygiene: scanned ${scannedFiles.length} files`);
