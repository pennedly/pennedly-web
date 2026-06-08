"use client";

// Tweaks debug panel — a tester-only, floating, draggable state switcher, ported
// from design-export/PennedlyDesign/tweaks-panel.jsx (minus the design-tool host
// protocol). Lets us (and testers) flip a screen's MOCK states / locale / theme
// to verify every state 1-to-1 with the Claude design. Each screen mounts one
// <TweaksPanel> and drives its own demo rendering from the tweak values.
//
// Gate at the call site (render only when me.is_tester). Tweak values live in
// component state via useTweaks — they reset on reload, so demo mode is never
// sticky for a real session.

import { useCallback, useRef, useState, type ReactNode } from "react";

const STYLE = `
.twk-launch{position:fixed;right:16px;bottom:16px;z-index:2147483646;
  height:34px;padding:0 13px;display:inline-flex;align-items:center;gap:7px;
  border:.5px solid rgba(255,255,255,.6);border-radius:999px;cursor:pointer;
  background:rgba(250,249,247,.82);color:#29261b;font:600 12px/1 ui-sans-serif,system-ui,sans-serif;
  -webkit-backdrop-filter:blur(20px) saturate(160%);backdrop-filter:blur(20px) saturate(160%);
  box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 8px 26px rgba(0,0,0,.18)}
.twk-launch:hover{background:rgba(250,249,247,.95)}
.twk-launch .dot{width:7px;height:7px;border-radius:999px;background:#34c759}
.dark .twk-launch{background:rgba(32,31,29,.85);color:#ededed;border-color:rgba(255,255,255,.12)}
/* Phone shell: lift the launcher clear of the bottom tab bar (58px + safe area). */
@media (max-width:600px){.twk-launch{bottom:calc(58px + env(safe-area-inset-bottom) + 14px)}}

.twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
  max-height:calc(100vh - 32px);display:flex;flex-direction:column;
  background:rgba(250,249,247,.82);color:#29261b;
  -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
  border:.5px solid rgba(255,255,255,.6);border-radius:14px;
  box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
  font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
.dark .twk-panel{background:rgba(28,27,25,.88);color:#ededed;border-color:rgba(255,255,255,.12);
  box-shadow:0 1px 0 rgba(255,255,255,.06) inset,0 12px 40px rgba(0,0,0,.5)}
.twk-hd{display:flex;align-items:center;justify-content:space-between;
  padding:10px 8px 10px 14px;cursor:move;user-select:none}
.twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
.twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
  width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:13px;line-height:1}
.twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
.dark .twk-x{color:rgba(237,237,237,.6)} .dark .twk-x:hover{background:rgba(255,255,255,.08);color:#ededed}
.twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
  overflow-y:auto;overflow-x:hidden;min-height:0;scrollbar-width:thin}
.twk-row{display:flex;flex-direction:column;gap:5px}
.twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
.twk-lbl{display:flex;justify-content:space-between;align-items:baseline;color:rgba(41,38,27,.72)}
.dark .twk-lbl{color:rgba(237,237,237,.75)}
.twk-lbl>span:first-child{font-weight:500}
.twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
  color:rgba(41,38,27,.45);padding:10px 0 0}
.dark .twk-sect{color:rgba(237,237,237,.45)}
.twk-sect:first-child{padding-top:0}
.twk-field{appearance:none;box-sizing:border-box;width:100%;min-width:0;height:26px;padding:0 8px;
  border:.5px solid rgba(0,0,0,.1);border-radius:7px;background:rgba(255,255,255,.6);color:inherit;font:inherit;outline:none}
.dark .twk-field{background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.14)}
select.twk-field{padding-right:22px}
.twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;background:rgba(0,0,0,.06);user-select:none}
.dark .twk-seg{background:rgba(255,255,255,.08)}
.twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;background:rgba(255,255,255,.92);
  box-shadow:0 1px 2px rgba(0,0,0,.12);transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
.dark .twk-seg-thumb{background:rgba(255,255,255,.22)}
.twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;background:transparent;color:inherit;
  font:inherit;font-weight:500;min-height:22px;border-radius:6px;cursor:pointer;padding:4px 6px;line-height:1.2;overflow-wrap:anywhere}
.twk-toggle{position:relative;width:32px;height:18px;border:0;border-radius:999px;background:rgba(0,0,0,.15);
  transition:background .15s;cursor:pointer;padding:0;flex:0 0 auto}
.dark .twk-toggle{background:rgba(255,255,255,.2)}
.twk-toggle[data-on="1"]{background:#34c759}
.twk-toggle i{position:absolute;top:2px;left:2px;width:14px;height:14px;border-radius:50%;background:#fff;
  box-shadow:0 1px 2px rgba(0,0,0,.25);transition:transform .15s}
.twk-toggle[data-on="1"] i{transform:translateX(14px)}
.twk-btn{appearance:none;height:28px;padding:0 12px;border:0;border-radius:7px;background:rgba(0,0,0,.06);
  color:inherit;font:inherit;font-weight:500;cursor:pointer}
.twk-btn:hover{background:rgba(0,0,0,.1)}
.dark .twk-btn{background:rgba(255,255,255,.1)} .dark .twk-btn:hover{background:rgba(255,255,255,.16)}
`;

export type TweakValues = Record<string, string | boolean>;

export function useTweaks<T extends TweakValues>(initial: T): [T, (key: keyof T, value: T[keyof T]) => void] {
  const [values, setValues] = useState<T>(initial);
  const setTweak = useCallback((key: keyof T, value: T[keyof T]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);
  return [values, setTweak];
}

export function TweaksPanel({ title = "Tweaks", children }: { title?: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 16, y: 16 });

  const onDragStart = (e: React.MouseEvent) => {
    const panel = panelRef.current;
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const sx = e.clientX;
    const sy = e.clientY;
    const startRight = window.innerWidth - r.right;
    const startBottom = window.innerHeight - r.bottom;
    const move = (ev: MouseEvent) => {
      const x = Math.max(8, startRight - (ev.clientX - sx));
      const y = Math.max(8, startBottom - (ev.clientY - sy));
      pos.current = { x, y };
      panel.style.right = `${x}px`;
      panel.style.bottom = `${y}px`;
    };
    const up = () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", up);
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
  };

  return (
    <>
      <style>{STYLE}</style>
      {!open ? (
        <button type="button" className="twk-launch" onClick={() => setOpen(true)} aria-label="Open tweaks">
          <span className="dot" /> {title}
        </button>
      ) : (
        <div ref={panelRef} className="twk-panel" style={{ right: pos.current.x, bottom: pos.current.y }}>
          <div className="twk-hd" onMouseDown={onDragStart}>
            <b>{title}</b>
            <button
              className="twk-x"
              aria-label="Close tweaks"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="twk-body">{children}</div>
        </div>
      )}
    </>
  );
}

export function TweakSection({ label }: { label: string }) {
  return <div className="twk-sect">{label}</div>;
}

export function TweakToggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="twk-row twk-row-h">
      <div className="twk-lbl">
        <span>{label}</span>
      </div>
      <button
        type="button"
        className="twk-toggle"
        data-on={value ? "1" : "0"}
        role="switch"
        aria-checked={value}
        aria-label={label}
        onClick={() => onChange(!value)}
      >
        <i />
      </button>
    </div>
  );
}

export function TweakRadio({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  // Segmented control for short option sets; falls back to a <select> when the
  // labels won't fit (matches the design's heuristic).
  const maxLen = options.reduce((m, o) => Math.max(m, o.length), 0);
  const fits = maxLen <= ({ 2: 16, 3: 10 } as Record<number, number>)[options.length] || options.length <= 1;
  if (!fits) {
    return <TweakSelect label={label} value={value} options={options} onChange={onChange} />;
  }
  const idx = Math.max(0, options.indexOf(value));
  const n = options.length;
  return (
    <div className="twk-row">
      <div className="twk-lbl">
        <span>{label}</span>
      </div>
      <div role="radiogroup" className="twk-seg">
        <div
          className="twk-seg-thumb"
          style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`, width: `calc((100% - 4px) / ${n})` }}
        />
        {options.map((o) => (
          <button key={o} type="button" role="radio" aria-checked={o === value} onClick={() => onChange(o)}>
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

export function TweakSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="twk-row">
      <div className="twk-lbl">
        <span>{label}</span>
      </div>
      <select className="twk-field" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

export function TweakButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="twk-btn" onClick={onClick}>
      {label}
    </button>
  );
}
