import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const W = 1290;
const H = 1720;
const OUT_DIR = path.join(process.cwd(), "public", "templates", "preview");
const SHEET = path.join(process.cwd(), "tmp", "template-previews-sheet.png");

const templates = [
  { slug: "mono-punch", name: "Mono Punch", category: "Productivity", tag: "Free", bg: "#0E0E0E", fg: "#F5F5F5", accent: "#FF2A2A", decor: "stripe", headline: ["Ship", "fast."], subhead: "One tap, one screen.", app: "productivity" },
  { slug: "soft-sunrise", name: "Soft Sunrise", category: "Health & fitness", tag: "Free", bg: "#FBE8D6", fg: "#2A1810", accent: "#E85A2C", decor: "ring", headline: ["Wake.", "Move."], subhead: "Gentle morning rituals.", app: "health" },
  { slug: "tideline", name: "Tideline", category: "Travel & weather", tag: "Free", bg: "#0E1A24", fg: "#F5F7FA", accent: "#3CC8FF", decor: "wave", headline: ["Catch the", "swell."], subhead: "Tide · Wind · Wave height", app: "weather" },
  { slug: "indie-grid", name: "Indie Grid", category: "Photo & video", tag: "Free", bg: "#F4F4F0", fg: "#0A0A0A", accent: "#0A0A0A", decor: "bars", headline: ["Curate", "everything."], subhead: "Library, framed.", app: "photo", italicLine: 1 },
  { slug: "hazard-stripe", name: "Hazard Stripe", category: "Utilities", tag: "Pro", bg: "#0A0A0A", fg: "#FFFFFF", accent: "#FFC233", decor: "halftone", headline: ["Caution.", "Useful."], subhead: "Tools that get out of the way.", app: "utility" },
  { slug: "pastel-pop", name: "Pastel Pop", category: "Kids & lifestyle", tag: "Pro", bg: "#E0F4DE", fg: "#103820", accent: "#FF6B9D", decor: "stack", headline: ["Soft", "+ silly."], subhead: "Made for tiny humans.", app: "kids" },
  { slug: "editorial-print", name: "Editorial Print", category: "News & magazine", tag: "Pro", bg: "#F4F1E8", fg: "#1A1A1A", accent: "#A02020", decor: "halftone", headline: ["Read", "longer."], subhead: "Stories that hold attention.", app: "news", italicAll: true },
  { slug: "tactical-dark", name: "Tactical Dark", category: "Gaming & tools", tag: "Pro", bg: "#050810", fg: "#D8E0F0", accent: "#4AF626", decor: "stripe", headline: ["Lock.", "Load."], subhead: "Pro-grade controls.", app: "tactical" },
  { slug: "midnight-mono", name: "Midnight Mono", category: "Finance & crypto", tag: "Pro", bg: "#0B0E14", fg: "#E5E7EB", accent: "#7DF9FF", decor: "ledger", headline: ["Track", "everything."], subhead: "Real-time portfolio.", app: "finance" },
  { slug: "paper-cut", name: "Paper Cut", category: "Books & reading", tag: "Free", bg: "#EFEAE0", fg: "#1C1C1C", accent: "#C2410C", decor: "halftone", headline: ["Stay", "curious."], subhead: "A library in your pocket.", app: "books", italicLine: 1 },
  { slug: "neon-pulse", name: "Neon Pulse", category: "Music & audio", tag: "Pro", bg: "#0A0118", fg: "#F5E6FF", accent: "#FF14B8", decor: "wave", headline: ["Feel the", "frequency."], subhead: "Spatial audio engine.", app: "music" },
  { slug: "stadium-bold", name: "Stadium Bold", category: "Sports & live", tag: "Free", bg: "#0E1A0E", fg: "#F5FFF5", accent: "#00FF6A", decor: "blocks", headline: ["Game.", "On."], subhead: "Every result, live.", app: "sports" },
  { slug: "atelier-grid", name: "Atelier Grid", category: "Design & creative", tag: "Pro", bg: "#FAFAF7", fg: "#0A0A0A", accent: "#0A0A0A", decor: "grid", headline: ["Build", "better."], subhead: "A studio for makers.", app: "design", italicLine: 1 },
  { slug: "ember-pitch", name: "Ember Pitch", category: "Travel & maps", tag: "Free", bg: "#1A0E08", fg: "#FBE7CE", accent: "#FF8A3D", decor: "orbit", headline: ["Go", "further."], subhead: "Routes, refined.", app: "route" },
  { slug: "vault-blue", name: "Vault Blue", category: "Security & VPN", tag: "Pro", bg: "#08152B", fg: "#DCEAFF", accent: "#3B82F6", decor: "grid", headline: ["Locked.", "Tight."], subhead: "Zero-trust, by default.", app: "security" },
  { slug: "command-center", name: "Command Center", category: "Business & CRM", tag: "Pro", bg: "#11130F", fg: "#F2F0E8", accent: "#D6FF4F", decor: "ledger", headline: ["Close", "more."], subhead: "Pipeline, calls, follow-up.", app: "crm" },
  { slug: "clay-ledger", name: "Clay Ledger", category: "Budgeting", tag: "Free", bg: "#E9D9C3", fg: "#231914", accent: "#0F766E", decor: "bars", headline: ["Spend", "smarter."], subhead: "Budgets without noise.", app: "budget" },
  { slug: "aurora-care", name: "Aurora Care", category: "Wellness", tag: "Free", bg: "#151221", fg: "#F8F2FF", accent: "#A7F3D0", decor: "orbit", headline: ["Feel", "steady."], subhead: "Mood, sleep, recovery.", app: "wellness" },
  { slug: "signal-lab", name: "Signal Lab", category: "Developer tools", tag: "Pro", bg: "#061416", fg: "#DFF7F4", accent: "#F97316", decor: "grid", headline: ["Debug", "faster."], subhead: "Logs, traces, deploys.", app: "dev" },
  { slug: "market-bloom", name: "Market Bloom", category: "Shopping", tag: "Free", bg: "#FFF7ED", fg: "#20130B", accent: "#DB2777", decor: "stack", headline: ["Sell", "beautifully."], subhead: "Drop, cart, checkout.", app: "shop" },
  { slug: "atlas-route", name: "Atlas Route", category: "Navigation", tag: "Pro", bg: "#10251F", fg: "#ECFDF5", accent: "#FACC15", decor: "wave", headline: ["Find", "the way."], subhead: "Trips, stops, timing.", app: "nav" },
];

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function text(x, y, value, opts = {}) {
  const {
    size = 36,
    fill = "#fff",
    family = "Geist, Inter, sans-serif",
    weight = 700,
    anchor = "start",
    opacity = 1,
    spacing = 0,
    style = "normal",
  } = opts;
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" font-style="${style}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}" letter-spacing="${spacing}">${esc(value)}</text>`;
}

function rect(x, y, w, h, fill, opts = {}) {
  const { rx = 0, stroke = "none", sw = 0, opacity = 1 } = opts;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/>`;
}

function circle(cx, cy, r, fill, opts = {}) {
  const { stroke = "none", sw = 0, opacity = 1 } = opts;
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" opacity="${opacity}"/>`;
}

function displayHeadline(t, x, y) {
  return t.headline.map((line, i) => {
    const italic = t.italicAll || t.italicLine === i;
    const family = italic ? "Georgia, 'Times New Roman', serif" : "'Arial Black', Impact, sans-serif";
    const weight = italic ? 500 : 900;
    const style = italic ? "italic" : "normal";
    const fill = i === 1 ? t.accent : t.fg;
    const size = italic ? 116 : 104;
    return text(x, y + i * 100, line, {
      size,
      fill,
      family,
      weight,
      style,
      spacing: italic ? -2 : -4,
    });
  }).join("");
}

function decor(t) {
  const a = t.accent;
  const f = t.fg;
  if (t.decor === "stripe") {
    return `<pattern id="decor" patternUnits="userSpaceOnUse" width="48" height="48" patternTransform="rotate(45)">
      <rect width="7" height="48" fill="${a}" opacity="0.10"/>
    </pattern><rect width="${W}" height="${H}" fill="url(#decor)"/>`;
  }
  if (t.decor === "halftone") {
    return `<pattern id="decor" patternUnits="userSpaceOnUse" width="16" height="16">
      <circle cx="2" cy="2" r="1.4" fill="${f}" opacity="0.12"/>
    </pattern><rect width="${W}" height="${H}" fill="url(#decor)"/>`;
  }
  if (t.decor === "wave") {
    return `<path d="M0 1370 C220 1250 430 1510 650 1370 S1080 1230 1290 1370 V1720 H0Z" fill="${a}" opacity="0.14"/>
      <path d="M0 1470 C230 1370 410 1580 660 1450 S1090 1350 1290 1490 V1720 H0Z" fill="${f}" opacity="0.08"/>`;
  }
  if (t.decor === "ring") {
    return `<circle cx="1030" cy="270" r="260" fill="none" stroke="${a}" stroke-width="42" opacity="0.16"/>`;
  }
  if (t.decor === "stack") {
    return `<rect x="95" y="1400" width="88" height="220" fill="${a}" opacity="0.16"/>
      <rect x="204" y="1285" width="88" height="335" fill="${f}" opacity="0.12"/>
      <rect x="313" y="1345" width="88" height="275" fill="${a}" opacity="0.14"/>`;
  }
  if (t.decor === "grid") {
    return `<pattern id="decor" patternUnits="userSpaceOnUse" width="32" height="32">
      <path d="M32 0H0V32" fill="none" stroke="${f}" stroke-width="1" opacity="0.10"/>
    </pattern><rect width="${W}" height="${H}" fill="url(#decor)"/>`;
  }
  if (t.decor === "orbit") {
    return `<g fill="none" opacity="0.18">
      <circle cx="220" cy="1420" r="430" stroke="${a}" stroke-width="4"/>
      <circle cx="220" cy="1420" r="305" stroke="${f}" stroke-width="3" opacity="0.8"/>
      <circle cx="220" cy="1420" r="175" stroke="${a}" stroke-width="4"/>
    </g>${circle(1090, 230, 15, a, { opacity: 0.8 })}`;
  }
  if (t.decor === "ledger") {
    return Array.from({ length: 8 }, (_, i) => {
      const y = 1330 + i * 36;
      const w = [780, 610, 930, 510, 705, 850, 460, 660][i];
      return `<path d="M80 ${y}H${80 + w}" stroke="${f}" stroke-width="2" opacity="0.12"/><rect x="${88 + w}" y="${y - 5}" width="10" height="10" fill="${i % 3 === 0 ? a : f}" opacity="0.16"/>`;
    }).join("");
  }
  if (t.decor === "blocks") {
    return Array.from({ length: 12 }, (_, i) => {
      const x = 78 + (i % 3) * 92;
      const y = 1240 + Math.floor(i / 3) * 92;
      return rect(x, y, 62, 62, i % 2 ? f : a, { opacity: 0.16 });
    }).join("");
  }
  return Array.from({ length: 12 }, (_, i) => {
    const h = [70, 145, 92, 180, 120, 205, 82, 150, 105, 190, 130, 170][i];
    return rect(72 + i * 40, 1548 - h, 20, h, i % 3 === 0 ? a : f, { opacity: 0.16 });
  }).join("");
}

function appUi(t, x, y, w, h) {
  const pad = 44;
  const sx = (n) => x + (n / 390) * w;
  const sy = (n) => y + (n / 844) * h;
  const muted = t.tag === "Pro" ? "0.58" : "0.48";
  const header = [
    text(sx(28), sy(70), appName(t), { size: 31, fill: t.fg, weight: 850, family: "'Arial Black', sans-serif", spacing: -1 }),
    text(sx(28), sy(101), appSubtitle(t), { size: 11, fill: t.fg, opacity: 0.62, family: "JetBrains Mono, monospace", weight: 700, spacing: 2 }),
  ].join("");

  const body = appBody(t, sx, sy, w, h);
  const nav = rect(sx(25), sy(748), w - pad, 58, t.fg, { rx: 28, opacity: 0.10 })
    + text(sx(72), sy(785), navLabels(t)[0], { size: 10, fill: t.accent, family: "JetBrains Mono, monospace", weight: 800, spacing: 3 })
    + text(sx(172), sy(785), navLabels(t)[1], { size: 10, fill: t.fg, family: "JetBrains Mono, monospace", weight: 800, opacity: muted, spacing: 3 })
    + text(sx(286), sy(785), navLabels(t)[2], { size: 10, fill: t.fg, family: "JetBrains Mono, monospace", weight: 800, opacity: muted, spacing: 3 });

  return `${header}${body}${nav}`;
}

function appName(t) {
  const names = {
    productivity: "FlowTap", health: "DawnFit", weather: "TideLab", photo: "FrameKit", utility: "QuickOps", kids: "TinyJoy", news: "Longform", tactical: "OpsLock", finance: "NorthLedger", books: "Shelfly", music: "WaveRoom", sports: "LiveSide", design: "Atelier", route: "RouteMark", security: "Vaultly", crm: "DealDesk", budget: "ClayCoin", wellness: "AuraNest", dev: "SignalLab", shop: "Marketly", nav: "Atlas",
  };
  return names[t.app] ?? t.name;
}

function appSubtitle(t) {
  const values = {
    productivity: "TODAY · FOCUS", health: "MORNING RITUAL", weather: "SWELL REPORT", photo: "CURATED GRID", utility: "UTILITY STACK", kids: "PLAY LIBRARY", news: "DAILY EDITION", tactical: "LIVE SYSTEMS", finance: "PORTFOLIO", books: "READING LIST", music: "SPATIAL MIX", sports: "MATCH CENTER", design: "STUDIO BOARD", route: "TRIP PLAN", security: "SECURE TUNNEL", crm: "PIPELINE", budget: "MONTHLY PLAN", wellness: "RECOVERY", dev: "DEPLOY TRACE", shop: "DROPS", nav: "CITY ROUTE",
  };
  return values[t.app] ?? t.category.toUpperCase();
}

function navLabels(t) {
  const values = {
    productivity: ["NOW", "LIST", "DONE"], health: ["MOVE", "SLEEP", "LOG"], weather: ["TIDE", "WIND", "MAP"], photo: ["GRID", "ROLL", "SET"], utility: ["HOME", "TOOLS", "LOG"], kids: ["PLAY", "BOOK", "GROW"], news: ["TOP", "SAVED", "TEXT"], tactical: ["LIVE", "HUD", "LOG"], finance: ["NET", "FLOW", "PLAN"], books: ["READ", "SHELF", "NOTES"], music: ["MIX", "ROOM", "QUEUE"], sports: ["LIVE", "TABLE", "CLUB"], design: ["CANVAS", "KIT", "EXPORT"], route: ["TRIP", "STOPS", "TIME"], security: ["LOCK", "NODES", "LOG"], crm: ["DEALS", "CALLS", "NEXT"], budget: ["PLAN", "SPEND", "SAVE"], wellness: ["MOOD", "SLEEP", "CARE"], dev: ["TRACE", "LOGS", "SHIP"], shop: ["DROP", "BAG", "PAY"], nav: ["MAP", "ROUTE", "ETA"],
  };
  return values[t.app] ?? ["ONE", "TWO", "THREE"];
}

function appBody(t, sx, sy, w, h) {
  const c = t.accent;
  const fg = t.fg;
  const soft = `${fg}`;
  const panel = (x, y, ww, hh, opacity = 0.08) => rect(sx(x), sy(y), (ww / 390) * w, (hh / 844) * h, fg, { rx: 22, opacity });
  const label = (x, y, value, fill = fg, size = 15) => text(sx(x), sy(y), value, { size, fill, weight: 760 });
  const meta = (x, y, value) => text(sx(x), sy(y), value, { size: 9, fill: fg, opacity: 0.55, family: "JetBrains Mono, monospace", weight: 800, spacing: 1.6 });
  if (["finance", "budget", "crm"].includes(t.app)) {
    return panel(28, 140, 334, 150, 0.09)
      + meta(50, 178, t.app === "crm" ? "QUALIFIED PIPELINE" : "BALANCE")
      + text(sx(50), sy(245), t.app === "crm" ? "$84.2K" : "$12,480", { size: 54, fill: fg, weight: 900, family: "'Arial Black', sans-serif", spacing: -2 })
      + lineChart(sx(48), sy(330), 290, 110, c)
      + cardList(sx, sy, w, h, ["Rent paid", "New lead", "Runway +18%"], c, fg);
  }
  if (["weather", "route", "nav"].includes(t.app)) {
    return panel(28, 142, 334, 260, 0.08)
      + abstractMap(sx(46), sy(168), 300, 200, c, fg)
      + label(44, 455, t.app === "weather" ? "4.2 ft · NW" : "18 min faster", fg, 25)
      + cardList(sx, sy, w, h, ["Live route", "Low traffic", "Arrive 08:42"], c, fg);
  }
  if (["health", "wellness", "sports"].includes(t.app)) {
    return circle(sx(195), sy(280), 128, "none", { stroke: fg, sw: 25, opacity: 0.12 })
      + `<path d="M${sx(195)} ${sy(152)} A128 128 0 1 1 ${sx(95)} ${sy(360)}" fill="none" stroke="${c}" stroke-width="25" stroke-linecap="round"/>`
      + text(sx(195), sy(300), t.app === "sports" ? "2-1" : "87", { size: 74, fill: fg, weight: 900, family: "'Arial Black', sans-serif", anchor: "middle" })
      + meta(146, 330, t.app === "sports" ? "LIVE SCORE" : "READINESS")
      + metricGrid(sx, sy, w, h, c, fg, t.app === "sports" ? ["Shots", "Poss.", "xG", "Form"] : ["Sleep", "Move", "Mood", "HRV"]);
  }
  if (["music", "tactical", "dev", "security", "utility"].includes(t.app)) {
    return panel(28, 142, 334, 118, 0.08)
      + lineChart(sx(46), sy(185), 300, 68, c)
      + metricGrid(sx, sy, w, h, c, fg, t.app === "music" ? ["Bass", "Room", "Queue", "Mix"] : ["Status", "Nodes", "Events", "Ping"])
      + terminalRows(sx, sy, w, h, c, fg);
  }
  if (["photo", "design", "shop", "kids"].includes(t.app)) {
    return gridCards(sx, sy, w, h, c, fg, t.app)
      + cardList(sx, sy, w, h, t.app === "shop" ? ["Drop live", "Cart ready", "Checkout 1-tap"] : ["Saved set", "New frame", "Ready now"], c, fg);
  }
  if (["books", "news"].includes(t.app)) {
    return panel(28, 142, 334, 188, 0.08)
      + text(sx(50), sy(205), t.app === "news" ? "Morning brief" : "The quiet shelf", { size: 34, fill: fg, weight: 700, family: "Georgia, serif" })
      + meta(52, 242, t.app === "news" ? "9 MIN READ · SAVED" : "CHAPTER 08 · NOTES")
      + lineRules(sx, sy, w, h, fg)
      + cardList(sx, sy, w, h, ["Saved", "Annotated", "Continue"], c, fg);
  }
  return cardList(sx, sy, w, h, ["Today", "Next", "Done"], c, soft);
}

function lineChart(x, y, w, h, c) {
  return `<path d="M${x} ${y + h * 0.62} C${x + w * 0.18} ${y + h * 0.15}, ${x + w * 0.28} ${y + h * 0.85}, ${x + w * 0.43} ${y + h * 0.42} S${x + w * 0.7} ${y + h * 0.18}, ${x + w} ${y + h * 0.45}" fill="none" stroke="${c}" stroke-width="5" stroke-linecap="round"/>`;
}

function abstractMap(x, y, w, h, c, fg) {
  return `<path d="M${x} ${y + h * 0.3} C${x + 80} ${y + 10}, ${x + 120} ${y + h * 0.72}, ${x + w} ${y + h * 0.38}" fill="none" stroke="${fg}" stroke-width="5" opacity="0.18"/>
    <path d="M${x + 30} ${y + h} C${x + 110} ${y + h * 0.4}, ${x + 185} ${y + h * 0.78}, ${x + w - 20} ${y + 16}" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round"/>
    ${circle(x + w * 0.62, y + h * 0.5, 13, c)}${circle(x + w * 0.2, y + h * 0.72, 9, fg, { opacity: 0.65 })}`;
}

function metricGrid(sx, sy, w, h, c, fg, labels) {
  return labels.map((label, i) => {
    const x = i % 2 === 0 ? 28 : 205;
    const y = i < 2 ? 450 : 575;
    return rect(sx(x), sy(y), (158 / 390) * w, (96 / 844) * h, fg, { rx: 18, opacity: 0.08 })
      + circle(sx(x + 22), sy(y + 30), 8, i % 2 === 0 ? c : fg, { opacity: i % 2 === 0 ? 1 : 0.55 })
      + text(sx(x + 20), sy(y + 68), label, { size: 19, fill: fg, weight: 800 });
  }).join("");
}

function cardList(sx, sy, w, h, items, c, fg) {
  return items.map((item, i) => {
    const y = 510 + i * 74;
    return rect(sx(28), sy(y), (334 / 390) * w, (52 / 844) * h, fg, { rx: 17, opacity: 0.08 })
      + circle(sx(55), sy(y + 27), 8, i === 0 ? c : fg, { opacity: i === 0 ? 1 : 0.42 })
      + text(sx(78), sy(y + 34), item, { size: 16, fill: fg, weight: 750 });
  }).join("");
}

function terminalRows(sx, sy, w, h, c, fg) {
  return [0, 1, 2, 3].map((i) => {
    const y = 622 + i * 31;
    return text(sx(32), sy(y), `0${i + 1}`, { size: 9, fill: c, family: "JetBrains Mono, monospace", weight: 800 })
      + rect(sx(64), sy(y - 9), (210 - i * 26) / 390 * w, 3, fg, { opacity: 0.36 });
  }).join("");
}

function gridCards(sx, sy, w, h, c, fg, app) {
  return Array.from({ length: 6 }, (_, i) => {
    const x = 28 + (i % 2) * 176;
    const y = 150 + Math.floor(i / 2) * 128;
    const fill = i % 3 === 0 ? c : fg;
    const label = app === "kids" ? ["A", "B", "C", "D", "E", "F"][i] : "";
    return rect(sx(x), sy(y), (150 / 390) * w, (104 / 844) * h, fill, { rx: 24, opacity: i % 3 === 0 ? 0.86 : 0.12 })
      + (label ? text(sx(x + 75), sy(y + 67), label, { size: 42, fill: i % 3 === 0 ? "#fff" : fg, weight: 900, anchor: "middle" }) : circle(sx(x + 75), sy(y + 52), 28, i % 3 === 0 ? fg : c, { opacity: 0.45 }));
  }).join("");
}

function lineRules(sx, sy, w, h, fg) {
  return [0, 1, 2, 3, 4].map((i) => rect(sx(50), sy(380 + i * 36), ((230 + (i % 2) * 64) / 390) * w, 4, fg, { opacity: 0.22 })).join("");
}

function phone(t, x, y, w, h) {
  const screenX = x + 22;
  const screenY = y + 22;
  const screenW = w - 44;
  const screenH = h - 44;
  const screenBg = t.tag === "Pro" ? t.bg : t.bg;
  const id = `clip-${t.slug}`;
  return `<defs><clipPath id="${id}">${rect(screenX, screenY, screenW, screenH, "#fff", { rx: 72 })}</clipPath></defs>
    ${rect(x - 10, y + 20, w + 20, h, "#000", { rx: 92, opacity: 0.28 })}
    ${rect(x, y, w, h, "#070708", { rx: 90 })}
    ${rect(screenX, screenY, screenW, screenH, screenBg, { rx: 72, stroke: "rgba(255,255,255,.22)", sw: 2 })}
    <g clip-path="url(#${id})">
      ${rect(screenX, screenY, screenW, screenH, screenBg)}
      ${circle(screenX + screenW * 0.78, screenY + screenH * 0.18, screenW * 0.42, t.accent, { opacity: t.tag === "Pro" ? 0.18 : 0.10 })}
      ${appUi(t, screenX, screenY, screenW, screenH)}
    </g>
    ${rect(x + w * 0.36, y + 35, w * 0.28, 34, "#000", { rx: 17 })}
    ${rect(x + 2, y + 260, 5, 80, "#1C1C20", { rx: 3 })}
    ${rect(x + w - 7, y + 330, 5, 120, "#1C1C20", { rx: 3 })}`;
}

function previewSvg(t, i) {
  const phoneW = i % 4 === 0 ? 525 : i % 4 === 1 ? 565 : i % 4 === 2 ? 545 : 535;
  const phoneH = phoneW * 2.06;
  const phoneX = Math.round((W - phoneW) / 2 + (i % 3 - 1) * 36);
  const phoneY = i % 5 === 0 ? 505 : i % 5 === 1 ? 460 : 490;
  return `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${W}" height="${H}" fill="${t.bg}"/>
    ${decor(t)}
    <rect width="${W}" height="${H}" fill="url(#grain)" opacity="0"/>
    ${displayHeadline(t, 86, 164)}
    ${text(92, 393, t.subhead, { size: 31, fill: t.fg, opacity: 0.76, weight: 700 })}
    ${text(92, 1480, t.category.toUpperCase(), { size: 18, fill: t.accent, family: "JetBrains Mono, monospace", weight: 800, spacing: 4, opacity: 0.95 })}
    ${phone(t, phoneX, phoneY, phoneW, phoneH)}
  </svg>`;
}

async function render() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(SHEET), { recursive: true });

  for (let i = 0; i < templates.length; i += 1) {
    const t = templates[i];
    const out = path.join(OUT_DIR, `template-preview-${t.slug}.png`);
    await sharp(Buffer.from(previewSvg(t, i)))
      .resize(W, H, { fit: "cover" })
      .flatten({ background: t.bg })
      .removeAlpha()
      .toColorspace("srgb")
      .png({ palette: true, quality: 85, compressionLevel: 9, effort: 10 })
      .toFile(out);
    console.log(out);
  }

  const composites = [];
  for (let i = 0; i < templates.length; i += 1) {
    const thumb = await sharp(path.join(OUT_DIR, `template-preview-${templates[i].slug}.png`))
      .resize(180, 240)
      .png()
      .toBuffer();
    composites.push({
      input: thumb,
      left: 30 + (i % 7) * 205,
      top: 30 + Math.floor(i / 7) * 275,
    });
  }

  await sharp({
    create: { width: 1465, height: 855, channels: 3, background: "#0A0A0A" },
  })
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(SHEET);
}

render().catch((err) => {
  console.error(err);
  process.exit(1);
});
