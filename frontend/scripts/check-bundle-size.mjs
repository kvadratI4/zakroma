// NFR-PERF-02: JS of the first screen ≤ 300 KB gzip. Run after `pnpm build`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const LIMIT_KB = 300;
const dist = join(import.meta.dirname, "..", "dist");
const html = readFileSync(join(dist, "index.html"), "utf8");

// Scripts the browser loads before the first screen: the entry and its module preloads.
const initial = [
  ...html.matchAll(/<script[^>]+src="([^"]+\.js)"/g),
  ...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+\.js)"/g),
].map((match) => match[1]);

if (initial.length === 0) {
  console.error("No scripts found in dist/index.html — run `pnpm build` first.");
  process.exit(1);
}

let total = 0;
for (const src of initial) {
  const size = gzipSync(readFileSync(join(dist, src))).length;
  total += size;
  console.log(`${(size / 1024).toFixed(1).padStart(7)} KB  ${src}`);
}
const totalKb = total / 1024;
console.log(`${totalKb.toFixed(1).padStart(7)} KB  total gzip (limit ${LIMIT_KB} KB)`);
if (totalKb > LIMIT_KB) process.exit(1);
