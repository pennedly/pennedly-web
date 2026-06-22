#!/usr/bin/env node
// i18n key-parity guardrail.
//
// Why this exists: the message catalogs are `Partial<Record<MessageKey,
// string>>` and `lookup()` silently falls back to `en`, so a key that is
// missing in (say) `de` renders English with NO error — which is exactly
// how six locales drifted ~285 keys behind `en` without anyone noticing.
// TypeScript can't catch it (Partial makes every key optional on purpose,
// so partial translations can ship). This script is the catch.
//
// Model: `en` is the reference. Every other locale must, for each `en`
// key, EITHER translate it OR list it as a known gap in the baseline
// (scripts/i18n-parity-baseline.json). New `en` keys therefore force a
// conscious choice — translate everywhere, or record the deferral — they
// can never silently fall back again. The baseline is a ratchet: it may
// only shrink. Translating a key without pruning it from the baseline is
// itself an error, so the debt list stays honest.
//
// Usage:
//   node scripts/check-i18n-parity.mjs            # check (exit 1 on any problem)
//   node scripts/check-i18n-parity.mjs --update   # rewrite the baseline to the
//                                                 # current gaps (intentional act:
//                                                 # run after a reviewed backfill)
//
// Robustness: keys are extracted from the real TypeScript AST (not regex),
// so reformatting, multi-line values, `as const`, etc. never fool it.

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = dirname(HERE);
const MESSAGES_DIR = join(REPO, "src", "lib", "i18n", "messages");
const BASELINE_PATH = join(HERE, "i18n-parity-baseline.json");
const REFERENCE = "en";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

/** Extract the top-level string keys of the single exported object literal. */
function extractKeys(filePath) {
  const src = readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(
    filePath,
    src,
    ts.ScriptTarget.Latest,
    /*setParentNodes*/ true,
  );

  let objLit = null;
  function walk(node) {
    if (objLit) return;
    const isExportedConst =
      ts.isVariableStatement(node) &&
      node.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword);
    if (isExportedConst) {
      for (const decl of node.declarationList.declarations) {
        let init = decl.initializer;
        // Unwrap `… as const`, `… satisfies T`, and parentheses.
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

  if (!objLit) {
    throw new Error(`No exported object literal found in ${filePath}`);
  }

  const order = [];
  const seen = new Set();
  const duplicates = [];
  const values = {};
  for (const prop of objLit.properties) {
    if (!ts.isPropertyAssignment(prop)) continue; // skip spreads/methods (none expected)
    const name = prop.name;
    let key = null;
    if (ts.isStringLiteral(name) || ts.isNoSubstitutionTemplateLiteral(name)) {
      key = name.text;
    } else if (ts.isIdentifier(name) || ts.isNumericLiteral(name)) {
      key = name.text;
    }
    if (key == null) continue;
    if (seen.has(key)) duplicates.push(key);
    else {
      seen.add(key);
      order.push(key);
    }
    const v = prop.initializer;
    if (ts.isStringLiteral(v) || ts.isNoSubstitutionTemplateLiteral(v)) values[key] = v.text;
  }
  return { keys: order, set: seen, duplicates, values };
}

// Interpolation tokens that MUST survive translation unchanged: {name}, {n},
// {handle}, {count}, … plus %s / %d. A dropped or renamed token silently voids
// a dynamic value (the bug that shipped "Welcome" for "Welcome {name}").
const PLACEHOLDER_RE = /\{[^}]+\}|%[sd]/g;
function placeholders(str) {
  return str ? [...str.matchAll(PLACEHOLDER_RE)].map((m) => m[0]).sort() : [];
}
function sameSet(a, b) {
  return a.length === b.length && a.every((x, i) => x === b[i]);
}

function localeFiles() {
  return readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".ts"))
    .map((f) => f.slice(0, -3))
    .sort();
}

function loadBaseline() {
  try {
    const raw = JSON.parse(readFileSync(BASELINE_PATH, "utf8"));
    const out = {};
    for (const [loc, keys] of Object.entries(raw)) {
      if (loc.startsWith("_")) continue; // _comment etc.
      out[loc] = new Set(keys);
    }
    return out;
  } catch {
    return {};
  }
}

function main() {
  const update = process.argv.includes("--update");

  const locales = localeFiles();
  if (!locales.includes(REFERENCE)) {
    console.error(`${RED}Reference locale "${REFERENCE}" not found in ${MESSAGES_DIR}${RESET}`);
    process.exit(1);
  }

  const extracted = {};
  for (const loc of locales) {
    extracted[loc] = extractKeys(join(MESSAGES_DIR, `${loc}.ts`));
  }

  const ref = extracted[REFERENCE];
  const refKeys = ref.keys;
  const others = locales.filter((l) => l !== REFERENCE);

  // --update: snapshot current gaps as the new baseline and stop.
  if (update) {
    const baseline = {
      _comment:
        "Known-missing i18n keys per locale (vs en). The parity guardrail " +
        "(scripts/check-i18n-parity.mjs) fails on any gap NOT listed here, so " +
        "this is a ratchet that may only shrink. Regenerate after a reviewed " +
        "translation backfill with: npm run check:i18n -- --update",
    };
    for (const loc of others) {
      const missing = refKeys.filter((k) => !extracted[loc].set.has(k));
      baseline[loc] = missing; // already in en order
    }
    writeFileSync(BASELINE_PATH, JSON.stringify(baseline, null, 2) + "\n");
    const total = others.reduce((n, l) => n + baseline[l].length, 0);
    console.log(
      `${GREEN}Baseline rewritten${RESET} → ${BASELINE_PATH}\n` +
        `  reference ${REFERENCE}: ${refKeys.length} keys\n` +
        `  recorded ${total} known gaps across ${others.length} locales`,
    );
    return;
  }

  const baseline = loadBaseline();
  let failed = false;

  console.log(`${BOLD}i18n parity${RESET} ${DIM}(reference: ${REFERENCE}, ${refKeys.length} keys)${RESET}`);

  // Reference-file self-checks: duplicates are always a bug.
  if (ref.duplicates.length) {
    failed = true;
    console.log(`  ${RED}✗ ${REFERENCE}${RESET} has ${ref.duplicates.length} duplicate key(s): ${ref.duplicates.join(", ")}`);
  }

  for (const loc of others) {
    const got = extracted[loc];
    const base = baseline[loc] ?? new Set();

    const missing = refKeys.filter((k) => !got.set.has(k));
    const extra = got.keys.filter((k) => !ref.set.has(k));
    const newlyMissing = missing.filter((k) => !base.has(k));
    // Baseline entries that are now translated, or no longer exist in en:
    const staleBaseline = [...base].filter((k) => got.set.has(k) || !ref.set.has(k));

    // Placeholder integrity: for every key present in BOTH locales, the
    // {…}/%s token set must match en exactly (a dropped/renamed token voids a
    // dynamic value). Independent of the baseline — there is no excuse for it.
    const phMismatch = [];
    for (const k of refKeys) {
      if (!got.set.has(k) || got.values[k] == null || ref.values[k] == null) continue;
      if (!sameSet(placeholders(ref.values[k]), placeholders(got.values[k]))) phMismatch.push(k);
    }

    const translated = refKeys.length - missing.length;
    const localeProblem =
      got.duplicates.length || extra.length || newlyMissing.length || staleBaseline.length || phMismatch.length;

    const status = localeProblem ? `${RED}✗${RESET}` : `${GREEN}✓${RESET}`;
    const gapNote = missing.length
      ? `${DIM}${missing.length} missing (baseline)${RESET}`
      : `${DIM}complete${RESET}`;
    console.log(`  ${status} ${BOLD}${loc}${RESET}  ${translated}/${refKeys.length}  ${gapNote}`);

    if (got.duplicates.length) {
      failed = true;
      console.log(`      ${RED}duplicate key(s):${RESET} ${got.duplicates.join(", ")}`);
    }
    if (newlyMissing.length) {
      failed = true;
      console.log(`      ${RED}${newlyMissing.length} NEW untranslated key(s) (not in baseline):${RESET}`);
      for (const k of newlyMissing.slice(0, 40)) console.log(`        - ${k}`);
      if (newlyMissing.length > 40) console.log(`        … and ${newlyMissing.length - 40} more`);
    }
    if (extra.length) {
      failed = true;
      console.log(`      ${RED}${extra.length} key(s) not in ${REFERENCE} (stale — remove or add to en):${RESET}`);
      for (const k of extra.slice(0, 40)) console.log(`        - ${k}`);
      if (extra.length > 40) console.log(`        … and ${extra.length - 40} more`);
    }
    if (staleBaseline.length) {
      failed = true;
      console.log(`      ${YELLOW}${staleBaseline.length} baseline entr(ies) now translated or gone from en — prune the baseline:${RESET}`);
      for (const k of staleBaseline.slice(0, 40)) console.log(`        - ${k}`);
      if (staleBaseline.length > 40) console.log(`        … and ${staleBaseline.length - 40} more`);
    }
    if (phMismatch.length) {
      failed = true;
      console.log(`      ${RED}${phMismatch.length} key(s) with placeholders that DON'T match ${REFERENCE} (dropped/renamed {…}/%s):${RESET}`);
      for (const k of phMismatch.slice(0, 40)) {
        console.log(`        - ${k}  ${DIM}${REFERENCE}[${placeholders(ref.values[k]).join(",")}] vs ${loc}[${placeholders(got.values[k]).join(",")}]${RESET}`);
      }
      if (phMismatch.length > 40) console.log(`        … and ${phMismatch.length - 40} more`);
    }
  }

  console.log("");
  if (failed) {
    console.log(
      `${RED}${BOLD}i18n parity check failed.${RESET}\n` +
        `  • Translate the new key(s) in the listed locale file(s), or\n` +
        `  • if a deferral is intentional, refresh the baseline:\n` +
        `      ${BOLD}npm run check:i18n -- --update${RESET}\n` +
        `  • Remove any stale/extra keys flagged above.`,
    );
    process.exit(1);
  }
  console.log(`${GREEN}${BOLD}✓ i18n parity OK${RESET} — every untranslated key is a recorded gap; no regressions.`);
}

main();
