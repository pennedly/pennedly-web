"use client";

// Tag-pill input. Replaces the newline-per-item textarea pattern with
// something that actually feels like editing a list of distinct values.
// Each item gets a pill; backspace on empty input removes the last
// pill; Enter on filled input commits a new pill.
//
// Variant prop styles the pills — "default" zinc, "danger" red (used
// for themes_exclude so it visually communicates "this stops the AI").

import { useState, KeyboardEvent } from "react";

type Variant = "default" | "danger";

type Props = {
  items: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  variant?: Variant;
  // If true, hitting comma also commits the current input as a new tag
  // (handy for users pasting "a, b, c").
  commitOnComma?: boolean;
};

export function TagInput({
  items,
  onChange,
  placeholder = "add an item and press enter",
  variant = "default",
  commitOnComma = true,
}: Props) {
  const [input, setInput] = useState("");

  function commit(raw: string) {
    const value = raw.trim();
    if (!value) return;
    if (items.includes(value)) {
      setInput("");
      return;
    }
    onChange([...items, value]);
    setInput("");
  }

  function removeAt(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commit(input);
    } else if (e.key === "Backspace" && !input && items.length > 0) {
      removeAt(items.length - 1);
    } else if (commitOnComma && e.key === ",") {
      e.preventDefault();
      commit(input);
    }
  }

  function onPaste(text: string) {
    // Allow paste of "a, b, c" → split into multiple tags
    if (text.includes(",")) {
      const parts = text.split(/,\s*/).map((p) => p.trim()).filter(Boolean);
      const merged = Array.from(new Set([...items, ...parts]));
      onChange(merged);
      setInput("");
      return true;
    }
    return false;
  }

  const pillBase =
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm leading-tight border";
  const pillColors =
    variant === "danger"
      ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-900 dark:text-red-200"
      : "bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200";

  const containerBorder =
    variant === "danger"
      ? "border-red-300 dark:border-red-900"
      : "border-zinc-300 dark:border-zinc-700";

  return (
    <div
      className={`flex flex-wrap gap-1.5 items-center rounded-md border px-2 py-2 bg-white dark:bg-zinc-950 focus-within:ring-2 focus-within:ring-zinc-300 dark:focus-within:ring-zinc-700 ${containerBorder}`}
    >
      {items.map((item, idx) => (
        <span key={`${idx}-${item}`} className={`${pillBase} ${pillColors}`}>
          <span className="whitespace-pre-wrap">{item}</span>
          <button
            type="button"
            onClick={() => removeAt(idx)}
            className="ml-0.5 text-current opacity-50 hover:opacity-100 text-xs leading-none"
            aria-label={`remove ${item}`}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKey}
        onPaste={(e) => {
          const t = e.clipboardData.getData("text");
          if (onPaste(t)) e.preventDefault();
        }}
        placeholder={items.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[140px] bg-transparent text-sm outline-none py-0.5 px-1"
      />
    </div>
  );
}
