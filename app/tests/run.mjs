// ============================================================
// FILE: tests/run.mjs — discovers test files instead of listing them.
//
// The gate first ran `node --test … tests/rules.test.ts tests/store.test.ts`,
// which is a list somebody has to remember to update. This repository has been
// caught by that shape twice already, and both are recorded in §11:
// `consumerFiles.mjs` carried a hand-written SOURCES list until `ReportPreview`
// shipped invisible to two gates, and the N6 surface lists still do.
//
// A test file that exists but is not run is worse than no test file: it looks
// like coverage in a diff and reports nothing.
//
// So this walks the directory. Anything matching `*.test.ts` runs, the moment
// it exists. Node's own `--test` directory discovery does not pick up `.ts`
// files, which is the only reason this script exists rather than a flag.
//
// No install and no build — Node 22 strips the types itself. That is worth
// protecting: a suite that needs its own toolchain is a suite that stops
// running the first time the toolchain breaks.
// ============================================================

import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));

const files = readdirSync(HERE)
  .filter((name) => name.endsWith(".test.ts"))
  .sort()
  .map((name) => join(HERE, name));

if (files.length === 0) {
  // Not "nothing to do". A test directory with no tests in it means either the
  // suite was deleted or the pattern stopped matching, and both should be loud.
  console.error("No *.test.ts files found in tests/. That is a failure, not an empty run.");
  process.exit(1);
}

console.log(`discovered ${files.length} test file(s): ${files.map((f) => f.slice(HERE.length + 1)).join(", ")}`);

const result = spawnSync(
  process.execPath,
  ["--test", "--experimental-strip-types", ...files],
  { stdio: "inherit" },
);

process.exit(result.status ?? 1);
