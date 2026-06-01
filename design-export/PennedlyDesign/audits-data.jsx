// audits-data.jsx — Pennedly's weekly coach audits.
// Each audit: a narrative + proposed changes the creator approves/rejects.
// change.status: undecided | applied | rejected | rolledback

const AUDIT_USER = { name: "Mara Lin", handle: "@mara.lin", initials: "ML" };

const AUDITS = [
  {
    id: "a1", title: "Week of May 25", range: "May 25 – Jun 1", posted: "2 days ago",
    summary: "Your revision posts are pulling ahead — let's lean into craft and quiet the motivational closers.",
    narrative: [
      "This week your account leaned into something worth protecting. Posts about the act of editing — cutting, revising, deciding what to keep — outperformed your motivational posts by nearly 2 to 1. That's a real signal about what people come to you for: craft, not cheerleading.",
      "Your strongest posts also share a shape. They open on tension and end on the idea, while the quieter ones bury the hook and close with a pep talk. The changes below nudge your voice and cadence toward what's already working.",
      "Approve what feels true to you and reject anything that doesn't sound like you. Nothing changes until you say so.",
    ],
    changes: [
      {
        id: "c1", kind: "Voice", title: "Cut the motivational sign-offs",
        detail: "Your strongest posts end on the idea; the weaker ones tack on a closer. I'll stop drafting lines like \u201Ckeep going\u201D or \u201Cyou've got this\u201D and let the last sentence land on its own.",
        status: "undecided", effect: null,
        diff: { before: "Posts may end with an encouraging line to the reader.", after: "Posts end on the idea \u2014 no motivational closers or \u201Ckeep going\u201D lines." },
      },
      {
        id: "c2", kind: "Cadence", title: "Move long posts to Tuesday mornings",
        detail: "Essays over 200 words earn about 40% more reach when published Tuesday 8–10am. I'll prioritise that window for long-form drafts by default.",
        status: "applied", effect: "+22%", effectLabel: "reach",
        diff: { before: "Long-form posts scheduled for the next open slot.", after: "Long-form posts (>200 words) prioritised for Tue 08:00–10:00 local." },
      },
      {
        id: "c3", kind: "Topic", title: "Weight new drafts toward revision",
        detail: "Posts about cutting and revising beat your \u201Cjust start\u201D posts almost 2 to 1. I'll bias topic suggestions toward craft and process over pure motivation.",
        status: "applied", effect: "+31%", effectLabel: "engagement", diff: null,
      },
      {
        id: "c4", kind: "Format", title: "Open on the tension, not the setup",
        detail: "Three of your top posts buried the hook in the second sentence. I'll draft openings that lead with the friction and push context lower.",
        status: "rejected", effect: null, diff: null,
      },
      {
        id: "c5", kind: "Voice", title: "Enforce lowercase everywhere",
        detail: "I tried carrying your warm lowercase replies into your posts too — but it flattened them. Rolled back to replies-only; your posts read better sentence-cased.",
        status: "rolledback", effect: "-4%", effectLabel: "on posts", diff: null,
      },
    ],
  },
  {
    id: "a2", title: "Week of May 18", range: "May 18 – 24", posted: "1 week ago",
    summary: "A strong week for replies. Small tweaks to your openings and reply timing.",
    narrative: [
      "Replies carried the week — the ones you sent within the hour pulled real conversations. Below are a few small adjustments to lock that in and tighten your post openings.",
      "All of these have been decided. Here's how they're holding up.",
    ],
    changes: [
      { id: "b1", kind: "Voice", title: "Tighten opening lines", detail: "Trim throat-clearing first lines so the idea arrives sooner.", status: "applied", effect: "+12%", effectLabel: "engagement", diff: null },
      { id: "b2", kind: "Cadence", title: "Reply within the first hour", detail: "Surface new comments fast so you can answer while the post is live.", status: "applied", effect: "+19%", effectLabel: "replies", diff: null },
      { id: "b3", kind: "Topic", title: "Less commentary on the algorithm", detail: "Meta-posts about reach underperform your craft posts; I'll suggest fewer.", status: "rejected", effect: null, diff: null },
      { id: "b4", kind: "Format", title: "Add line breaks for breathing room", detail: "Break dense posts into short stanzas for scannability.", status: "applied", effect: "+8%", effectLabel: "saves", diff: null },
    ],
  },
  {
    id: "a3", title: "Week of May 11", range: "May 11 – 17", posted: "2 weeks ago",
    summary: "Cleaning up hashtags and leaning into behind-the-scenes posts.",
    narrative: ["A tidy-up week. Two changes landed well; one didn't fit your voice."],
    changes: [
      { id: "d1", kind: "Voice", title: "Drop hashtags entirely", detail: "They added noise without reach. Removed from drafts.", status: "applied", effect: "+6%", effectLabel: "reach", diff: null },
      { id: "d2", kind: "Topic", title: "More behind-the-scenes", detail: "Process glimpses outperformed finished-thought posts.", status: "applied", effect: "+14%", effectLabel: "engagement", diff: null },
      { id: "d3", kind: "Format", title: "Keep threads under four posts", detail: "Longer threads lost readers by post five.", status: "rejected", effect: null, diff: null },
    ],
  },
  {
    id: "a4", title: "Week of May 4", range: "May 4 – 10", posted: "3 weeks ago",
    summary: "Found your best posting window and a sharper question style.",
    narrative: ["Your evenings outperformed mornings this week, and posts that ended on a question drew more replies."],
    changes: [
      { id: "e1", kind: "Cadence", title: "Shift posts to 7pm", detail: "Evening slots beat mornings for your audience.", status: "applied", effect: "+11%", effectLabel: "views", diff: null },
      { id: "e2", kind: "Format", title: "End some posts on a question", detail: "Questions lifted replies without feeling like bait.", status: "applied", effect: "+9%", effectLabel: "replies", diff: null },
      { id: "e3", kind: "Voice", title: "Use more em-dashes", detail: "Tested a punchier rhythm; it didn't sound like you.", status: "rejected", effect: null, diff: null },
      { id: "e4", kind: "Topic", title: "Revisit your best old posts", detail: "Re-angle past hits as fresh takes.", status: "applied", effect: "+17%", effectLabel: "engagement", diff: null },
    ],
  },
  {
    id: "a5", title: "Week of Apr 27", range: "Apr 27 – May 3", posted: "4 weeks ago",
    summary: "Your first audit — establishing a baseline voice.",
    narrative: ["Welcome to your first weekly review. I set a few starting defaults from your existing posts."],
    changes: [
      { id: "f1", kind: "Voice", title: "Match your sentence length", detail: "Short, declarative sentences with the occasional long one.", status: "applied", effect: "+5%", effectLabel: "engagement", diff: null },
      { id: "f2", kind: "Topic", title: "Center writing & craft", detail: "Your clearest throughline; I'll keep drafts close to it.", status: "applied", effect: "+13%", effectLabel: "reach", diff: null },
      { id: "f3", kind: "Cadence", title: "Aim for four posts a week", detail: "A sustainable rhythm based on your history.", status: "applied", effect: "+7%", effectLabel: "consistency", diff: null },
    ],
  },
];

Object.assign(window, { AUDIT_USER, AUDITS });
