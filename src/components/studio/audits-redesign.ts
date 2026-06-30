// Audit-redesign («Аудит роста») detail-screen data contract + demo fixtures.
// The types mirror the new audit API shape (verdict + loop + week-review +
// proposals grouped by 7 dimensions, each a `diff` / `hours` / `action` card).
// Demo fixtures are transcribed 1:1 from Audit-Redesign-SPEC `audit-data.js` so
// the live screen and the ?demo=1 / /gallery review render identical pixels.
// Per-proposal copy is data (comes from the LLM in prod); the static chrome is
// i18n (audit.detail.* / audit.dim.* / audit.optin.*).

export type AuditDim = "topics" | "scenarios" | "timing" | "voice" | "rules" | "replies" | "format";
export type ProposalConf = "high" | "med" | "low";
export type ProposalStatus = "undecided" | "applied" | "rejected";
export type ProposalShape = "diff" | "hours" | "action";

export type AuditProposal = {
  id: string;
  dim: AuditDim;
  high?: boolean;
  shape: ProposalShape;
  title: string;
  evidence: string; // HTML with <b>numbers</b>
  diff?: { before: string; after: string };
  hours?: { t: string; peak: boolean }[];
  hoursNote?: string;
  action?: { ico: string; kind: string; label: string; off?: boolean };
  expect: { dir: "up" | "flat"; label: string };
  conf: ProposalConf;
  status: ProposalStatus;
  effect?: string | null; // "+18%" / "-9%" once measured; null = measuring
  effectLabel?: string;
};

export type WinLoss = { text: string; num: string; unit: string; mult: string };

export type AuditVerdict = {
  period: string;
  verdict: string;
  signal: "up" | "flat" | "down";
  signalLabel: string;
  conf: ProposalConf;
  posts: number;
};

export type AuditLoop = { up: string; metric: string; window: string; rolled: number };

export type AuditDetailModel = {
  verdict: AuditVerdict;
  loop: AuditLoop | null;
  wins: WinLoss[];
  losses: WinLoss[];
  caveat: string | null;
  proposals: AuditProposal[];
};

// The 7 dimensions in impact order — `subKey` is the group-header sub-line.
export const AUDIT_DIMS: { key: AuditDim; ico: string; subKey: string }[] = [
  { key: "topics", ico: "tag", subKey: "audit.dim.topics_sub" },
  { key: "scenarios", ico: "repeat", subKey: "audit.dim.scenarios_sub" },
  { key: "timing", ico: "clock", subKey: "audit.dim.timing_sub" },
  { key: "voice", ico: "voice", subKey: "audit.dim.voice_sub" },
  { key: "rules", ico: "penline", subKey: "audit.dim.rules_sub" },
  { key: "replies", ico: "replies", subKey: "audit.dim.replies_sub" },
  { key: "format", ico: "format", subKey: "audit.dim.format_sub" },
];

// ── Demo fixtures (RU — this reviewer's locale; transcribed from the SPEC) ────
export const DEMO_AUDIT_DETAIL: AuditDetailModel = {
  verdict: { period: "23–30 июня", verdict: "Неделя ровная: охваты держатся, но разговор просел.", signal: "flat", signalLabel: "ровно", conf: "med", posts: 6 },
  loop: { up: "+18%", metric: "к вовлечённости", window: "за месяц", rolled: 2 },
  wins: [
    { text: "Пост про утренние ритуалы", num: "4.1k", unit: "просмотров", mult: "×2.4 среднего" },
    { text: "Тред о том, как ты режешь черновики", num: "312", unit: "сохранений", mult: "×1.9 среднего" },
    { text: "Ранний ответ под постом коллеги", num: "48", unit: "ответов", mult: "лучший за неделю" },
  ],
  losses: [
    { text: "Пост про новости платформы", num: "0.6k", unit: "просмотров", mult: "×0.4 среднего" },
    { text: "Вечерний пост-вопрос в 23:40", num: "9", unit: "ответов", mult: "мимо пика" },
  ],
  caveat: "На этой неделе вышло <b>6 постов</b> — на пару меньше обычного. По форматам выводы держим осторожными.",
  proposals: [
    { id: "t1", dim: "topics", high: true, shape: "diff", title: "Чаще пиши про утренние ритуалы и фокус", evidence: "3 поста по теме: медиана <b>4.1k</b> просмотров против твоих обычных <b>1.7k</b> — это <b>×2.4</b>.", diff: { before: "Темы распределены поровну, без приоритета.", after: "Приоритет в подсказках — утренние ритуалы, ремесло, фокус." }, expect: { dir: "up", label: "вовлечённость" }, conf: "high", status: "undecided" },
    { id: "t2", dim: "topics", shape: "action", title: "Реже предлагай посты про новости платформы", evidence: "4 поста про новости индустрии: медиана <b>0.9k</b> против <b>1.7k</b> — на <b>47%</b> ниже твоего среднего.", action: { ico: "arrowDown", kind: "Понизить тему", label: "«Новости платформы» — реже в подсказках тем" }, expect: { dir: "up", label: "среднее по постам" }, conf: "med", status: "undecided" },
    { id: "s1", dim: "scenarios", shape: "action", title: "Включи сценарий «Дежурство»", evidence: "Сценарий дремлет 2 недели. За это время ты упустил <b>~9</b> окон для ответа в прайм-тайм.", action: { ico: "power", kind: "Включить сценарий", label: "«Дежурство» — ответы на свежие комментарии в течение часа" }, expect: { dir: "up", label: "ответы" }, conf: "med", status: "undecided" },
    { id: "s2", dim: "scenarios", shape: "action", title: "Подними лимит ответов с 10 до 25 в день", evidence: "Сценарий «Тёплый отклик» пропустил <b>14</b> комментариев за неделю — упёрся в дневной лимит.", action: { ico: "sliders", kind: "Изменить лимит", label: "Дневной лимит ответов: <b>10 → 25</b>" }, expect: { dir: "up", label: "охват ответов" }, conf: "high", status: "undecided" },
    { id: "s3", dim: "scenarios", shape: "diff", title: "Сузь аудиторию сценария «Дежурство»", evidence: "Сейчас он отвечает всем подряд; <b>62%</b> ответов уходят в нейтральные комментарии без отклика.", diff: { before: "Отвечает на все новые комментарии под постом.", after: "Отвечает тем, кто делится своим опытом или задаёт вопрос." }, expect: { dir: "up", label: "качество диалога" }, conf: "med", status: "undecided" },
    { id: "s4", dim: "scenarios", shape: "action", title: "Отключи сценарий «Кросс-постинг»", evidence: "6 запусков за месяц: медиана <b>0.4k</b> — в <b>4×</b> ниже твоего среднего по постам.", action: { ico: "powerOff", kind: "Отключить сценарий", label: "«Кросс-постинг» — слабый канал, тянет среднее вниз", off: true }, expect: { dir: "up", label: "среднее по постам" }, conf: "med", status: "undecided" },
    { id: "tm1", dim: "timing", high: true, shape: "hours", title: "Сдвинь «Утренний пост» в вечернее окно", evidence: "Твой пик активности аудитории — <b>18:00–21:00</b>, а «Утренний пост» уходит в <b>9:00</b>, мимо пика.", hours: [{ t: "09:00", peak: false }, { t: "18:00", peak: true }, { t: "19:30", peak: true }, { t: "21:00", peak: true }], hoursNote: "Сдвинуть запуск сценария на 19:00 по твоему времени.", expect: { dir: "up", label: "просмотры" }, conf: "high", status: "undecided" },
    { id: "v1", dim: "voice", shape: "diff", title: "Убери мотивационные концовки", evidence: "Топ-посты заканчиваются на мысли; 5 слабых закрылись фразой вроде «ты справишься» — медиана <b>1.1k</b> против <b>1.7k</b>.", diff: { before: "Пост может заканчиваться подбадривающей строкой для читателя.", after: "Пост заканчивается на мысли — без «ты справишься» и мотивационных концовок." }, expect: { dir: "up", label: "вовлечённость" }, conf: "high", status: "undecided" },
    { id: "v2", dim: "voice", shape: "diff", title: "Уточни «в одном предложении»", evidence: "Посты, открытые конкретным моментом, собрали в среднем <b>×1.6</b> к твоим постам с определением в начале.", diff: { before: "Мара пишет о ремесле, честно и тепло.", after: "Мара начинает с конкретного момента недели, потом выводит мысль — тепло, но без пафоса." }, expect: { dir: "up", label: "дочитывания" }, conf: "med", status: "undecided" },
    { id: "r1", dim: "rules", shape: "action", title: "Добавь правило: не открывать пост определением", evidence: "5 постов начались с определения в первой строке: медиана <b>1.1k</b> против твоих <b>1.7k</b>.", action: { ico: "plus", kind: "Добавить правило", label: "«Открывай пост сценой или моментом, а не определением темы»" }, expect: { dir: "up", label: "дочитывания" }, conf: "med", status: "undecided" },
    { id: "rp1", dim: "replies", shape: "diff", title: "Твои ответы информируют, но не греют", evidence: "Из <b>38</b> ответов за неделю лишь <b>6</b> получили продолжение диалога — остальные закрыли тему.", diff: { before: "Ответы дают точную справку и закрывают вопрос.", after: "Ответы цепляют деталь из комментария и оставляют зацепку для продолжения." }, expect: { dir: "up", label: "продолжения диалога" }, conf: "med", status: "undecided" },
    { id: "rp2", dim: "replies", shape: "action", title: "Отвечай тем, кто делится своим опытом", evidence: "Ответы на «истории из опыта» собрали <b>×2.1</b> лайков к ответам на нейтральные комментарии.", action: { ico: "users", kind: "Аудитория ответов", label: "Добавить в охват: «делится личным опытом по теме»" }, expect: { dir: "up", label: "тёплые диалоги" }, conf: "med", status: "undecided" },
    { id: "f1", dim: "format", shape: "action", title: "Попробуй карусель для разборов", evidence: "2 карусели за месяц: медиана <b>3.2k</b> против текстовых <b>1.7k</b> — <b>×1.9</b>. Но выборка мала.", action: { ico: "format", kind: "Сменить формат", label: "Предлагать карусель для постов-разборов и пошаговых" }, expect: { dir: "up", label: "просмотры" }, conf: "low", status: "undecided" },
  ],
};
