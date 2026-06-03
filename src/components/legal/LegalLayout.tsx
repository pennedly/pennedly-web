"use client";

// Reusable legal-page template — restyled 1:1 to
// design-export/PennedlyDesign/legal-* : a sticky top bar (brand · theme
// toggle), a readable 720px article column with a "Back to home" link, an
// eyebrow, title, intro, an auto-generated table of contents, prose sections
// built from typed blocks, and a footer linking the three legal docs + home.
//
// The chrome and styling come from the design; the *content* of each doc is
// the real, reviewed legal text — passed in as `doc` by each route. Block
// `text`/`items` accept ReactNode so the real copy keeps its inline links and
// emphasis (server → client serialization handles the embedded elements).

import Link from "next/link";
import { useEffect, useState } from "react";

import { BrandMark, IcArrowLeft, IcMail, IcMoon, IcSun } from "@/components/icons";

// Plain-string content (matches the design's data model — no inline markup;
// clickable contacts live in `contact` blocks and the footer). Pure strings
// also keep the doc fully serializable across the server → client boundary.
export type LegalBlock =
  | { t: "p"; text: string }
  | { t: "h3"; text: string }
  | { t: "ul"; items: string[] }
  | { t: "operator" }
  | { t: "contact"; email: string; text: string };

// Operator of record (factual legal-entity disclosure — keep verbatim). Shown
// as the design's `.operator` identity card.
const LEGAL_OPERATOR = {
  name: 'Fundacja Rozwoju Przedsiębiorczości "Twój StartUp"',
  regs: ["KRS 0000442857", "NIP 5213641211", "REGON 14643346700000"],
  city: "ul. Żurawia 6/12 lok. 766, 00-503 Warszawa, Poland",
};

export type LegalSection = { id: string; h: string; blocks: LegalBlock[] };

export type LegalDocKey = "privacy" | "terms" | "dataDeletion";

export type LegalDoc = {
  key: LegalDocKey;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
};

const FOOTER_DOCS: { key: LegalDocKey; label: string; href: string }[] = [
  { key: "privacy", label: "Privacy Policy", href: "/privacy" },
  { key: "terms", label: "Terms of Service", href: "/terms" },
  { key: "dataDeletion", label: "Data Deletion", href: "/data-deletion" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* storage disabled — toggle still applies this session */
    }
    setDark(next);
  }
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-surface text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
    >
      {dark ? <IcSun size={17} /> : <IcMoon size={16} />}
    </button>
  );
}

function Block({ block }: { block: LegalBlock }) {
  switch (block.t) {
    case "h3":
      return <h3 className="mt-[22px] text-h3 font-semibold text-text">{block.text}</h3>;
    case "p":
      return <p className="mt-3 max-w-[68ch] text-body leading-[1.72] text-text-muted">{block.text}</p>;
    case "ul":
      return (
        <ul className="mt-3 flex max-w-[68ch] flex-col gap-2.5">
          {block.items.map((it, i) => (
            <li key={i} className="relative pl-[22px] text-body leading-relaxed text-text-muted">
              <span className="absolute left-1 top-[9px] h-1.5 w-1.5 rotate-45 rounded-[2px] bg-ink-400" />
              {it}
            </li>
          ))}
        </ul>
      );
    case "operator":
      return (
        <div className="mt-3.5 max-w-[68ch] rounded-lg border border-border bg-surface px-[17px] py-[15px]">
          <div className="text-body font-semibold leading-[1.4] text-text">{LEGAL_OPERATOR.name}</div>
          <div className="mt-2.5 flex flex-wrap gap-[7px]">
            {LEGAL_OPERATOR.regs.map((r) => (
              <span
                key={r}
                className="whitespace-nowrap rounded-sm border border-border bg-surface-2 px-2 py-[3px] font-mono text-caption text-text-muted"
              >
                {r}
              </span>
            ))}
          </div>
          <div className="mt-2.5 text-small text-text-subtle">{LEGAL_OPERATOR.city}</div>
        </div>
      );
    case "contact":
      return (
        <div className="mt-4 inline-flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-[13px]">
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-md border border-border bg-surface-2 text-text-muted">
            <IcMail size={17} />
          </span>
          <span className="min-w-0">
            <span className="block text-caption text-text-subtle">{block.text}</span>
            <span className="text-small font-semibold">
              <a href={`mailto:${block.email}`} className="text-accent hover:underline hover:underline-offset-2">
                {block.email}
              </a>
            </span>
          </span>
        </div>
      );
  }
}

function jumpTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 72;
  window.scrollTo({ top, behavior: "smooth" });
}

export function LegalLayout({ doc }: { doc: LegalDoc }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      {/* Top bar */}
      <header className="sticky top-0 z-10 shrink-0 border-b border-border bg-bg/[0.86] backdrop-blur-md backdrop-saturate-150">
        <div className="mx-auto flex h-[60px] w-full max-w-[980px] items-center gap-3.5 px-5 sm:px-7">
          <Link href="/" className="flex items-center gap-2.5 text-text">
            <BrandMark size={30} radius={9} className="shadow-sm" />
            <span className="text-h3 font-semibold tracking-tight">Pennedly</span>
          </Link>
          <span className="flex-1" />
          <ThemeToggle />
        </div>
      </header>

      {/* Article */}
      <main className="flex-1 pb-6 pt-11">
        <div className="mx-auto w-full max-w-[720px] px-5 sm:px-7">
          <Link
            href="/"
            className="mb-[26px] inline-flex items-center gap-[7px] whitespace-nowrap text-small font-medium text-text-muted transition-colors hover:text-text"
          >
            <IcArrowLeft size={15} /> Back to home
          </Link>

          <div className="text-caption font-semibold uppercase tracking-[0.06em] text-text-subtle">Legal</div>
          <h1 className="mt-3 text-h1 font-semibold tracking-[-0.015em]">{doc.title}</h1>
          <div className="mt-2.5 text-small text-text-subtle">{doc.updated}</div>
          <p className="mt-5 max-w-[60ch] text-pretty text-h3 font-normal leading-[1.55] text-text-muted">{doc.intro}</p>

          {/* Table of contents */}
          <nav aria-label="On this page" className="mt-7 rounded-lg border border-border bg-surface-2 px-[18px] py-4">
            <div className="mb-2.5 text-caption font-semibold uppercase tracking-[0.05em] text-text-subtle">
              On this page
            </div>
            <ul className="grid list-none grid-cols-1 gap-x-7 gap-y-[9px] p-0 sm:grid-cols-2">
              {doc.sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      jumpTo(s.id);
                    }}
                    className="block text-small text-text-muted transition-colors hover:text-accent"
                  >
                    <span className="mr-[9px] inline-block text-caption tabular-nums text-text-subtle">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {s.h.replace(/^\d+\.\s*/, "")}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Prose */}
          <article className="mt-3.5">
            {doc.sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-[76px] pt-[34px]">
                <h2 className="mb-1 text-h2 font-semibold tracking-[-0.01em]">{s.h}</h2>
                {s.blocks.map((b, i) => (
                  <Block key={i} block={b} />
                ))}
              </section>
            ))}
            <div className="mt-10 border-t border-border pt-[22px] text-small text-text-subtle">
              {doc.title} · {doc.updated}
            </div>
          </article>
        </div>
      </main>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border pb-[30px] pt-[22px]">
        <div className="mx-auto flex w-full max-w-[980px] flex-wrap items-center gap-x-5 gap-y-3.5 px-5 sm:px-7">
          <span className="inline-flex items-center gap-2 text-small text-text-muted">
            <BrandMark size={20} radius={6} /> © {new Date().getFullYear()} Pennedly
          </span>
          <span className="flex-1" />
          <nav aria-label="Legal pages" className="flex flex-wrap items-center gap-x-[18px] gap-y-1.5">
            {FOOTER_DOCS.map((d) => (
              <Link
                key={d.key}
                href={d.href}
                aria-current={doc.key === d.key ? "page" : undefined}
                className={
                  doc.key === d.key
                    ? "text-small font-semibold text-text"
                    : "text-small text-text-muted transition-colors hover:text-text"
                }
              >
                {d.label}
              </Link>
            ))}
            <Link href="/" className="text-small text-text-muted transition-colors hover:text-text">
              Home
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
