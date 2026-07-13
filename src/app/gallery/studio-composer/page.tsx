"use client";

// /gallery/studio-composer — the «Строка» composer in every state, hermetic
// (no auth/backend). The composer manages its own focus/ideas state, so each
// harness just supplies value/count + an `onIdeas` that resolves to results,
// resolves to [] (empty), or throws (error). Open the palette with the ✨.

import { useState, type ReactNode } from "react";

import { StudioComposer } from "@/components/studio/StudioParts";
import type { Idea } from "@/lib/types";

const noop = () => {};

const DEMO_IDEAS: Idea[] = [
  { hook: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by.", angle: "Contrarian take on polish vs. authenticity" },
  { hook: "Crickets are data, not a verdict.", angle: "Reframe a quiet post as a signal, not a failure" },
  { hook: "I stopped chasing viral and my reach went up. Here's what I did instead.", angle: "Counterintuitive growth story from your own runs" },
  { hook: "Three years of writing online taught me one thing worth repeating.", angle: "A short, quotable lesson from experience" },
];

type Outcome = "results" | "empty" | "error";

function Harness({ outcome = "results", busy = false, disabled = false, seed = "" }: { outcome?: Outcome; busy?: boolean; disabled?: boolean; seed?: string }) {
  const [value, setValue] = useState(seed);
  const [count, setCount] = useState(3);
  return (
    <StudioComposer
      avatarText="ML"
      value={value}
      onChange={setValue}
      count={count}
      onCount={setCount}
      onGenerate={noop}
      onIdeas={async () => {
        await new Promise((r) => setTimeout(r, 450));
        if (outcome === "error") throw new Error("ideas unavailable");
        return outcome === "empty" ? [] : DEMO_IDEAS;
      }}
      busy={busy}
      busyCount={count}
      disabled={disabled}
    />
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="mb-1 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      {hint && <p className="mb-2 text-caption text-text-subtle">{hint}</p>}
      <div className="rounded-lg border border-border bg-bg p-4">{children}</div>
    </section>
  );
}

export default function StudioComposerGallery() {
  return (
    <main className="mx-auto max-w-[720px] px-6 py-10 text-text">
      <h1 className="mb-1 text-h2 font-semibold">Studio composer · «Строка»</h1>
      <p className="mb-8 text-small text-text-subtle">
        Collapsed until focus/typing, then the shelf discloses. The ✨ opens the Ideas palette
        (загрузка → результаты / пусто / ошибка). Cmd/Ctrl+Enter generates.
      </p>

      <Section title="collapsed → open" hint="Click into the field: the shelf (chips + 1·2·3·4 + Generate) discloses.">
        <Harness />
      </Section>

      <Section title="filled (shelf open, Generate enabled)" hint="Has text, so it stays open.">
        <Harness seed="Почему маленькие аккаунты получают больше ответов, чем большие" />
      </Section>

      <Section title="ideas · results" hint="Tap ✨ → loading → a list of hook + angle cards; tap one to seed the brief.">
        <Harness outcome="results" />
      </Section>

      <Section title="ideas · empty" hint="Tap ✨ → the honest «идей пока нет» with Try again / Close.">
        <Harness outcome="empty" />
      </Section>

      <Section title="ideas · error" hint="Tap ✨ → the danger-toned error, brief preserved, Try again.">
        <Harness outcome="error" />
      </Section>

      <Section title="busy (generating)">
        <Harness busy seed="a brief" />
      </Section>

      <Section title="disabled (no connected account)" hint="Generate + ✨ + Ideas chip disabled.">
        <Harness disabled seed="a brief" />
      </Section>
    </main>
  );
}
