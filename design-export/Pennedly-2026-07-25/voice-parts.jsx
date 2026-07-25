// voice-parts.jsx — presentational building blocks for the Voice screen.
// Sidebar / account / avatar come from the shared shell (shell-parts.jsx).
// All visuals reference the ink-on-paper tokens; no hardcoded colours.

const { useState: useVS, useEffect: useVE, useRef: useVR } = React;

const langEntry = (code) => (window.UI_LANGS || []).find((l) => l.code === code) || { code, label: code, native: code };

/* --------------------------- Language menu ----------------------------- */
// Reusable globe dropdown over a set of UI locales (see shell-data UI_LANGS).
function LangMenu({ value, onChange, langs, compact }) {
  const [open, setOpen] = useVS(false);
  const cur = langEntry(value);
  return (
    <div className="langmenu">
      {open && <div className="lm-scrim" onClick={() => setOpen(false)} />}
      <button className={`lm-btn ${compact ? "lm-btn--sm" : ""} ${open ? "is-open" : ""}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <window.IcGlobe size={compact ? 15 : 16} />
        <span className="lm-cur">{value === "en" ? "Original" : cur.native}</span>
        <window.IcChevDown size={14} className="lm-chev" />
      </button>
      {open && (
        <div className="lm-pop" role="menu">
          {langs.map((code) => {
            const l = langEntry(code);
            return (
              <button key={code} role="menuitemradio" aria-checked={code === value} className={`lm-item ${code === value ? "is-on" : ""}`} onClick={() => { onChange(code); setOpen(false); }}>
                <span className="lm-names">
                  <span className="lm-native">{code === "en" ? "English" : l.native}</span>
                  <span className="lm-label">{code === "en" ? "Original · editable" : l.label}</span>
                </span>
                {code === value && <window.IcCheck size={15} className="lm-check" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* -------------------------------- Topbar ------------------------------- */
function Topbar({ dark, onToggleTheme, status, issues, locale }) {
  let tone = "status-pill--success", label = "In sync";
  if (status === "busy") { tone = "status-pill--accent"; label = "Re-extracting\u2026"; }
  else if (locale && locale !== "en") { tone = "status-pill--accent"; label = "Translated \u00B7 " + langEntry(locale).native; }
  else if (issues > 0) { tone = "status-pill--warning"; label = issues + (issues === 1 ? " conflict" : " conflicts"); }
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <span className="topbar-title">Voice</span>
        <span className={`status-pill ${tone}`}><span className="pill-dot" />{label}</span>
        <span className="topbar-spacer" />
        <div className="topbar-actions">
          <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
            {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
          </button>
          <a className="icon-btn" href="Settings.html" aria-label="Settings"><window.IcSettings size={17} /></a>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------ Voice hero ----------------------------- */
function VoiceHero({ meta, busy, checking, locale, onCheck, onReExtract, onLocale }) {
  const translated = locale && locale !== "en";
  return (
    <div className="vhero">
      <span className="vhero-eyebrow"><window.IcVoice size={14} className="vh-ico" /> Account voice</span>
      <div className="vhero-row">
        <h1 className="vhero-title">How <em>{window.SHELL_ACCOUNTS[0].name}</em> sounds</h1>
        <LangMenu value={locale} onChange={onLocale} langs={window.VOICE_LANGS} />
      </div>
      <div className="vhero-meta">
        <span className="vmeta">Extracted from <b>{meta.sources}</b> posts</span>
        <span className="sep" />
        <span className="vmeta">Updated <b>{meta.updated}</b></span>
      </div>
      <div className="vhero-actions">
        <button className="btn btn--secondary" onClick={onCheck} disabled={busy || checking || translated}>
          {checking ? <><span className="spinner" /> Checking…</> : <><window.IcScan size={16} /> Check voice</>}
        </button>
        <button className="btn btn--secondary" onClick={onReExtract} disabled={busy || checking || translated}>
          <window.IcRefresh size={16} /> Re-extract
        </button>
      </div>
    </div>
  );
}

/* ----------------------- Translated read-only banner ------------------- */
function TranslatedBanner({ locale, onViewOriginal }) {
  const l = langEntry(locale);
  return (
    <div className="tbanner">
      <window.IcGlobe size={17} className="tb-ico" />
      <div className="tb-text">
        <b>Showing your voice in {l.native} ({l.label}).</b> This is a read-only translation of your original — switch back to the original to make edits.
      </div>
      <button className="btn btn--secondary btn--sm" onClick={onViewOriginal}><window.IcPencil size={14} /> View original</button>
    </div>
  );
}

/* --------------------------- Section shell ----------------------------- */
function SectionCard({ Icon, title, desc, count, editing, readOnly, tone, onEdit, onSave, onCancel, footNote, children }) {
  return (
    <section className={`vsec ${editing ? "vsec--editing" : ""} ${tone ? "vsec--" + tone : ""}`}>
      <div className="vsec-head">
        <span className="vsec-mark"><Icon size={17} /></span>
        <div className="vsec-ttl">
          <div className="h">{title}{count != null && <span className="count">{count}</span>}</div>
          <div className="d">{desc}</div>
        </div>
        {!editing && !readOnly && (
          <button className="vsec-edit" onClick={onEdit}><window.IcPencil size={15} /> Edit</button>
        )}
      </div>
      <div className="vsec-body">{children}</div>
      {editing && (
        <div className="vsec-foot">
          {footNote && <span className="foot-note">{footNote}</span>}
          <button className="btn btn--ghost btn--sm" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary btn--sm" onClick={onSave}><window.IcCheck size={15} /> Save changes</button>
        </div>
      )}
    </section>
  );
}

/* ------------------------------- Intro --------------------------------- */
function IntroSection({ value, locale, readOnly, onSave }) {
  const [editing, setEditing] = useVS(false);
  const [draft, setDraft] = useVS(value);
  const ref = useVR(null);
  useVE(() => { setDraft(value); }, [value]);
  useVE(() => { if (editing && ref.current) { ref.current.focus(); ref.current.setSelectionRange(ref.current.value.length, ref.current.value.length); } }, [editing]);
  const shown = locale && locale !== "en" ? (window.INTRO_I18N[locale] || value) : value;
  return (
    <SectionCard
      Icon={window.IcVoice} title="In a sentence" desc="The through-line a draft should always hit"
      editing={editing} readOnly={readOnly}
      onEdit={() => { setDraft(value); setEditing(true); }} onSave={() => { onSave(draft.trim()); setEditing(false); }} onCancel={() => setEditing(false)}
      footNote="This frames every draft Pennedly writes."
    >
      {editing
        ? <textarea ref={ref} className="intro-edit" value={draft} onChange={(e) => setDraft(e.target.value)} />
        : <p className="intro-text">{shown}</p>}
    </SectionCard>
  );
}

/* ----------------------------- Themes (±) ------------------------------ */
// Used twice: include (normal) and exclude (red "won't write about" zone).
function ThemesSection({ section, items, exclude, locale, readOnly, onSave }) {
  const [editing, setEditing] = useVS(false);
  const [draft, setDraft] = useVS(items);
  useVE(() => { setDraft(items); }, [items]);
  const set = (id, k, v) => setDraft((d) => d.map((x) => x.id === id ? { ...x, [k]: v } : x));
  const del = (id) => setDraft((d) => d.filter((x) => x.id !== id));
  const add = () => setDraft((d) => [...d, { id: (exclude ? "tx" : "ti") + Date.now(), label: "", note: "" }]);
  return (
    <SectionCard
      Icon={exclude ? window.IcAlert : window.IcTags}
      title={exclude ? "Won't write about" : "Themes to write about"}
      desc={exclude ? "Topics Pennedly should steer every draft away from" : "The subjects this account returns to"}
      count={items.length} tone={exclude ? "exclude" : null}
      editing={editing} readOnly={readOnly}
      onEdit={() => { setDraft(items.map((x) => ({ ...x }))); setEditing(true); }}
      onSave={() => { onSave(draft.filter((d) => d.label.trim())); setEditing(false); }}
      onCancel={() => setEditing(false)}
    >
      {editing ? (
        <>
          <div className="edit-list">
            {draft.map((t) => (
              <div className="edit-row" key={t.id}>
                <div className="er-fields">
                  <input className="inp inp--strong" value={t.label} placeholder={exclude ? "Topic to avoid" : "Theme name"} onChange={(e) => set(t.id, "label", e.target.value)} />
                  <input className="inp inp--note" value={t.note} placeholder={exclude ? "Why it's off-limits (optional)" : "What it covers"} onChange={(e) => set(t.id, "note", e.target.value)} />
                </div>
                <button className="er-del" aria-label="Remove" onClick={() => del(t.id)}><window.IcTrash size={16} /></button>
              </div>
            ))}
          </div>
          <button className="add-row" onClick={add}><window.IcPlus size={15} /> {exclude ? "Add a topic to avoid" : "Add a theme"}</button>
        </>
      ) : (
        <div className="themes">
          {items.map((t) => (
            <div className={`theme-row ${exclude ? "theme-row--x" : ""}`} key={t.id}>
              <span className="th-label"><span className="th-bullet" />{window.vLoc(t, locale, "label")}</span>
              {window.vLoc(t, locale, "note") && <span className="th-note">{window.vLoc(t, locale, "note")}</span>}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* -------------------------- Characteristics ---------------------------- */
function CharacteristicsSection({ items, locale, readOnly, flaggedKeys, justFixedId, onSave }) {
  const [editing, setEditing] = useVS(false);
  const [draft, setDraft] = useVS(items);
  useVE(() => { setDraft(items); }, [items]);
  const set = (id, k, v) => setDraft((d) => d.map((x) => x.id === id ? { ...x, [k]: v } : x));
  const del = (id) => setDraft((d) => d.filter((x) => x.id !== id));
  const add = () => setDraft((d) => [...d, { id: "ch" + Date.now(), label: "", text: "" }]);
  return (
    <SectionCard
      Icon={window.IcList} title="Voice characteristics" desc="How a draft should feel to read" count={items.length}
      editing={editing} readOnly={readOnly}
      onEdit={() => { setDraft(items.map((x) => ({ ...x }))); setEditing(true); }}
      onSave={() => { onSave(draft.filter((d) => d.text.trim())); setEditing(false); }}
      onCancel={() => setEditing(false)}
    >
      {editing ? (
        <>
          <div className="edit-list">
            {draft.map((t) => (
              <div className="edit-row" key={t.id}>
                <div className="er-fields">
                  <input className="inp inp--strong" value={t.label} placeholder="Quality (e.g. Warmth)" onChange={(e) => set(t.id, "label", e.target.value)} />
                  <textarea className="inp" rows={2} value={t.text} placeholder="Describe how it reads" onChange={(e) => set(t.id, "text", e.target.value)} />
                </div>
                <button className="er-del" aria-label="Remove characteristic" onClick={() => del(t.id)}><window.IcTrash size={16} /></button>
              </div>
            ))}
          </div>
          <button className="add-row" onClick={add}><window.IcPlus size={15} /> Add a characteristic</button>
        </>
      ) : (
        <div className="traits">
          {items.map((t) => {
            const flagged = flaggedKeys && flaggedKeys.has("characteristics:" + t.id);
            return (
              <div className={`trait-row ${flagged ? "is-flagged" : ""} ${justFixedId === t.id ? "just-fixed" : ""}`} key={t.id}>
                <span className="trait-kind">{window.vLoc(t, locale, "label")}</span>
                <span className="trait-text">{window.vLoc(t, locale, "text")}</span>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

/* ------------------------------ Do / Don't ----------------------------- */
function RuleSection({ section, items, negative, locale, readOnly, flaggedKeys, justFixedId, onSave }) {
  const [editing, setEditing] = useVS(false);
  const [draft, setDraft] = useVS(items);
  useVE(() => { setDraft(items); }, [items]);
  const set = (id, v) => setDraft((d) => d.map((x) => x.id === id ? { ...x, text: v } : x));
  const del = (id) => setDraft((d) => d.filter((x) => x.id !== id));
  const add = () => setDraft((d) => [...d, { id: (negative ? "dn" : "do") + Date.now(), text: "" }]);
  return (
    <SectionCard
      Icon={negative ? window.IcX : window.IcCheck}
      title={negative ? "Don't" : "Do"}
      desc={negative ? "Hard rules a draft must never break" : "Hard rules a draft must always follow"}
      count={items.length} tone={negative ? "dont" : "do"}
      editing={editing} readOnly={readOnly}
      onEdit={() => { setDraft(items.map((x) => ({ ...x }))); setEditing(true); }}
      onSave={() => { onSave(draft.filter((d) => d.text.trim())); setEditing(false); }}
      onCancel={() => setEditing(false)}
    >
      {editing ? (
        <>
          <div className="edit-list">
            {draft.map((r) => (
              <div className="edit-row" key={r.id}>
                <div className="er-fields">
                  <textarea className="inp" rows={2} value={r.text} placeholder={negative ? "What a draft must never do" : "What a draft must always do"} onChange={(e) => set(r.id, e.target.value)} />
                </div>
                <button className="er-del" aria-label="Remove rule" onClick={() => del(r.id)}><window.IcTrash size={16} /></button>
              </div>
            ))}
          </div>
          <button className="add-row" onClick={add}><window.IcPlus size={15} /> Add a rule</button>
        </>
      ) : (
        <ul className="rules">
          {items.map((r) => {
            const flagged = flaggedKeys && flaggedKeys.has(section + ":" + r.id);
            return (
              <li className={`rule ${negative ? "rule--no" : "rule--yes"} ${flagged ? "is-flagged" : ""} ${justFixedId === r.id ? "just-fixed" : ""}`} key={r.id}>
                <span className="rule-tick">{negative ? <window.IcX size={13} /> : <window.IcCheck size={13} />}</span>
                <span className="rule-text">{window.vLoc(r, locale, "text")}</span>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------ Examples ------------------------------- */
function ExamplesSection({ items, locale, readOnly, flaggedKeys, justFixedId, onSave }) {
  const [editing, setEditing] = useVS(false);
  const [draft, setDraft] = useVS(items);
  useVE(() => { setDraft(items); }, [items]);
  const set = (id, k, v) => setDraft((d) => d.map((x) => x.id === id ? { ...x, [k]: v } : x));
  const del = (id) => setDraft((d) => d.filter((x) => x.id !== id));
  const add = () => setDraft((d) => [...d, { id: "ex" + Date.now(), context: "Post", stat: "", text: "" }]);
  return (
    <SectionCard
      Icon={window.IcQuote} title="Example posts" desc="Real posts that show the voice in motion" count={items.length}
      editing={editing} readOnly={readOnly}
      onEdit={() => { setDraft(items.map((x) => ({ ...x }))); setEditing(true); }}
      onSave={() => { onSave(draft.filter((d) => d.text.trim())); setEditing(false); }}
      onCancel={() => setEditing(false)}
      footNote="Pennedly studies these for rhythm and length."
    >
      {editing ? (
        <>
          <div className="edit-list">
            {draft.map((x) => (
              <div className="edit-row" key={x.id}>
                <div className="er-fields">
                  <div className="er-kind-row">
                    <select className="inp er-kind-select" value={x.context} onChange={(e) => set(x.id, "context", e.target.value)} aria-label="Post type">
                      <option value="Post">Post</option>
                      <option value="Reply">Reply</option>
                    </select>
                    <input className="inp inp--note" value={x.stat} placeholder="e.g. 412 likes" onChange={(e) => set(x.id, "stat", e.target.value)} />
                  </div>
                  <textarea className="inp" rows={3} value={x.text} placeholder="Paste the post" onChange={(e) => set(x.id, "text", e.target.value)} />
                </div>
                <button className="er-del" aria-label="Remove example" onClick={() => del(x.id)}><window.IcTrash size={16} /></button>
              </div>
            ))}
          </div>
          <button className="add-row" onClick={add}><window.IcPlus size={15} /> Add an example</button>
        </>
      ) : (
        <div className="examples">
          {items.map((x) => (
            <div className={`ex ${(flaggedKeys && flaggedKeys.has("examples:" + x.id)) ? "is-flagged" : ""} ${justFixedId === x.id ? "just-fixed" : ""}`} key={x.id}>
              <div className="ex-meta"><span className="ex-kind">{x.context}</span>{x.stat && <><span className="ex-dot" /><span>{x.stat}</span></>}</div>
              <div className="ex-text">{window.vLoc(x, locale, "text")}</div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

/* ------------------------ Assembled-prompt preview --------------------- */
// "What the AI actually sees" — read-only, with its own translate button.
function PromptPreview({ sections }) {
  const [open, setOpen] = useVS(false);
  const [lang, setLang] = useVS("en");
  const text = window.assemblePrompt(sections, lang);
  return (
    <section className="vsec prompt-sec">
      <div className="vsec-head">
        <span className="vsec-mark"><window.IcSparkle size={17} /></span>
        <div className="vsec-ttl">
          <div className="h">What the AI actually sees</div>
          <div className="d">Your sections, assembled into the exact instructions Pennedly receives</div>
        </div>
        <button className="vsec-edit" onClick={() => setOpen((v) => !v)}>
          <window.IcChevDown size={15} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform var(--duration-base) var(--ease-standard)" }} />
          {open ? "Hide" : "Show"}
        </button>
      </div>
      {open && (
        <div className="vsec-body">
          <div className="prompt-tools">
            <span className="prompt-note">Read-only · generated from the sections above</span>
            <span style={{ flex: 1 }} />
            <LangMenu value={lang} onChange={setLang} langs={window.VOICE_LANGS} compact />
          </div>
          <pre className="prompt-pre">{text}</pre>
        </div>
      )}
    </section>
  );
}

/* --------------------------- Conflict card ----------------------------- */
function ConflictCard({ conflict, leaving, onApply, onDismiss }) {
  const sev = conflict.severity;
  const label = sev === "conflict" ? "Conflict" : "Caution";
  return (
    <div className={`conflict ${leaving ? "conflict--leaving" : ""}`}>
      <div className="conflict-top">
        <span className={`sev sev--${sev}`}><span className="sdot" />{label}</span>
        <span className="ct-spacer" />
        <button className="conflict-dismiss" onClick={() => onDismiss(conflict.id)}>Ignore</button>
      </div>
      <div className="conflict-title">{conflict.title}</div>
      <div className="conflict-rules">
        {conflict.parts.map((p, i) => (
          <div className="crule" key={i}>
            <span className="clabel">{p.label}</span>
            <span className="ctext">{p.text}</span>
          </div>
        ))}
      </div>
      <p className="conflict-why">{conflict.why}</p>
      <div className="conflict-fix">
        <div className="fix-body">
          <div className="fix-cap">Suggested fix</div>
          <div className="fix-text">{conflict.fix.summary}</div>
        </div>
        <button className="btn btn--primary btn--sm" onClick={() => onApply(conflict)}><window.IcCheck size={15} /> Apply fix</button>
      </div>
    </div>
  );
}

/* -------------------------- Voice check panel -------------------------- */
function VoiceCheck({ conflicts, checking, lastRun, leavingIds, onApply, onDismiss, onRecheck }) {
  const n = conflicts.length;
  const clear = n === 0 && !checking;
  return (
    <section className={`vcheck ${clear ? "vcheck--clear" : ""}`}>
      <div className="vcheck-head">
        <span className="vcheck-mark">{clear ? <window.IcShield size={18} /> : <window.IcScan size={18} />}</span>
        <div className="vcheck-h">
          {checking ? (
            <><div className="t">Reading your voice for conflicts…</div><div className="s">Comparing every rule against the others and your examples.</div></>
          ) : clear ? (
            <><div className="t">Your voice is consistent</div><div className="s">No rules contradict each other. Drafts have one clear set of instructions to follow.</div></>
          ) : (
            <><div className="t">{n} {n === 1 ? "thing" : "things"} to resolve</div><div className="s">A rule disagrees with another rule or example. Each fix is one click — review before you apply.</div></>
          )}
        </div>
      </div>
      {checking ? (
        <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }} className="skel">
          <div className="skel-line" style={{ width: "70%" }} />
          <div className="skel-block" style={{ height: 54 }} />
          <div className="skel-line" style={{ width: "52%" }} />
        </div>
      ) : !clear ? (
        <div className="conflicts">
          {conflicts.map((c) => <ConflictCard key={c.id} conflict={c} leaving={leavingIds.includes(c.id)} onApply={onApply} onDismiss={onDismiss} />)}
        </div>
      ) : null}
      <div className="vcheck-foot">
        <span className="lastrun">{checking ? "Checking now\u2026" : `Last checked ${lastRun}`}</span>
        <span style={{ flex: 1 }} />
        <button className="btn btn--ghost btn--sm" onClick={onRecheck} disabled={checking}><window.IcRefresh size={15} /> Re-check</button>
      </div>
    </section>
  );
}

/* ------------------------- Re-extract progress ------------------------- */
function ReExtractPanel({ stepIndex }) {
  return (
    <div className="reextract">
      <span className="rx-nib"><window.IcNib size={40} /></span>
      <div className="rx-title">Re-reading your voice</div>
      <div className="rx-sub">Pennedly is studying your recent posts again. Your current voice stays live until this finishes.</div>
      <div className="rx-steps">
        {window.REEXTRACT_STEPS.map((label, i) => {
          const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "";
          return (
            <div className={`rx-step ${state}`} key={i}>
              <span className="rx-tick">
                {i < stepIndex ? <window.IcCheck size={13} /> : i === stepIndex ? <span className="sp" /> : <span style={{ width: 5, height: 5, borderRadius: 9, background: "currentColor", opacity: 0.5 }} />}
              </span>
              <span className="rx-label">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --------------------------- Re-extract dialog ------------------------- */
function ReExtractDialog({ onCancel, onConfirm }) {
  useVE(() => {
    const h = (e) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onCancel]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Re-extract voice">
        <div className="dialog-head">
          <span className="dialog-mark"><window.IcRefresh size={18} /></span>
          <div>
            <div className="dialog-title">Re-extract your voice?</div>
            <div className="dialog-sub">Pennedly will re-read your {window.VOICE_META.sources} most recent posts and rewrite every section below.</div>
          </div>
        </div>
        <div className="dialog-warn">
          <window.IcAlert size={16} className="dw-ico" />
          <div>Any edits you've made by hand will be replaced. This usually takes under a minute.</div>
        </div>
        <div className="dialog-actions">
          <button className="btn btn--ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn--primary" onClick={onConfirm}><window.IcRefresh size={16} /> Re-extract voice</button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------- Empty --------------------------------- */
function EmptyVoice({ onExtract }) {
  return (
    <div className="vempty">
      <span className="ve-mark"><window.IcVoice size={28} /></span>
      <div className="ve-title">Pennedly hasn't learned your voice yet</div>
      <div className="ve-sub">Once you've published a handful of posts, Pennedly can read them back and draft a starting voice — themes, characteristics, and rules you can edit. Nothing is shared until you say so.</div>
      <button className="btn btn--primary btn--lg" onClick={onExtract}><window.IcRefresh size={18} /> Extract my voice</button>
      <div className="ve-note">You can rewrite or re-extract any part of it afterward.</div>
    </div>
  );
}

/* ------------------------------ Skeleton ------------------------------- */
function SkeletonSection({ rows = 3 }) {
  return (
    <section className="vsec skel">
      <div className="vsec-head">
        <div className="skel-block" style={{ width: 34, height: 34 }} />
        <div style={{ flex: 1 }}>
          <div className="skel-line" style={{ width: 130, height: 14, marginBottom: 7 }} />
          <div className="skel-line" style={{ width: 200, height: 9 }} />
        </div>
        <div className="skel-block" style={{ width: 64, height: 30 }} />
      </div>
      <div className="vsec-body" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
        {Array.from({ length: rows }).map((_, i) => <div className="skel-block" key={i} style={{ height: 46 }} />)}
      </div>
    </section>
  );
}
function VoiceSkeleton() {
  return (
    <>
      <section className="vhero skel">
        <div className="skel-line" style={{ width: 120, height: 10 }} />
        <div className="skel-line" style={{ width: 280, height: 26, marginTop: 14 }} />
        <div className="skel-line" style={{ width: 320, height: 11, marginTop: 16 }} />
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <div className="skel-block" style={{ width: 130, height: 40 }} />
          <div className="skel-block" style={{ width: 120, height: 40 }} />
        </div>
      </section>
      <SkeletonSection rows={2} />
      <SkeletonSection rows={3} />
      <SkeletonSection rows={3} />
    </>
  );
}

/* -------------------------------- Toasts ------------------------------- */
function Toasts({ toasts, onUndo }) {
  return (
    <div className="toast-host">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.kind === "error" ? "error" : "success"}`}>
          <span className="toast-mark" />
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            {t.sub && <div className="toast-sub">{t.sub}</div>}
          </div>
          {t.undo && <button className="toast-undo" onClick={() => onUndo(t)}>Undo</button>}
        </div>
      ))}
    </div>
  );
}

Object.assign(window, {
  LangMenu, Topbar, VoiceHero, TranslatedBanner, SectionCard,
  IntroSection, ThemesSection, CharacteristicsSection, RuleSection, ExamplesSection,
  PromptPreview, ConflictCard, VoiceCheck, ReExtractPanel, ReExtractDialog,
  EmptyVoice, VoiceSkeleton, SkeletonSection, Toasts,
});
