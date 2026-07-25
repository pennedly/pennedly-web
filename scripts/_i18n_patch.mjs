#!/usr/bin/env node
// TEMPORARY (wave C) — fix the 4 keys whose existing translations DROPPED their
// {placeholder} (a pre-existing bug; they weren't missing or same-as-en, so the
// backfill didn't touch them). Replaces each value via its AST node span so any
// formatting (incl. value-on-next-line) is handled precisely.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const HERE = dirname(fileURLToPath(import.meta.url));
const MESSAGES_DIR = join(dirname(HERE), "src", "lib", "i18n", "messages");

const PATCH = {
  de: {
    "voice.rx_step1": "Lese deine {n} aktuellen Beiträge",
    "onboarding.mode_analyze_desc": "Pennedly liest die aktuellen Beiträge von {handle} und destilliert deine Themen, deinen Rhythmus und die Dinge, die du nie sagen würdest.",
    "onboarding.done_title_set": "Alles bereit, {name}.",
    "onboarding.done_sub_set": "Pennedly ist bereit, für {handle} in deiner Stimme zu entwerfen. Standardmäßig wird nichts veröffentlicht, bevor du es freigibst.",
  },
  es: {
    "voice.rx_step1": "Leyendo tus {n} publicaciones recientes",
    "onboarding.mode_analyze_desc": "Pennedly lee las publicaciones recientes de {handle} y destila tus temas, tu ritmo y las cosas que nunca dirías.",
    "onboarding.done_title_set": "Todo listo, {name}.",
    "onboarding.done_sub_set": "Pennedly está listo para redactar para {handle} con tu voz. Por defecto, no se publica nada hasta que lo apruebes.",
  },
  fr: {
    "voice.rx_step1": "Lecture de tes {n} posts récents",
    "onboarding.mode_analyze_desc": "Pennedly lit les posts récents de {handle} et en distille tes thèmes, ton rythme et les choses que tu ne dirais jamais.",
    "onboarding.done_title_set": "Tout est prêt, {name}.",
    "onboarding.done_sub_set": "Pennedly est prêt à rédiger pour {handle} dans ta voix. Par défaut, rien n'est publié tant que tu ne l'approuves pas.",
  },
  it: {
    "voice.rx_step1": "Leggo i tuoi {n} post recenti",
    "onboarding.mode_analyze_desc": "Pennedly legge i post recenti di {handle} e distilla i tuoi temi, il tuo ritmo e le cose che non diresti mai.",
    "onboarding.done_title_set": "Tutto pronto, {name}.",
    "onboarding.done_sub_set": "Pennedly è pronto a scrivere per {handle} con la tua voce. Per impostazione predefinita, non viene pubblicato nulla finché non lo approvi.",
  },
  pt: {
    "voice.rx_step1": "Lendo seus {n} posts recentes",
    "onboarding.mode_analyze_desc": "O Pennedly lê os posts recentes de {handle} e destila seus temas, seu ritmo e as coisas que você nunca diria.",
    "onboarding.done_title_set": "Tudo pronto, {name}.",
    "onboarding.done_sub_set": "O Pennedly está pronto para redigir para {handle} na sua voz. Por padrão, nada é publicado até você aprovar.",
  },
  uk: {
    "voice.rx_step1": "Читаю твої останні дописи ({n})",
    "onboarding.mode_analyze_desc": "Pennedly читає останні дописи {handle} і вирізняє твої теми, ритм і те, чого ти ніколи не сказав би.",
    "onboarding.done_title_set": "Усе готово, {name}.",
    "onboarding.done_sub_set": "Pennedly готовий писати для {handle} твоїм голосом. За замовчуванням нічого не публікується, поки ти не схвалиш.",
  },
};

for (const [loc, patch] of Object.entries(PATCH)) {
  const file = join(MESSAGES_DIR, `${loc}.ts`);
  const src = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, src, ts.ScriptTarget.Latest, true);
  const edits = []; // {start, end, text}
  (function walk(n) {
    if (ts.isPropertyAssignment(n)) {
      const nm = n.name;
      const key = ts.isStringLiteral(nm) || ts.isNoSubstitutionTemplateLiteral(nm) || ts.isIdentifier(nm) ? nm.text : null;
      if (key != null && key in patch) {
        edits.push({ start: n.initializer.getStart(sf), end: n.initializer.getEnd(), text: JSON.stringify(patch[key]) });
      }
    }
    ts.forEachChild(n, walk);
  })(sf);
  // Apply from the end so earlier offsets stay valid.
  edits.sort((a, b) => b.start - a.start);
  let out = src;
  for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
  writeFileSync(file, out);
  console.log(`${loc}: patched ${edits.length}/${Object.keys(patch).length} keys`);
}
console.log("Patch done.");
