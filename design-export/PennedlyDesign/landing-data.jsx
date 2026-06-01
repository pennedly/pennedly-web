// landing-data.jsx — copy + content for the public landing page (/).
// Realistic copy — calm, not hypey. No lorem.

const LAND = {
  tagline: "Your drafting partner for Threads.",
  status: "In development · invite-only beta",
  // value prop — the last sentence is emphasised with the ink-blue accent in the UI
  leadHead: "Pennedly drafts posts and replies in your voice, then waits for you.",
  leadBody: "Nothing publishes until you approve it. Manage every account from one place, see what's landing, and keep your tone consistent across all of it.",
  leadEmph: "A partner that does the legwork — not an autopilot. You stay in control.",
  contactEmail: "hello@pennedly.app",
};

const LAND_FEATURES = [
  { ico: "voice", title: "Drafts in your voice", desc: "It studies how you write, so drafts sound like you — never generic." },
  { ico: "check", title: "You approve every word", desc: "Read, tweak, and publish on your terms. Nothing posts on its own." },
  { ico: "users", title: "Every account, one place", desc: "Switch between the handles you run without losing the thread." },
  { ico: "chart", title: "See what's landing", desc: "Quiet analytics that show which posts earned their place." },
];

// the sample draft shown in the hero specimen card (Mara Lin's voice)
const LAND_SAMPLE = {
  name: "Mara Lin",
  handle: "@mara.lin",
  initials: "ML",
  text: "The fastest way to find your voice online: publish the thing you're slightly embarrassed by. The polished version is everyone's. The embarrassing one is yours.",
};

const LAND_FOOTER = [
  { label: "Privacy Policy", href: "#privacy" },
  { label: "Terms of Service", href: "#terms" },
  { label: "Data Deletion", href: "#data-deletion" },
];

Object.assign(window, { LAND, LAND_FEATURES, LAND_SAMPLE, LAND_FOOTER });
