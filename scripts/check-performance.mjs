import { gzipSync } from "node:zlib";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const limits = {
  // Includes the PWA copies and legacy MDI fallback font formats emitted by Vite.
  totalBytes: 6 * 1024 * 1024,
  javascriptGzipBytes: 500 * 1024,
  cssGzipBytes: 150 * 1024,
};
const totals = { totalBytes: 0, javascriptGzipBytes: 0, cssGzipBytes: 0 };

function walk(directory) {
  for (const name of readdirSync(directory)) {
    const path = join(directory, name);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      walk(path);
      continue;
    }
    totals.totalBytes += stat.size;
    if (name.endsWith(".js"))
      totals.javascriptGzipBytes += gzipSync(readFileSync(path)).byteLength;
    if (name.endsWith(".css"))
      totals.cssGzipBytes += gzipSync(readFileSync(path)).byteLength;
  }
}

walk("dist");
const failures = Object.entries(limits).filter(
  ([metric, limit]) => totals[metric] > limit,
);
const kib = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;

console.log(
  `Build size: ${kib(totals.totalBytes)} total, ${kib(totals.javascriptGzipBytes)} JS gzip, ${kib(totals.cssGzipBytes)} CSS gzip.`,
);
if (failures.length) {
  for (const [metric, limit] of failures)
    console.error(`${metric} exceeds its ${kib(limit)} budget.`);
  process.exit(1);
}
