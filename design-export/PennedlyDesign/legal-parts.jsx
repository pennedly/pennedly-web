// legal-parts.jsx — reusable legal-page template renderer.
// All visuals reference the ink-on-paper tokens; no hardcoded colours.

/* ------------------------------ Top bar -------------------------------- */
function TopBar({ dark, onToggleTheme }) {
  return (
    <header className="legal-top">
      <div className="legal-top-in">
        <a className="brand" href="Landing.html">
          <window.Logo size={30} radius={9} className="bm" />
          <span className="bn">Pennedly</span>
        </a>
        <span className="sp" />
        <button className="icon-btn" aria-label="Toggle theme" onClick={onToggleTheme}>
          {dark ? <window.IcSun size={17} /> : <window.IcMoon size={16} />}
        </button>
      </div>
    </header>
  );
}

/* ------------------------------- Blocks -------------------------------- */
function Block({ block }) {
  switch (block.t) {
    case "h3": return <h3>{block.text}</h3>;
    case "p": return <p>{block.text}</p>;
    case "ul": return <ul>{block.items.map((it, i) => <li key={i}>{it}</li>)}</ul>;
    case "contact":
      return (
        <div className="contact-block">
          <span className="contact-ico"><window.IcMail size={17} /></span>
          <span className="contact-txt">
            <span className="contact-name">{block.text}</span>
            <div className="contact-email"><a href={`mailto:${block.email}`}>{block.email}</a></div>
          </span>
        </div>
      );
    default: return null;
  }
}

/* -------------------------------- TOC ---------------------------------- */
function Toc({ sections, onJump }) {
  return (
    <nav className="toc" aria-label="On this page">
      <div className="toc-cap">On this page</div>
      <ul className="toc-list">
        {sections.map((s, i) => (
          <li key={s.id}>
            <a href={`#${s.id}`} onClick={(e) => { e.preventDefault(); onJump(s.id); }}>
              <span className="tn">{String(i + 1).padStart(2, "0")}</span>{s.h.replace(/^\d+\.\s*/, "")}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ------------------------------ Article -------------------------------- */
function LegalArticle({ doc }) {
  function jump(id) {
    const el = document.getElementById(id);
    if (el) { const top = el.getBoundingClientRect().top + window.scrollY - 72; window.scrollTo({ top, behavior: "smooth" }); }
  }
  return (
    <main className="legal-main">
      <div className="wrap">
        <a className="backhome" href="Landing.html"><window.IcArrowLeft size={15} /> Back to home</a>
        <div className="doc-eyebrow">Legal</div>
        <h1 className="doc-title">{doc.title}</h1>
        <div className="doc-updated">{doc.updated}</div>
        <p className="doc-intro">{doc.intro}</p>

        <Toc sections={doc.sections} onJump={jump} />

        <article className="prose">
          {doc.sections.map((s) => (
            <section className="sec" id={s.id} key={s.id}>
              <h2>{s.h}</h2>
              {s.blocks.map((b, i) => <Block key={i} block={b} />)}
            </section>
          ))}
          <div className="legal-end">{doc.title} · {doc.updated}</div>
        </article>
      </div>
    </main>
  );
}

/* ------------------------------ Footer --------------------------------- */
function Footer({ current, onSwitch }) {
  const docs = window.LEGAL_DOCS;
  return (
    <footer className="legal-foot">
      <div className="legal-foot-in">
        <span className="foot-brand">
          <window.Logo size={20} radius={6} className="fm" />
          © {new Date().getFullYear()} Pennedly
        </span>
        <span className="foot-sp" />
        <nav className="foot-links" aria-label="Legal pages">
          {Object.values(docs).map((d) => (
            <button
              key={d.key}
              className={`foot-link-btn ${current === d.key ? "active" : ""}`}
              onClick={() => onSwitch(d.key)}
            >{d.label}</button>
          ))}
          <a href="Landing.html">Home</a>
        </nav>
      </div>
    </footer>
  );
}

Object.assign(window, { TopBar, Block, Toc, LegalArticle, Footer });
