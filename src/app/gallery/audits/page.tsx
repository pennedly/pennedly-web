"use client";

// State gallery for Audits (/app/audits) — renders the REAL components of the
// «Аудит роста» redesign in every state with NO auth / NO backend, for
// self-verification against Audit-Redesign-SPEC. Lives under /gallery (404 in
// prod). Covers: the opt-in front door (Screen 0) · the list with 7-dimension
// coverage · empty · loading · the detail (verdict + loop + week-review + the
// proposals grouped by dimension, in diff / hours / action shapes) — both fresh
// (all undecided) and decided (applied · measuring · +effect · rejected).

import { useMemo, useState, type ReactNode } from "react";

import { AuditOptIn, AuditRow, AuditsEmpty, AuditsSkeleton, type AuditRowModel } from "@/components/studio/AuditsParts";
import { AuditDetailRedesign } from "@/components/studio/AuditDetailRedesign";
import { DEMO_AUDIT_DETAIL, type AuditDetailModel, type ProposalStatus } from "@/components/studio/audits-redesign";
import { DEMO_AUDITS } from "@/components/studio/audits-demo";
import { useTranslation } from "@/lib/i18n";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h3 className="mb-2 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      <div className="rounded-lg border border-border bg-bg p-4">{children}</div>
    </section>
  );
}

// The detail wired to local state, so approve/reject flip a proposal to
// applied (→ measuring) / rejected live — exactly like the real page.
function DetailDemo() {
  const [model, setModel] = useState<AuditDetailModel>(DEMO_AUDIT_DETAIL);
  const setProposal = (id: string, status: ProposalStatus) =>
    setModel((d) => ({
      ...d,
      proposals: d.proposals.map((p) => (p.id === id ? { ...p, status, effect: status === "applied" ? null : undefined } : p)),
    }));
  return (
    <AuditDetailRedesign
      model={model}
      initials="ML"
      name="Mara Lin"
      handle="@mara.lin"
      onBack={() => {}}
      h={{ onApprove: (id) => setProposal(id, "applied"), onReject: (id) => setProposal(id, "rejected") }}
    />
  );
}

export default function AuditsGallery() {
  const { t } = useTranslation();
  const [dark, setDark] = useState(false);
  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  // Demo list rows — same mapping the live page uses for ?demo=1 (carries the
  // 7-dimension coverage strip).
  const rows: AuditRowModel[] = useMemo(
    () =>
      DEMO_AUDITS.map((a) => ({
        id: a.id,
        title: a.title,
        range: a.range,
        summary: a.summary,
        postsAnalyzed: a.postsAnalyzed,
        wowDelta: a.wowDelta,
        undecided: a.changes.filter((c) => c.status === "undecided").length,
        total: a.changes.length,
        dims: a.dims,
      })),
    [],
  );

  // A "decided" detail variant so the applied / measuring / +effect / rejected
  // chips are all visible statically (the interactive demo above starts fresh).
  const decided: AuditDetailModel = useMemo(
    () => ({
      ...DEMO_AUDIT_DETAIL,
      proposals: DEMO_AUDIT_DETAIL.proposals.map((p, i) =>
        i === 0
          ? { ...p, status: "applied", effect: "+18%", effectLabel: t("audits.effect_engagement") }
          : i === 1
            ? { ...p, status: "applied", effect: null }
            : i === 2
              ? { ...p, status: "rejected" }
              : p,
      ),
    }),
    [t],
  );

  return (
    <div className="min-h-screen bg-bg p-6 text-text">
      <div className="mx-auto max-w-[760px]">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-h2 font-semibold">Audits — state gallery</h1>
            <p className="text-caption text-text-subtle">dev-only · real components, no backend · compare to Audit-Redesign-SPEC</p>
          </div>
          <button type="button" onClick={toggleDark} className="shrink-0 rounded-md border border-border px-3 py-1.5 text-small transition-colors hover:bg-surface-2">
            {dark ? "Light" : "Dark"}
          </button>
        </header>

        <h2 className="mb-3 text-h3 font-semibold">Screen 0 — opt-in front door (OFF by default)</h2>
        <Section title="hero (eyebrow · title · lede · 7-area chips · «Включить» CTA · note) + benefit grid + reassure">
          <AuditOptIn onEnable={() => {}} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Screen 2 — the list (7-dimension coverage)</h2>
        <Section title="rows · «К разбору» / «Разобрано» · range · posts · decided/total · WoW · coverage dots (on/off)">
          <div className="flex flex-col gap-3">
            {rows.map((r) => (
              <AuditRow key={r.id} audit={r} onOpen={() => {}} />
            ))}
          </div>
        </Section>
        <Section title="empty — first audit hasn't run yet">
          <AuditsEmpty />
        </Section>
        <Section title="loading — skeleton rows">
          <AuditsSkeleton />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Detail — «Аудит роста» (interactive · click approve/reject)</h2>
        <Section title="verdict header · self-learning loop · «Разбор недели» (wins/losses) · proposals grouped by 7 dimensions (diff / hours / action)">
          <DetailDemo />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Detail — decided states (applied · measuring · +18% effect · rejected)</h2>
        <Section title="first three proposals pre-decided so every footer chip is visible at once">
          <AuditDetailRedesign model={decided} initials="ML" name="Mara Lin" handle="@mara.lin" onBack={() => {}} h={{ onApprove: () => {}, onReject: () => {} }} />
        </Section>
      </div>
    </div>
  );
}
