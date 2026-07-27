#!/usr/bin/env node
// Applies a {key: translatedValue} JSON file to a locale's messages/<locale>.ts:
// - if the key already exists, replaces its string value in place (AST-precise,
//   no regex/escaping risk)
// - if the key is new, appends it in a block just before the closing `}`,
//   in the same order as the input JSON, under a dated comment marker
//
// Usage: node scripts/i18n-apply-translations.mjs <locale> <path-to-translations.json>

import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");

const [, , locale, jsonPath] = process.argv;
if (!locale || !jsonPath) {
  console.error("Usage: node scripts/i18n-apply-translations.mjs <locale> <path-to-translations.json>");
  process.exit(1);
}

const filePath = `src/lib/i18n/messages/${locale}.ts`;
const translations = JSON.parse(readFileSync(jsonPath, "utf8"));

let src = readFileSync(filePath, "utf8");
const sf = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true);

let objLit = null;
function walk(node) {
  if (objLit) return;
  const isExportedConst = ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
  if (isExportedConst) {
    for (const decl of node.declarationList.declarations) {
      let init = decl.initializer;
      while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isParenthesizedExpression(init))) init = init.expression;
      if (init && ts.isObjectLiteralExpression(init)) {
        objLit = init;
        return;
      }
    }
  }
  ts.forEachChild(node, walk);
}
walk(sf);
if (!objLit) throw new Error(`No exported object literal found in ${filePath}`);

const existing = new Map(); // key -> { valueNode }
for (const prop of objLit.properties) {
  if (!ts.isPropertyAssignment(prop)) continue;
  const name = prop.name;
  let key = null;
  if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) key = name.text;
  else if (ts.isIdentifier(name) || ts.isNumericLiteral(name)) key = name.text;
  if (key == null) continue;
  existing.set(key, prop.initializer);
}

// Collect in-place replacements, sorted by position descending so earlier
// splices don't invalidate later offsets.
const replacements = [];
const toAppend = [];
for (const [key, value] of Object.entries(translations)) {
  const node = existing.get(key);
  if (node) {
    replacements.push({ start: node.getStart(sf), end: node.getEnd(), value });
  } else {
    toAppend.push([key, value]);
  }
}
replacements.sort((a, b) => b.start - a.start);
for (const r of replacements) {
  src = src.slice(0, r.start) + JSON.stringify(r.value) + src.slice(r.end);
}

if (toAppend.length) {
  // Re-parse against the (possibly already-edited) source to find the
  // current end of the object literal reliably.
  const sf2 = ts.createSourceFile(filePath, src, ts.ScriptTarget.Latest, true);
  let objLit2 = null;
  function walk2(node) {
    if (objLit2) return;
    const isExportedConst = ts.isVariableStatement(node) && node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (isExportedConst) {
      for (const decl of node.declarationList.declarations) {
        let init = decl.initializer;
        while (init && (ts.isAsExpression(init) || ts.isSatisfiesExpression(init) || ts.isParenthesizedExpression(init))) init = init.expression;
        if (init && ts.isObjectLiteralExpression(init)) {
          objLit2 = init;
          return;
        }
      }
    }
    ts.forEachChild(node, walk2);
  }
  walk2(sf2);
  const closeBraceStart = objLit2.end - 1; // position of the `}`
  const stamp = new Date().toISOString().slice(0, 10);
  let block = `\n  // -- backfilled ${stamp} (i18n debt sweep) --\n`;
  for (const [key, value] of toAppend) {
    block += `  ${JSON.stringify(key)}: ${JSON.stringify(value)},\n`;
  }
  src = src.slice(0, closeBraceStart) + block + src.slice(closeBraceStart);
}

writeFileSync(filePath, src);
console.log(`${locale}: replaced ${replacements.length}, appended ${toAppend.length}`);
