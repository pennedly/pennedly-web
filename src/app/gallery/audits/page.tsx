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
import { apiToAuditDetail } from "@/components/studio/audits-map";
import { DEMO_AUDITS } from "@/components/studio/audits-demo";
import type { AuditDetail } from "@/lib/types";
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

// A realistic GET /api/audits/{id} payload that exercises every mapper path:
// the diff / hours / action shapes (power · sliders · powerOff · plus icons),
// status from decisions (applied+effect · applied+measuring · rejected ·
// undecided) and the self-learning loop. Renders through apiToAuditDetail so a
// mapper regression shows up here, not only in prod.
const SAMPLE_API_DETAIL: AuditDetail = {
  id: 1,
  account_id: 1,
  period_start: "2026-06-23T00:00:00Z",
  period_end: "2026-06-30T00:00:00Z",
  posts_analyzed: 6,
  metrics_summary: {
    verdict: { verdict: "Ровная неделя: охваты держатся, разговор просел.", signal: "flat", signal_label: "ровно", confidence: "med" },
    wins: [{ post_id: "1", text: "Пост про утренние ритуалы", num: "4.1k", unit: "просмотров", mult: "×2.4 среднего", why: "конкретный момент" }],
    losses: [{ post_id: "2", text: "Новости платформы", num: "0.6k", unit: "просмотров", mult: "×0.4 среднего", why: "мимо аудитории" }],
    caveat: "Всего <b>6 постов</b> — выводы осторожные.",
  },
  week_over_week: { delta_pct: -2 },
  proposed_changes: [
    { id: "d1", dim: "topics", shape: "diff", high: true, kind: "post_prompt_edit", title: "Чаще пиши про утренние ритуалы", evidence: "3 поста: медиана <b>4.1k</b> против <b>1.7k</b> — <b>×2.4</b>", expect_dir: "up", expect_label: "вовлечённость", confidence: "high", diff: { type: "add_rule", old_text: "Темы распределены поровну.", new_text: "Приоритет — утренние ритуалы и фокус." } },
    { id: "h1", dim: "timing", shape: "hours", kind: "autopilot_config", title: "Сдвинь «Утренний пост» в вечер", evidence: "твой пик — <b>18:00–21:00</b>, а пост уходит в <b>9:00</b>", expect_dir: "up", expect_label: "просмотры", confidence: "high", payload: { post_hours: [18, 19, 21] }, action_label: "Запуск в вечернее окно по твоему времени" },
    { id: "a1", dim: "scenarios", shape: "action", kind: "scenario_toggle", title: "Включи сценарий «Дежурство»", evidence: "дремлет <b>2 недели</b>, упущено <b>~9</b> окон", expect_dir: "up", expect_label: "ответы", confidence: "med", payload: { scenario_id: 7, enabled: true }, action_label: "«Дежурство» — ответы на свежие комментарии в течение часа" },
    { id: "a2", dim: "scenarios", shape: "action", kind: "scenario_set_limit", title: "Подними лимит ответов до 25", evidence: "пропущено <b>14</b> комментариев — упёрся в дневной лимит", expect_dir: "up", expect_label: "охват ответов", confidence: "high", payload: { scenario_id: 8, max_per_day: 25 }, action_label: "Дневной лимит ответов: <b>10 → 25</b>" },
    { id: "a3", dim: "scenarios", shape: "action", kind: "scenario_toggle", title: "Отключи «Кросс-постинг»", evidence: "6 запусков: медиана <b>0.4k</b> — в <b>4×</b> ниже среднего", expect_dir: "up", expect_label: "среднее по постам", confidence: "med", payload: { scenario_id: 9, enabled: false }, action_label: "«Кросс-постинг» — слабый канал, тянет среднее вниз" },
    { id: "r1", dim: "rules", shape: "action", kind: "user_rule_add", title: "Добавь правило: не открывать определением", evidence: "5 постов с определения: медиана <b>1.1k</b> против <b>1.7k</b>", expect_dir: "up", expect_label: "дочитывания", confidence: "med", payload: { rule_kind: "post", body: "Открывай пост сценой или моментом, а не определением темы." }, action_label: "«Открывай пост сценой, а не определением темы»" },
  ],
  llm_reasoning: "Ровная неделя.",
  llm_model: "test",
  status: "pending",
  user_comments: {},
  applied_at: null,
  created_at: "2026-06-30T00:00:00Z",
  decisions: [
    { id: 1, change_id: "d1", kind: "post_prompt_edit", approved: true, user_comment: null, decided_at: "2026-06-30T01:00:00Z", applied_change: {}, rolled_back: false, effect_pct: 18, engagement_before_pct: null, engagement_after_pct: null },
    { id: 2, change_id: "h1", kind: "autopilot_config", approved: true, user_comment: null, decided_at: "2026-06-30T01:00:00Z", applied_change: {}, rolled_back: false, effect_pct: null, engagement_before_pct: null, engagement_after_pct: null },
    { id: 3, change_id: "a3", kind: "scenario_toggle", approved: false, user_comment: null, decided_at: "2026-06-30T01:00:00Z", applied_change: null, rolled_back: false, effect_pct: null, engagement_before_pct: null, engagement_after_pct: null },
  ],
  loop: { up_pct: 18, rolled: 2 },
};

function MappedFromApiDemo() {
  const { t, locale } = useTranslation();
  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString(locale, { month: "short", day: "numeric" });
  };
  const model = apiToAuditDetail(SAMPLE_API_DETAIL, t, fmtDate);
  return <AuditDetailRedesign model={model} initials="ML" name="Mara Lin" handle="@mara.lin" onBack={() => {}} h={{ onApprove: () => {}, onReject: () => {} }} />;
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

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Detail — mapped from a live API payload (apiToAuditDetail)</h2>
        <Section title="a realistic GET /api/audits/{id} response → AuditDetailModel: every shape (diff · hours · 4 action icons), status from decisions, loop. A mapper regression surfaces here.">
          <MappedFromApiDemo />
        </Section>
      </div>
    </div>
  );
}
