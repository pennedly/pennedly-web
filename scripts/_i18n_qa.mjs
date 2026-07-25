#!/usr/bin/env node
// TEMPORARY (wave C) — QA the backfill: (1) placeholder integrity vs en, and
// (2) values still byte-identical to en (legit brand vs lazy translation).

import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const HERE = dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = join(dirname(HERE), "src", "lib", "i18n", "messages");

function extractEntries(filePath) {
  const sf = ts.createSourceFile(filePath, readFileSync(filePath, "utf8"), ts.ScriptTarget.Latest, true);
  let obj = null;
  (function walk(n) {
    if (obj) return;
    if (ts.isVariableStatement(n) && n.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      for (const d of n.declarationList.declarations) {
        let init = d.initializer;
        while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isParenthesizedExpression(init))) init = init.expression;
        if (init && ts.isObjectLiteralExpression(init)) { obj = init; return; }
      }
    }
    ts.forEachChild(n, walk);
  })(sf);
  const out = {};
  for (const p of obj.properties) {
    if (!ts.isPropertyAssignment(p)) continue;
    const nm = p.name;
    const key = ts.isStringLiteral(nm) || ts.isNoSubstitutionTemplateLiteral(nm) || ts.isIdentifier(nm) ? nm.text : null;
    if (key == null) continue;
    const v = p.initializer;
    out[key] = ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v) ? v.text : null;
  }
  return out;
}

const PH = /\{[^}]+\}|%[sd]/g;
const ph = (s) => (s ? [...s.matchAll(PH)].map((m) => m[0]).sort() : []);
const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

const locales = readdirSync(MESSAGES_DIR).filter((f) => f.endsWith(".ts")).map((f) => f.slice(0, -3)).sort();
const en = extractEntries(join(MESSAGES_DIR, "en.ts"));
const others = locales.filter((l) => l !== "en");

let phProblems = 0;
const sameAsEn = {};
console.log("=== placeholder mismatches (DROPPED/RENAMED — must fix) ===");
for (const loc of others) {
  const cur = extractEntries(join(MESSAGES_DIR, `${loc}.ts`));
  sameAsEn[loc] = [];
  for (const k of Object.keys(en)) {
    if (!(k in cur) || cur[k] == null) continue;
    if (!same(ph(en[k]), ph(cur[k]))) {
      phProblems++;
      console.log(`  ${loc} ${k}: en[${ph(en[k]).join(",")}] vs ${loc}[${ph(cur[k]).join(",")}]`);
    }
    if (cur[k] === en[k]) sameAsEn[loc].push(k);
  }
}
if (!phProblems) console.log("  none ✓");

console.log("\n=== values still identical to en (per locale count) ===");
for (const loc of others) console.log(`  ${loc}: ${sameAsEn[loc].length}`);
// Keys identical in EVERY non-en,non-ru locale → strong brand/proper-noun candidates.
const intersect = others.filter((l) => l !== "ru").reduce((acc, l) => acc.filter((k) => sameAsEn[l].includes(k)), Object.keys(en));
console.log(`\n=== identical across ALL of de/es/fr/it/pt/uk (${intersect.length}) — brand-allowlist candidates ===`);
console.log(intersect.join(" "));
