"use client";

import { useState, type ReactNode } from "react";

import { FeedMedia } from "@/components/studio/FeedParts";
import { ReplyImage, type ReplyHandlers } from "@/components/studio/RepliesParts";
import { DraftCard, type CardHandlers } from "@/components/studio/StudioParts";
import type { ReplyComment } from "@/components/studio/replies-demo";
import type { StudioCard } from "@/components/studio/studio-demo";

// Self-contained placeholder (data-URI SVG) — renders with no network/backend.
const ph = (label: string, hue: number) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='426'><rect width='100%' height='100%' fill='hsl(${hue} 55% 52%)'/><text x='50%' y='50%' fill='white' font-family='sans-serif' font-size='44' text-anchor='middle' dominant-baseline='middle'>${label}</text></svg>`,
  );

const noop = () => {};
const mockHandlers: ReplyHandlers = {
  onGenerate: noop,
  onApprove: noop,
  onPublish: noop,
  onSkip: noop,
  onRestore: noop,
  onSaveEdit: noop,
  onUploadImage: async () => ({ url: ph("uploaded", 200) }),
  onSetMedia: async () => {},
};

function mockComment(media: { url: string }[]): ReplyComment {
  return {
    id: media.length, // stable per-state key
    postId: "p1",
    status: "draft",
    author: { name: "Mara Lin", handle: "mara.lin", initials: "ML" },
    text: "Sample comment to answer.",
    time: "2h",
    reply: "A sample reply draft in your voice.",
    media,
  };
}

const mockCardHandlers: CardHandlers = {
  onApprove: noop,
  onReject: noop,
  onPublish: noop,
  onSendBack: noop,
  onRestore: noop,
  onSaveEdit: noop,
  onDelete: noop,
  onTweak: async () => "tweaked",
  onTranslate: async () => "translated",
  onUploadImage: async () => ({ url: ph("uploaded", 200) }),
  onSetMedia: async () => {},
  onSearchGiphy: async () =>
    Array.from({ length: 9 }, (_, i) => ({
      id: `g${i}`,
      url: ph(`GIF ${i + 1}`, (i * 41) % 360),
      preview_url: ph(`GIF ${i + 1}`, (i * 41) % 360),
      alt: `Sample GIF ${i + 1}`,
    })),
  onSetGif: async () => {},
};

function mockDraft(
  id: number,
  media: { url: string; alt?: string | null }[],
  gif?: StudioCard["gif"],
): StudioCard {
  return {
    id,
    status: "draft",
    kind: "post",
    author: { name: "Mara Lin", handle: "mara.lin", initials: "ML" },
    body: "A sample post draft in your voice. Brief a topic and Pennedly writes a few takes you can approve, tweak, or pass on.",
    time: "now",
    media,
    gif: gif ?? null,
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h3 className="mb-2 font-mono text-caption uppercase tracking-wide text-text-subtle">{title}</h3>
      <div className="rounded-lg border border-border bg-surface p-4">{children}</div>
    </section>
  );
}

export default function MediaGallery() {
  const [dark, setDark] = useState(false);

  function toggleDark() {
    document.documentElement.classList.toggle("dark");
    setDark((d) => !d);
  }

  return (
    <div className="min-h-screen bg-bg p-6 text-text">
      <div className="mx-auto max-w-[680px]">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-h2 font-semibold">Media — state gallery</h1>
            <p className="text-caption text-text-subtle">
              dev-only · real components, no backend · compare to Feed-Media-SPEC.html /
              Replies-Media-SPEC.html
            </p>
          </div>
          <button
            type="button"
            onClick={toggleDark}
            className="shrink-0 rounded-md border border-border px-3 py-1.5 text-small transition-colors hover:bg-surface-2"
          >
            {dark ? "Light" : "Dark"}
          </button>
        </header>

        <h2 className="mb-3 text-h3 font-semibold">Feed media</h2>
        <Section title="single image">
          <FeedMedia media={[{ url: ph("1", 210), alt: "A sunlit desk with a notebook" }]} />
        </Section>
        <Section title="carousel · 3">
          <FeedMedia media={[{ url: ph("1", 210) }, { url: ph("2", 150) }, { url: ph("3", 30) }]} />
        </Section>
        <Section title="carousel · 5">
          <FeedMedia
            media={[
              { url: ph("1", 210) },
              { url: ph("2", 150) },
              { url: ph("3", 30) },
              { url: ph("4", 280) },
              { url: ph("5", 340) },
            ]}
          />
        </Section>
        <Section title="broken image → fallback">
          <FeedMedia media={[{ url: "/media/0/does-not-exist.jpg" }]} />
        </Section>
        <Section title="none (text-only) → renders nothing">
          <div className="text-caption text-text-subtle">
            <FeedMedia media={[]} />
            (no media block — correct)
          </div>
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Reply image</h2>
        <Section title="empty — Add image chip">
          <ReplyImage c={mockComment([])} h={mockHandlers} />
        </Section>
        <Section title="attached — thumbnail + remove">
          <ReplyImage c={mockComment([{ url: ph("reply", 260) }])} h={mockHandlers} />
        </Section>

        <h2 className="mb-3 mt-8 text-h3 font-semibold">Composer (Studio draft card)</h2>
        <Section title="1 image · ALT empty + gated Video/GIF chips">
          <DraftCard card={mockDraft(101, [{ url: ph("1", 210) }])} density="comfortable" h={mockCardHandlers} />
        </Section>
        <Section title="carousel (3) · drag to reorder · one ALT set (green)">
          <DraftCard
            card={mockDraft(102, [
              { url: ph("1", 210) },
              { url: ph("2", 150), alt: "A second photo with alt text" },
              { url: ph("3", 30) },
            ])}
            density="comfortable"
            h={mockCardHandlers}
          />
        </Section>
        <Section title="empty · GIF button enabled → click GIF to open the GIPHY picker">
          <DraftCard card={mockDraft(103, [])} density="comfortable" h={mockCardHandlers} />
        </Section>
        <Section title="GIF attached → tile + remove + “Powered by GIPHY”">
          <DraftCard
            card={mockDraft(104, [], {
              gif_id: "demo",
              url: ph("GIF", 290),
              preview_url: ph("GIF", 290),
              alt: "A looping sample GIF",
            })}
            density="comfortable"
            h={mockCardHandlers}
          />
        </Section>

        <p className="mt-10 text-caption text-text-subtle">
          Click a feed image to open the lightbox (←/→/Esc). Toggle Dark to check both themes.
        </p>
      </div>
    </div>
  );
}
