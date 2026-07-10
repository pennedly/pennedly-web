"use client";

import { useState } from "react";

import { StudioPublishDialog } from "@/components/studio/StudioParts";

// Gallery for the Studio publish dialog (entry point B of the booster). Added
// with the 2026-07-10 booster-bug fix so its states are self-verifiable without
// auth/backend: the booster subtitle must WRAP (not truncate), and with the
// booster section expanded the PANEL scrolls (footer reachable), not just the
// nested text preview.
const LONG_TEXT = Array.from(
  { length: 14 },
  (_, i) =>
    `Строка ${i + 1}: длинный черновик, чтобы превью занимало максимум высоты и диалог с раскрытым бустером не влезал в экран.`,
).join("\n");

const ACCOUNT = {
  name: "Demo account",
  handle: "demo.handle",
  initials: "DA",
  avatarUrl: null,
};

export default function StudioPublishGallery() {
  const [open, setOpen] = useState(true);
  const [long, setLong] = useState(true);
  return (
    <div className="min-h-dvh bg-bg p-6 text-text">
      <h1 className="text-h3 font-semibold">Studio publish dialog — booster states</h1>
      <p className="mt-1 max-w-[560px] text-small text-text-muted">
        Проверяемое: 1) сабтайтл бустера переносится целиком (выкл. и вкл.
        состояния); 2) при раскрытом бустере скроллится САМА панель диалога и
        кнопки Publish/Cancel достижимы (десктоп и 375px).
      </p>
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-small"
          onClick={() => setOpen(true)}
        >
          Открыть диалог
        </button>
        <button
          type="button"
          className="rounded-md border border-border bg-surface px-3 py-1.5 text-small"
          onClick={() => setLong((v) => !v)}
        >
          Текст: {long ? "длинный" : "короткий"}
        </button>
      </div>
      <StudioPublishDialog
        open={open}
        text={long ? LONG_TEXT : "Короткий пост."}
        account={ACCOUNT}
        publishing={false}
        onClose={() => setOpen(false)}
        onConfirm={() => setOpen(false)}
        onSchedule={() => setOpen(false)}
      />
    </div>
  );
}
