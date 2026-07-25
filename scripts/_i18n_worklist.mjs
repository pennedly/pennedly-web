#!/usr/bin/env node
// TEMPORARY (wave C) — compute the real translation work list per locale.
// For each non-en locale: keys that are MISSING (fall back to en) OR PRESENT
// but byte-identical to en (silent English). Emits {key: enValue} maps to
// /tmp/i18n-worklist.json for the per-locale translator agents, and prints the
// true scale. Delete after the backfill lands.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const MESSAGES_DIR = join(REPO, "src", "lib", "i18n", "messages");
const REFERENCE = "en";

/** Extract {key: value} for the single exported object literal of string entries. */
function extractEntries(filePath) {
  const src = readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true);
  let objLit = null;
  function walk(node) {
    if (objLit) return;
    const isExportedConst =
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (isExportedConst) {
      for (const decl of node.declarationList.declarations) {
        let init = decl.initializer;
        while (
          init &&
          (ts.isAsExpression(init) ||
            ts.isSatisfiesExpression(init) ||
            ts.isParenthesizedExpression(init))
        ) {
          init = init.expression;
        }
        if (init && ts.isObjectLiteralExpression(init)) {
          objLit = init;
          return;
        }
      }
    }
    ts.forEachChild(node, walk);
  }
  walk(sf);
  if (!objLit) throw new Error(`No exported object literal in ${filePath}`);

  const entries = {};
  for (const prop of objLit.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const name = prop.name;
    let key = null;
    if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) key = name.text;
    else if (ts.isIdentifier(name) || ts.isNumericLiteral(name)) key = name.text;
    if (key == null) continue;
    const v = prop.initializer;
    if (ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v)) entries[key] = v.text;
    else entries[key] = null; // non-string value (unexpected) — flagged below
  }
  return entries;
}

const locales = readdirSync(MESSAGES_DIR)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => f.slice(0, -3))
  .sort();

const en = extractEntries(join(MESSAGES_DIR, "en.ts"));
const enKeys = Object.keys(en);
const others = locales.filter((l) => l !== REFERENCE);

const worklist = {};
console.log(`reference en: ${enKeys.length} keys\n`);
console.log("locale | missing | same-as-en | TOTAL to translate");
console.log("-------|---------|------------|-------------------");
for (const loc of others) {
  const cur = extractEntries(join(MESSAGES_DIR, `${loc}.ts`));
  const map = {};
  let missing = 0;
  let sameAsEn = 0;
  for (const k of enKeys) {
    if (!(k in cur)) {
      map[k] = en[k];
      missing++;
    } else if (cur[k] !== null && cur[k] === en[k]) {
      map[k] = en[k];
      sameAsEn++;
    }
  }
  worklist[loc] = map;
  console.log(
    `${loc.padEnd(6)} | ${String(missing).padStart(7)} | ${String(sameAsEn).padStart(10)} | ${Object.keys(map).length}`,
  );
}

writeFileSync("/tmp/i18n-worklist.json", JSON.stringify({ en, worklist }, null, 2) + "\n");
const grand = others.reduce((n, l) => n + Object.keys(worklist[l]).length, 0);
console.log(`\nTotal strings to translate across ${others.length} locales: ${grand}`);
console.log("Written → /tmp/i18n-worklist.json");
