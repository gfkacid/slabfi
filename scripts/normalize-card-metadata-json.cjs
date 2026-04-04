/**
 * Reads card metadata JSON from disk, replaces null grade / gradeService with 0 / "",
 * prints normalized JSON to stdout. Used by Foundry deploy (vm.ffi).
 *
 * Usage: node scripts/normalize-card-metadata-json.cjs <path-to-json>
 */
const fs = require("fs");

const path = process.argv[2];
if (!path) {
  console.error("usage: node normalize-card-metadata-json.cjs <path>");
  process.exit(1);
}

const o = JSON.parse(fs.readFileSync(path, "utf8"));
if (!Array.isArray(o.tokens)) {
  console.error('expected top-level "tokens" array');
  process.exit(1);
}
for (const t of o.tokens) {
  if (t == null || typeof t !== "object") continue;
  if (t.grade == null) t.grade = 0;
  if (t.gradeService == null) t.gradeService = "";
}
process.stdout.write(JSON.stringify(o));
