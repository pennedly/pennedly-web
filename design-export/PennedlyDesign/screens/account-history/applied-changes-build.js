/* applied-changes-build.js — общий рендер экрана «Что Pennedly изменил за меня»
   (единый журнал применённых изменений + откат) для десктопной и мобильной
   спек, чтобы не расходились. Источники: Агент · Проверка голоса · Аудит.

   Держится семантических токенов ds/tokens.css + компонентов ds/components.css
   + слоя applied-changes.css. Тон — журнал доверия, не инженерный лог: никакого
   JSON, детали переведены в человеческие факты. Один спокойный тон источников,
   один акцент, обе темы.

   Экспортирует window.ACH. Ничего сам не монтирует — каждая спека зовёт ACH.* */
(function () {
  "use strict";

  /* ------------------------------- иконки -------------------------------- */
  var G = {
    advisor: "<path d='M4 16V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H9l-4 4v-4Z'/><path d='M8 13l2.6-2.6 1.8 1.8L16 9'/><path d='M13.4 9H16v2.6'/>",
    nib: "<path d='M4 20 13 11'/><path d='M12 4 20 12 13 11 13 4Z'/><circle cx='6' cy='18' r='0.6'/>",
    audit: "<rect x='5' y='4' width='14' height='17' rx='2'/><path d='M9 4.5h6V7H9Z'/><path d='M8.5 12.5l2 2 4-4.5'/>",
    clock: "<circle cx='12' cy='12' r='8.5'/><path d='M12 7.5V12l3 2'/>",
    tag: "<path d='M3.6 12.4 11 5A2 2 0 0 1 12.4 4.4H18A1.7 1.7 0 0 1 19.7 6v5.6a2 2 0 0 1-.6 1.4l-7.4 7.4a1.7 1.7 0 0 1-2.4 0l-5.7-5.6a1.7 1.7 0 0 1 0-2.4Z'/><circle cx='15.3' cy='8.7' r='1.2'/>",
    calendar: "<rect x='4' y='5' width='16' height='16' rx='2'/><path d='M4 9.5h16M8 3v4M16 3v4'/>",
    reply: "<path d='M9 7 4 12l5 5M4 12h9a6 6 0 0 1 6 6v1'/>",
    gauge: "<path d='M4 17.5a8 8 0 0 1 16 0'/><path d='M12 17.5l4.2-4.6'/><circle cx='12' cy='17.7' r='0.6'/>",
    x: "<path d='M6 6l12 12M18 6 6 18'/>",
    check: "<path d='M4.5 12.5 9.5 17.5 19.5 6.5'/>",
    undo: "<path d='M9 7 5 11l4 4'/><path d='M5 11h9a5 5 0 0 1 0 10h-3'/>",
    "arrow-right": "<path d='M5 12h14M13 6l6 6-6 6'/>",
    "chev-right": "<path d='M9 6l6 6-6 6'/>",
    sparkle: "<path d='M12 4l1.6 4.8L18 10l-4.4 1.2L12 16l-1.6-4.8L6 10l4.4-1.2L12 4Z'/>",
    plus: "<path d='M12 5v14M5 12h14'/>",
    sun: "<circle cx='12' cy='12' r='4'/><path d='M12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19'/>",
    menu: "<path d='M4 7h16M4 12h16M4 17h16'/>",
    person: "<circle cx='12' cy='8' r='3.5'/><path d='M5 20a7 7 0 0 1 14 0'/>",
    filter: "<path d='M4 5h16l-6 7v6l-4 2v-8L4 5Z'/>",
    alert: "<path d='M12 3 2 20h20L12 3Z'/><path d='M12 10v4M12 17h.01'/>",
    refresh: "<path d='M20 11a8 8 0 1 0-1 5'/><path d='M20 5v6h-6'/>"
  };
  function ic(n, s) { s = s || 14; return "<svg width='" + s + "' height='" + s + "' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'>" + (G[n] || "") + "</svg>"; }

  /* источники — один спокойный тон, различает только глиф. «Голос» = проверка голоса */
  var SRC = { agent: { ic: "advisor", name: "Агент" }, voice: { ic: "nib", name: "Проверка голоса" }, audit: { ic: "audit", name: "Аудит" } };
  function srcChip(src) { var s = SRC[src]; return "<span class='ch-src'>" + ic(s.ic, 13) + s.name + "</span>"; }
  function actorLabel(by) { return by === "auto" ? "Pennedly" : "вы"; }
  function actorMeta(by) { return by === "auto" ? "Применил Pennedly" : "Применили вы"; }

  /* ───────── откат: 3 состояния ───────── */
  function rollback(rb) {
    rb = rb || {};
    if (rb.done) return "<div class='ch-rollback ch-rb--done'><span class='ch-rb-ico'>" + ic("undo", 14) + "</span><span class='ch-rb-txt'><b>Откачено " + rb.done + ".</b> Вернулось прежнее состояние.</span></div>";
    if (rb.can) return "<div class='ch-rollback ch-rb--can'><span class='ch-rb-ico'>" + ic("undo", 14) + "</span><span class='ch-rb-txt'>Можно вернуть прежнее состояние.</span><button class='btn btn--ghost btn--sm ch-rb-btn'>" + ic("undo", 14) + " Откатить</button></div>";
    var R = {
      later: { t: "<b>Откат появится позже.</b> Скоро можно будет вернуть прежнее состояние отсюда.", link: null },
      covered: { t: "<b>Откат недоступен:</b> изменение уже заменено более новым.", link: "Открыть правило" },
      irreversible: { t: "<b>Откат недоступен:</b> изменение необратимо, пост уже опубликован.", link: "Открыть пост" }
    };
    var r = R[rb.off] || R.later;
    return "<div class='ch-rollback ch-rb--off'><span class='ch-rb-ico'>" + ic("undo", 14) + "</span><span class='ch-rb-txt'>" + r.t + (r.link ? " <a class='ch-rb-link'>" + r.link + ic("arrow-right", 12) + "</a>" : "") + "</span></div>";
  }
  function detailInner(r) {
    var b = "";
    if (r.params) b += "<div class='ch-params'>" + r.params.map(function (p) { return "<div class='ch-param'>" + ic(p[0], 15) + "<span>" + p[1] + "</span></div>"; }).join("") + "</div>";
    if (r.pairs) b += "<div class='ch-pairs'>" + r.pairs.map(function (p) { return "<div class='ch-pair'><span class='ch-pair-k'>" + p[0] + "</span><span class='ch-pair-v'><span class='ch-pair-old'>" + p[1] + "</span>" + ic("arrow-right", 12) + "<span class='ch-pair-new'>" + p[2] + "</span></span></div>"; }).join("") + "</div>";
    if (r.draft) b += "<div class='ch-draft'>" + r.draft + "</div>";
    if (r.diff) b += "<div class='ch-diff'><div class='ch-diff-line ch-diff-line--old'><span class='dl-k'>Было</span><span>" + r.diff[0] + "</span></div><div class='ch-diff-line ch-diff-line--new'><span class='dl-k'>Стало</span><span>" + r.diff[1] + "</span></div></div>";
    b += "<div class='ch-meta'>" + ic("check", 13) + "<span>" + actorMeta(r.by) + " · " + r.when + "</span><a class='ch-open'>" + r.open + ic("arrow-right", 13) + "</a></div>";
    b += rollback(r.rb);
    return "<div class='ch-detail'><div class='ch-detail-inner'>" + b + "</div></div>";
  }
  function row(r, open) {
    var reverted = r.rb && r.rb.done;
    return "<div class='ch-row" + (open ? " ch-row--open" : "") + (reverted ? " ch-row--reverted" : "") + "'>"
      + "<button class='ch-row-head'>" + srcChip(r.src)
      + "<span class='ch-row-body'><span class='ch-row-title'>" + r.title + "</span><span class='ch-row-type'> · " + r.type + "</span></span>"
      + (reverted ? "<span class='ch-revert-badge'>Откачено</span>" : "<span class='ch-actor'>" + actorLabel(r.by) + "</span>")
      + "<span class='ch-time'>" + r.time + "</span><span class='ch-chev'>" + ic("chev-right", 16) + "</span></button>"
      + (open ? detailInner(r) : "") + "</div>";
  }
  function dayGroup(label, rows) { return "<div class='ch-daygroup'><div class='ch-dayhead'>" + label + "</div><div class='ch-items'>" + rows.join("") + "</div></div>"; }

  /* ───────── записи (свежие сверху), с актором «вы»/«Pennedly» ───────── */
  var REC = {
    r1: { src: "agent", by: "me", type: "рутина", title: "Посты про рыбалку", time: "14:02",
      params: [["clock", "3 поста в день · ~9:00, 14:00, 20:00"], ["tag", "Тема: рыбалка"], ["nib", "В голосе аккаунта"]],
      when: "сегодня, 14:02", open: "Открыть рутину", rb: { off: "later" } },
    r2: { src: "voice", by: "auto", type: "правило голоса", title: "Короче и без эмодзи", time: "11:20",
      diff: ["Обычная длина · эмодзи ок", "Короче · без эмодзи"],
      when: "сегодня, 11:20", open: "Открыть правило", rb: { off: "later" } },
    r3: { src: "agent", by: "me", type: "автоответы", title: "Включены автоответы: всем, кроме троллей", time: "10:05",
      pairs: [["Кому отвечать", "не отвечал", "всем, кроме троллей"], ["Лимит в день", "нет", "10 ответов"], ["Короткие реакции", "учитывать", "пропускать"]],
      when: "сегодня, 10:05", open: "Открыть ответы", rb: { off: "later" } },
    r4: { src: "audit", by: "me", type: "правка аудита", title: "Заканчивать пост на мысли", time: "вчера",
      diff: ["Иногда добавляю мотивирующую строку в конце", "Заканчиваю на мысли, без «давай, ещё»"],
      when: "вчера, 09:15", open: "Открыть аудит", rb: { off: "covered" } },
    r5: { src: "agent", by: "me", type: "расписание", title: "Вечерние посты перенёс на утро", time: "вчера",
      diff: ["Вечером · 20:00", "Утром · 9:00"],
      when: "вчера, 16:40", open: "Открыть расписание", rb: { off: "later" } },
    r6: { src: "voice", by: "auto", type: "удаление пункта", title: "Убрал пункт про хэштеги", time: "вчера",
      diff: ["В голосе: «ставь 2-3 хэштега»", "Пункт про хэштеги убран"],
      when: "вчера, 12:03", open: "Открыть правило", rb: { off: "later" } },
    r7: { src: "agent", by: "me", type: "пост", title: "Пост про запуск рубрики", time: "3 июл",
      draft: "Запускаем новую рубрику: короткие разборы чужих ошибок в постинге. Первый выпуск в четверг. С чего начать?",
      params: [["calendar", "Черновик на вторник, 18:00"]],
      when: "3 июля, 18:22", open: "Открыть пост", rb: { off: "irreversible" } },
    r8: { src: "audit", by: "auto", type: "правка аудита", title: "Длинные посты на утро вторника", time: "3 июл",
      diff: ["Длинные посты выходят когда придётся", "Длинные посты по вторникам, 8:00–10:00"],
      when: "3 июля, 08:30", open: "Открыть аудит", rb: { off: "later" } },
    r9: { src: "voice", by: "auto", type: "интро", title: "Обновил вступление голоса", time: "3 июл",
      diff: ["Пишу о продукте и стартапах", "Пишу о продукте, ремесле письма и честном пути"],
      when: "3 июля, 10:11", open: "Открыть правило", rb: { off: "later" } },
    r10: { src: "agent", by: "me", type: "список тем", title: "Темы недели: письмо и ремесло", time: "3 июл",
      params: [["tag", "5 тем в очереди"], ["nib", "Ремесло · честный путь · привычки"]],
      when: "3 июля, 09:02", open: "Открыть темы", rb: { off: "later" } }
  };
  var ORDER = { today: ["r1", "r2", "r3"], yest: ["r4", "r5", "r6"], jul: ["r7", "r8", "r9", "r10"] };
  var SRCFILTERS = [["all", "Все"], ["agent", "Агент"], ["voice", "Проверка голоса"], ["audit", "Аудит"]];

  function countBy(filter) {
    var n = 0; Object.keys(REC).forEach(function (k) { if (filter === "all" || REC[k].src === filter) n++; }); return n;
  }
  function filters(active) {
    active = active || "all";
    return "<div class='ch-filters' role='tablist' aria-label='Фильтр по источнику'>"
      + SRCFILTERS.map(function (f) {
        var on = f[0] === active;
        var glyph = f[0] === "all" ? ic("filter", 12) : ic(SRC[f[0]].ic, 12);
        return "<button class='ch-filter" + (on ? " ch-filter--on" : "") + "' role='tab' aria-selected='" + on + "'>" + glyph + f[1] + "</button>";
      }).join("") + "</div>";
  }
  function toolbar(filter, showFilters) {
    return "<div class='ch-toolbar'><span class='ch-count'><b>" + countBy(filter) + "</b> " + plural(countBy(filter)) + "</span>"
      + "<span class='ch-filterslot'>" + (showFilters ? filters(filter) : "") + "</span></div>";
  }
  function plural(n) { var d = n % 10, dd = n % 100; if (d === 1 && dd !== 11) return "изменение"; if (d >= 2 && d <= 4 && (dd < 10 || dd >= 20)) return "изменения"; return "изменений"; }
  function crumb() { return "<div class='ch-crumb'><a>Аккаунт</a>" + ic("chev-right", 13) + "<span>История изменений</span></div>"; }
  function pagehead() { return "<div><div class='ch-pagehead-t'>История изменений</div><div class='ch-pagehead-d'>Всё, что Pennedly применил за тебя одним кликом: из Агента, проверки Голоса и Аудита. Свежие сверху.</div></div>"; }

  function groupsFor(filter, openFirst) {
    filter = filter || "all";
    function pick(ids) { return ids.filter(function (id) { return filter === "all" || REC[id].src === filter; }); }
    var out = [];
    var t = pick(ORDER.today), y = pick(ORDER.yest), j = pick(ORDER.jul);
    if (t.length) out.push(dayGroup("Сегодня", t.map(function (id, i) { return row(REC[id], openFirst && i === 0); })));
    if (y.length) out.push(dayGroup("Вчера", y.map(function (id) { return row(REC[id]); })));
    if (j.length) out.push(dayGroup("3 июля", j.map(function (id) { return row(REC[id]); })));
    return out.join("");
  }

  /* ───────── состояния экрана ───────── */
  function feed(opts) {
    opts = opts || {};
    var filter = opts.filter || "all";
    var more = (filter === "all") ? "<div class='ch-more'><button class='btn btn--secondary btn--sm'>Показать ещё</button></div>" : "";
    return screenShell(toolbar(filter, opts.showFilters !== false) + "<div class='ch-list'>" + groupsFor(filter, opts.open) + "</div>" + more, opts);
  }
  function skelRow() { return "<div class='ch-skel-row'><span class='ch-skel-chip'></span><span class='ch-skel-lines'><span class='ch-skel-bar' style='width:62%'></span><span class='ch-skel-bar ch-skel-bar--sm' style='width:34%'></span></span><span class='ch-skel-time'></span></div>"; }
  function loading(opts) {
    opts = opts || {};
    var card = "<div class='ch-items ch-skel'>" + skelRow() + skelRow() + skelRow() + "</div>";
    var grp = "<div class='ch-daygroup'><div class='ch-dayhead ch-skel-head'></div>" + card + "</div>";
    return screenShell("<div class='ch-toolbar'><span class='ch-count ch-skel-count'></span></div><div class='ch-list' aria-busy='true'>" + grp + "</div>", opts);
  }
  function errorState(opts) {
    opts = opts || {};
    var e = "<div class='ch-error' role='alert'><span class='ch-error-ico'>" + ic("alert", 20) + "</span>"
      + "<div class='ch-error-body'><div class='ch-error-t'>Не удалось загрузить историю</div>"
      + "<div class='ch-error-s'>Что-то пошло не так на нашей стороне. Изменения никуда не делись — попробуйте обновить.</div></div>"
      + "<button class='btn btn--secondary btn--sm ch-error-btn'>" + ic("refresh", 14) + " Повторить</button></div>";
    return screenShell(toolbar("all", false) + e, opts);
  }
  function empty(opts) {
    opts = opts || {};
    var e = "<div class='ch-empty'><span class='ch-empty-mark'>" + ic("audit", 24) + "</span>"
      + "<div class='ch-empty-t'>Pennedly пока ничего не менял</div>"
      + "<div class='ch-empty-s'>Здесь появится всё, что Pennedly применит по твоему клику: рутины и правила из Агента, фиксы проверки Голоса, правки аудита.</div>"
      + "<button class='btn btn--primary'>" + ic("advisor", 16) + " Спросить Агента</button></div>";
    return screenShell(e, opts);
  }
  function screenShell(inner, opts) {
    opts = opts || {};
    return "<div class='ch-screen'>" + (opts.bare ? "" : crumb() + pagehead()) + inner + "</div>";
  }

  /* ───────── подтверждение отката ───────── */
  function confirm(o) {
    o = o || {};
    var actions = o.busy
      ? "<button class='btn btn--ghost' aria-disabled='true'>Отмена</button><button class='btn btn--danger' aria-disabled='true'><span class='spinner'></span> Откатываю…</button>"
      : "<button class='btn btn--ghost'>Отмена</button><button class='btn btn--danger'>" + ic("undo", 15) + " Откатить</button>";
    return "<div class='dialog ch-confirm" + (o.sheet ? " ch-confirm--sheet" : "") + "' role='dialog' aria-modal='true'>"
      + (o.sheet ? "<div class='ch-sheet-grip'></div>" : "")
      + "<div class='ch-confirm-head'><span class='ch-confirm-mark'>" + ic("undo", 18) + "</span>"
      + "<div><div class='ch-confirm-t'>Вернуть как было?</div>"
      + "<p class='ch-confirm-b'>Откатить <b>«" + o.title + "»</b> и вернуть прежнее состояние " + o.scope + "?</p></div></div>"
      + "<div class='ch-confirm-actions'>" + actions + "</div></div>";
  }

  /* ───────── точки входа ───────── */
  function entrySettings() {
    return "<div class='ch-entryrow'><span class='ch-entryrow-ico'>" + ic("audit", 18) + "</span>"
      + "<div class='ch-entryrow-body'><div class='ch-entryrow-t'>История изменений</div><div class='ch-entryrow-s'>Что Pennedly применил за тебя одним кликом.</div></div>"
      + "<span class='ch-entryrow-act'>" + ic("chev-right", 18) + "</span></div>";
  }
  function entryAdvisor() {
    return "<div style='display:flex;flex-direction:column;gap:11px'>"
      + "<div class='ch-entryrow' style='border-style:dashed;box-shadow:none;background:color-mix(in srgb,var(--color-accent) 5%,var(--color-surface))'><span class='ch-entryrow-ico' style='background:color-mix(in srgb,var(--color-accent) 12%,var(--color-surface));border-color:color-mix(in srgb,var(--color-accent) 26%,transparent);color:var(--color-accent)'>" + ic("advisor", 18) + "</span>"
      + "<div class='ch-entryrow-body'><div class='ch-entryrow-t'>Готово — включил автоответы на вопросы</div><div class='ch-entryrow-s'>Применено по твоему клику из ответа Агента.</div></div></div>"
      + "<div style='padding-left:2px'><a class='ch-quietlink'>" + ic("audit", 14) + " Что я применил за тебя</a></div></div>";
  }

  /* ───────── телефон ───────── */
  function phoneTop(title) {
    return "<div class='ch-phone-top'><span class='ch-hamb'>" + ic("menu", 18) + "</span><span class='pt-title'>" + (title || "История изменений") + "</span><span class='pt-spacer'></span><span class='ch-icbtn'>" + ic("sun", 16) + "</span></div>";
  }
  function phone(inner, opts) {
    opts = opts || {};
    return "<div class='ch-phone" + (opts.sm ? " ch-phone--sm" : "") + "'>"
      + "<div class='ch-phone-status'><span>9:41</span><span class='ps-r'>•••</span></div>"
      + phoneTop(opts.title)
      + "<div class='ch-phone-body'>" + inner + "</div>"
      + (opts.overlay ? "<div class='ch-phone-scrim'></div>" + opts.overlay : "")
      + "</div>";
  }

  window.ACH = {
    ic: ic, REC: REC, row: row, dayGroup: dayGroup, groupsFor: groupsFor,
    feed: feed, loading: loading, error: errorState, empty: empty, filters: filters,
    confirm: confirm, entrySettings: entrySettings, entryAdvisor: entryAdvisor,
    phone: phone, screenShell: screenShell, SRC: SRC
  };
})();
