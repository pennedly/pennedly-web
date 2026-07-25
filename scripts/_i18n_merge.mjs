#!/usr/bin/env node
// TEMPORARY (wave C) — merge translator output into the locale .ts files,
// preserving the file's section comments + structure (surgical line edits, not
// an object regenerate). Input: /tmp/i18n-translations.json =
//   [{ locale: "de", translations: { key: "übersetzt", ... } }, ...]
// For each locale: replace the value of an existing "key": line, or insert a
// missing key before the closing `};` under a backfill divider. Values are
// re-serialized with JSON.stringify so quotes/backslashes are escaped safely.
// Delete after the backfill lands.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const MESSAGES_DIR = join(REPO, "src", "lib", "i18n", "messages");
const INPUT = process.argv[2] || "/tmp/i18n-translations.json";

const payload = JSON.parse(readFileSync(INPUT, "utf8"));
const KEY_LINE = /^(\s*)"([^"]+)":\s*.*$/;

for (const { locale, translations } of payload) {
  if (!locale || !translations) continue;
  const file = join(MESSAGES_DIR, `${locale}.ts`);
  const lines = readFileSync(file, "utf8").split("\n");
  const remaining = new Set(Object.keys(translations));
  let replaced = 0;

  const out = lines.map((line) => {
    const m = line.match(KEY_LINE);
    if (m && remaining.has(m[2])) {
      const key = m[2];
      remaining.delete(key);
      replaced++;
      return `${m[1]}${JSON.stringify(key)}: ${JSON.stringify(translations[key])},`;
    }
    return line;
  });

  // Insert any keys that weren't already present, before the LAST `};`.
  let inserted = 0;
  if (remaining.size) {
    let closeIdx = -1;
    for (let i = out.length - 1; i >= 0; i--) {
      if (out[i].trim() === "};") {
        closeIdx = i;
        break;
      }
    }
    if (closeIdx === -1) throw new Error(`No closing }; in ${file}`);
    const block = ["  // ── wave C backfill ──"];
    for (const k of remaining) {
      block.push(`  ${JSON.stringify(k)}: ${JSON.stringify(translations[k])},`);
      inserted++;
    }
    out.splice(closeIdx, 0, ...block);
  }

  writeFileSync(file, out.join("\n"));
  console.log(`${locale}: replaced ${replaced}, inserted ${inserted} (total ${replaced + inserted}/${Object.keys(translations).length})`);
}
console.log("Merge done.");
