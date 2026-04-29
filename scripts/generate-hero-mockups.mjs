import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = process.cwd();
const OUT = path.join(ROOT, "tmp");
const W = 1290;
const H = 2796;

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function text(x, y, value, opts = {}) {
  const {
    size = 64,
    fill = "#fff",
    family = "Inter, Arial, sans-serif",
    weight = 700,
    anchor = "start",
    opacity = 1,
    spacing = 0,
  } = opts;
  return `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}" opacity="${opacity}" letter-spacing="${spacing}">${esc(value)}</text>`;
}

function wrapText(lines, x, y, opts = {}) {
  const size = opts.size ?? 90;
  const gap = opts.gap ?? Math.round(size * 1.03);
  return lines.map((line, i) => text(x, y + i * gap, line, opts)).join("");
}

function statusBar(theme = "dark") {
  const fill = theme === "dark" ? "#fff" : "#111";
  return `
    ${text(96, 132, "9:41", { size: 48, fill, weight: 800 })}
    <g fill="${fill}" transform="translate(1016 92)">
      <rect x="0" y="30" width="10" height="24" rx="5"/><rect x="18" y="20" width="10" height="34" rx="5"/><rect x="36" y="10" width="10" height="44" rx="5"/><rect x="54" y="0" width="10" height="54" rx="5"/>
      <path d="M112 18c32-28 78-28 110 0l-18 18c-22-18-52-18-74 0z"/><path d="M142 50c14-12 32-12 46 0l-23 22z"/>
      <rect x="250" y="10" width="74" height="40" rx="15" fill="none" stroke="${fill}" stroke-width="5"/><rect x="328" y="22" width="6" height="16" rx="3"/><rect x="257" y="17" width="48" height="26" rx="10"/>
    </g>`;
}

function statusBarAt(x, y, w, theme = "dark") {
  const fill = theme === "dark" ? "#fff" : "#111";
  const s = w / 1290;
  const right = x + w - 300 * s;
  return `
    ${text(x + 96 * s, y + 54 * s, "9:41", { size: 50 * s, fill, weight: 800 })}
    <g fill="${fill}" transform="translate(${right} ${y + 12 * s}) scale(${s})">
      <rect x="0" y="30" width="10" height="24" rx="5"/>
      <rect x="18" y="20" width="10" height="34" rx="5"/>
      <rect x="36" y="10" width="10" height="44" rx="5"/>
      <rect x="54" y="0" width="10" height="54" rx="5"/>
      <rect x="128" y="10" width="74" height="40" rx="15" fill="none" stroke="${fill}" stroke-width="5"/>
      <rect x="206" y="22" width="6" height="16" rx="3"/>
      <rect x="135" y="17" width="48" height="26" rx="10"/>
    </g>`;
}

function phoneFrame(x, y, w, h, innerSvg, opts = {}) {
  const bezel = opts.bezel ?? "#0A0A0D";
  const screen = opts.screen ?? "#101010";
  const stroke = opts.stroke ?? "rgba(255,255,255,.18)";
  const id = `clip_${Math.random().toString(36).slice(2)}`;
  const notchW = w * 0.3;
  const notchH = h * 0.032;
  return `
  <defs>
    <clipPath id="${id}"><rect x="${x + w * 0.03}" y="${y + h * 0.018}" width="${w * 0.94}" height="${h * 0.964}" rx="${w * 0.12}"/></clipPath>
  </defs>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${w * 0.13}" fill="${bezel}"/>
  <rect x="${x + w * 0.017}" y="${y + h * 0.01}" width="${w * 0.966}" height="${h * 0.98}" rx="${w * 0.118}" fill="${screen}" stroke="${stroke}" stroke-width="2"/>
  <g clip-path="url(#${id})">${innerSvg}</g>
  <rect x="${x + (w - notchW) / 2}" y="${y + h * 0.035}" width="${notchW}" height="${notchH}" rx="${notchH / 2}" fill="#000"/>
  `;
}

function mikiUi(x, y, w, h) {
  const sx = (n) => x + (n / 1290) * w;
  const sy = (n) => y + (n / 2796) * h;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#17120D"/>
  <radialGradient id="mikiGlow" cx="40%" cy="8%" r="70%"><stop offset="0" stop-color="#543618"/><stop offset="1" stop-color="#12110F"/></radialGradient>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#mikiGlow)"/>
  ${statusBarAt(x, y + h * .033, w, "dark")}
  ${text(sx(78), sy(250), "MIKI FM", { size: w * 0.075, fill: "#F49A16", family: "JetBrains Mono, monospace", weight: 800, spacing: 8 })}
  ${text(sx(80), sy(320), "HI-FI ROCK RADIO", { size: w * 0.028, fill: "#BFB8AF", family: "JetBrains Mono, monospace", weight: 800, spacing: 9 })}
  <rect x="${sx(64)}" y="${sy(415)}" width="${w * .89}" height="${h * .064}" rx="${w * .035}" fill="#141414" stroke="#424247" stroke-width="2"/>
  ${text(sx(116), sy(492), "Search stations...", { size: w * 0.045, fill: "#6B6A70", weight: 700 })}
  <g transform="translate(${sx(70)} ${sy(580)})">
    ${["ALL", "ROCK", "JAZZ", "VINYL"].map((p, i) => `<rect x="${i * w * .18}" y="0" width="${w * .145}" height="${h * .048}" rx="${h * .024}" fill="${i === 0 ? "#3D2A11" : "#151515"}" stroke="${i === 0 ? "#B36B00" : "#313136"}"/><text x="${i * w * .18 + w * .073}" y="${h * .032}" font-family="JetBrains Mono, monospace" font-size="${w * .024}" font-weight="800" fill="${i === 0 ? "#F49A16" : "#BEBEC3"}" text-anchor="middle" letter-spacing="4">${p}</text>`).join("")}
  </g>
  ${text(sx(78), sy(725), "RADIO DNA  ·  FOR YOU", { size: w * 0.031, fill: "#F49A16", family: "JetBrains Mono, monospace", weight: 800, spacing: 6 })}
  ${stationRow(sx(64), sy(835), w * .84, h * .105, "KEXP 90.3", "USA · Seattle", "#E9E7DF", "#F49A16")}
  ${stationRow(sx(64), sy(980), w * .84, h * .105, "Radio Paradise", "UK · London", "#E9E7DF", "#08D36C")}
  ${stationRow(sx(64), sy(1125), w * .84, h * .105, "Classic Rock FM", "UK · London", "#E9E7DF", "#F49A16")}
  ${stationRow(sx(64), sy(1270), w * .84, h * .105, "Soma FM Doomed", "USA · San Francisco", "#E9E7DF", "#F49A16")}
  <rect x="${sx(62)}" y="${sy(2140)}" width="${w * .9}" height="${h * .1}" rx="${h * .05}" fill="#121212" stroke="#6D4308" stroke-width="2"/>
  ${["RADIO", "STATIONS", "CRATE", "SETTINGS"].map((p, i) => text(sx(165 + i * 270), sy(2234), p, { size: w * .023, fill: i === 1 ? "#F49A16" : "#BDBDC2", family: "JetBrains Mono, monospace", weight: 800, anchor: "middle", spacing: 7 })).join("")}
  `;
}

function stationRow(x, y, w, h, title, meta, fill, accent) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h * .22}" fill="#111112" stroke="#2B2B2F"/>
  <rect x="${x + 24}" y="${y + 24}" width="${h - 48}" height="${h - 48}" rx="18" fill="#2A211A"/>
  <circle cx="${x + h * .43}" cy="${y + h * .5}" r="${h * .18}" fill="${accent}" opacity=".75"/>
  ${text(x + h + 8, y + h * .43, title, { size: h * .25, fill, weight: 700 })}
  ${text(x + h + 8, y + h * .68, meta, { size: h * .13, fill: "#9B9A9F", family: "JetBrains Mono, monospace", weight: 700, spacing: 2 })}
  <rect x="${x + w - 180}" y="${y + h * .34}" width="132" height="${h * .26}" rx="${h * .13}" fill="#21180E" stroke="${accent}"/>
  ${text(x + w - 114, y + h * .52, "128 KBPS", { size: h * .12, fill: accent, family: "JetBrains Mono, monospace", weight: 800, anchor: "middle", spacing: 1 })}`;
}

function chefUi(x, y, w, h) {
  const sx = (n) => x + (n / 1290) * w;
  const sy = (n) => y + (n / 2796) * h;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#F4EBD9"/>
  ${statusBarAt(x, y + h * .033, w, "light")}
  ${text(sx(76), sy(300), "PulseChef", { size: w * .064, fill: "#173D2E", family: "Georgia, serif", weight: 800 })}
  ${text(sx(80), sy(362), "Smart meals from what you own", { size: w * .031, fill: "#6D675B", weight: 600 })}
  <rect x="${sx(80)}" y="${sy(444)}" width="${w * .82}" height="${h * .18}" rx="38" fill="#173D2E"/>
  <circle cx="${sx(270)}" cy="${sy(610)}" r="${w * .12}" fill="#F36B3D"/>
  <circle cx="${sx(350)}" cy="${sy(570)}" r="${w * .055}" fill="#F7C84D"/>
  ${text(sx(510), sy(560), "Dinner in", { size: w * .042, fill: "#F7F0E3", weight: 700 })}
  ${text(sx(510), sy(655), "18 min", { size: w * .083, fill: "#F7F0E3", family: "Arial Black, sans-serif", weight: 900 })}
  ${text(sx(510), sy(720), "with pantry-first recipes", { size: w * .028, fill: "#D9CCB7", weight: 600 })}
  ${recipeCard(sx(80), sy(870), w * .39, h * .245, "Tomato basil", "8 ingredients", "#F36B3D")}
  ${recipeCard(sx(544), sy(870), w * .39, h * .245, "Lemon chicken", "ready tonight", "#F7C84D")}
  ${text(sx(80), sy(1580), "Shopping list", { size: w * .05, fill: "#173D2E", weight: 850 })}
  ${["Sourdough", "Greek yogurt", "Cherry tomatoes", "Fresh basil"].map((item, i) => groceryRow(sx(80), sy(1660 + i * 138), w * .82, 94, item, ["1d", "3d", "5d", "8d"][i], i)).join("")}
  <rect x="${sx(78)}" y="${sy(2250)}" width="${w * .84}" height="${h * .11}" rx="48" fill="#173D2E"/>
  ${text(sx(168), sy(2340), "COOK", { size: w * .026, fill: "#F7F0E3", family: "JetBrains Mono, monospace", weight: 800, spacing: 5 })}
  ${text(sx(430), sy(2340), "PANTRY", { size: w * .026, fill: "#CDBF9E", family: "JetBrains Mono, monospace", weight: 800, spacing: 5 })}
  ${text(sx(735), sy(2340), "PLAN", { size: w * .026, fill: "#CDBF9E", family: "JetBrains Mono, monospace", weight: 800, spacing: 5 })}
  `;
}

function recipeCard(x, y, w, h, title, meta, accent) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="34" fill="#FFF8EB" stroke="#E1D3BB"/>
  <rect x="${x + 28}" y="${y + 28}" width="${w - 56}" height="${h * .46}" rx="28" fill="${accent}"/>
  <circle cx="${x + w * .35}" cy="${y + h * .24}" r="${w * .13}" fill="#173D2E" opacity=".72"/>
  <circle cx="${x + w * .55}" cy="${y + h * .29}" r="${w * .1}" fill="#F4EBD9" opacity=".82"/>
  ${text(x + 30, y + h * .67, title, { size: h * .085, fill: "#173D2E", weight: 800 })}
  ${text(x + 30, y + h * .82, meta, { size: h * .075, fill: "#827866", weight: 700 })}`;
}

function groceryRow(x, y, w, h, item, badge, i) {
  const accent = i === 0 ? "#1A7E52" : "#D8C8A8";
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="26" fill="#FFF8EB" stroke="#E4D6BD"/>
  <circle cx="${x + 50}" cy="${y + h / 2}" r="15" fill="${accent}"/>
  ${text(x + 86, y + h * .62, item, { size: h * .36, fill: "#173D2E", weight: 750 })}
  <rect x="${x + w - 132}" y="${y + 22}" width="92" height="${h - 44}" rx="${(h - 44) / 2}" fill="${i === 0 ? "#DDF2D6" : "none"}" stroke="${accent}"/>
  ${text(x + w - 86, y + h * .62, badge, { size: h * .3, fill: "#173D2E", weight: 800, anchor: "middle" })}`;
}

function orbitUi(x, y, w, h) {
  const sx = (n) => x + (n / 1290) * w;
  const sy = (n) => y + (n / 2796) * h;
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#071016"/>
  <radialGradient id="orbitGlow" cx="76%" cy="16%" r="55%"><stop offset="0" stop-color="#00E6A8" stop-opacity=".42"/><stop offset="1" stop-color="#071016" stop-opacity="0"/></radialGradient>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="url(#orbitGlow)"/>
  ${statusBarAt(x, y + h * .033, w, "dark")}
  ${text(sx(82), sy(300), "OrbitFit", { size: w * .066, fill: "#EAF8F3", weight: 900 })}
  ${text(sx(86), sy(365), "Recovery that adapts daily", { size: w * .031, fill: "#88A19A", family: "JetBrains Mono, monospace", weight: 700, spacing: 2 })}
  <circle cx="${sx(650)}" cy="${sy(760)}" r="${w * .26}" fill="none" stroke="#173A3A" stroke-width="34"/>
  <circle cx="${sx(650)}" cy="${sy(760)}" r="${w * .26}" fill="none" stroke="#00E6A8" stroke-width="34" stroke-linecap="round" stroke-dasharray="880 330" transform="rotate(-88 ${sx(650)} ${sy(760)})"/>
  ${text(sx(650), sy(742), "87", { size: w * .18, fill: "#EAF8F3", weight: 900, anchor: "middle" })}
  ${text(sx(650), sy(825), "READINESS", { size: w * .025, fill: "#7F9B94", family: "JetBrains Mono, monospace", weight: 800, anchor: "middle", spacing: 5 })}
  ${metricTile(sx(82), sy(1130), w * .38, h * .145, "Sleep", "7h 42m", "#7C5CFF")}
  ${metricTile(sx(520), sy(1130), w * .38, h * .145, "HRV", "68 ms", "#00E6A8")}
  ${metricTile(sx(82), sy(1510), w * .38, h * .145, "Load", "Moderate", "#FFB84D")}
  ${metricTile(sx(520), sy(1510), w * .38, h * .145, "Strain", "12.4", "#FF5A74")}
  ${text(sx(82), sy(1990), "Today plan", { size: w * .046, fill: "#EAF8F3", weight: 900 })}
  ${["Zone 2 run · 38 min", "Mobility · hips", "Hydrate · 2.4 L"].map((item, i) => `<rect x="${sx(82)}" y="${sy(2058 + i * 116)}" width="${w * .82}" height="78" rx="24" fill="#0E1C22" stroke="#1D3539"/><circle cx="${sx(126)}" cy="${sy(2086 + i * 116)}" r="12" fill="${["#00E6A8", "#7C5CFF", "#FFB84D"][i]}"/>${text(sx(160), sy(2110 + i * 116), item, { size: w * .03, fill: "#D6E8E3", weight: 760 })}`).join("")}
  `;
}

function metricTile(x, y, w, h, label, value, accent) {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="36" fill="#0E1C22" stroke="#1D3539"/>
  <circle cx="${x + 52}" cy="${y + 54}" r="16" fill="${accent}"/>
  ${text(x + 36, y + h * .55, value, { size: h * .18, fill: "#EAF8F3", weight: 900 })}
  ${text(x + 36, y + h * .78, label.toUpperCase(), { size: h * .11, fill: "#7E9992", family: "JetBrains Mono, monospace", weight: 800, spacing: 4 })}`;
}

async function composition({ file, theme, headline, subhead, bg, decor, appSvg, phone = {} }) {
  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="34" stdDeviation="42" flood-color="#000" flood-opacity=".45"/></filter>
      <pattern id="grain" width="80" height="80" patternUnits="userSpaceOnUse"><rect width="80" height="80" fill="transparent"/><circle cx="12" cy="16" r="1" fill="${theme.grain}" opacity=".18"/><circle cx="44" cy="28" r=".8" fill="${theme.grain}" opacity=".12"/><circle cx="71" cy="56" r="1.1" fill="${theme.grain}" opacity=".10"/></pattern>
      ${bg}
    </defs>
    <rect width="${W}" height="${H}" fill="${theme.base}"/>
    <rect width="${W}" height="${H}" fill="url(#heroBg)"/>
    <rect width="${W}" height="${H}" fill="url(#grain)"/>
    ${decor}
    ${wrapText(headline, 92, 255, { size: 116, fill: theme.fg, family: "Arial Black, Archivo Black, sans-serif", weight: 900, gap: 115 })}
    ${text(96, 565, subhead, { size: 42, fill: theme.muted, weight: 600 })}
    <g filter="url(#shadow)">
      ${phoneFrame(phone.x ?? 300, phone.y ?? 765, phone.w ?? 690, phone.h ?? 1500, appSvg, { bezel: phone.bezel, screen: phone.screen, stroke: phone.stroke })}
    </g>
    ${text(96, 2654, "SHOTSHQ SAMPLE", { size: 28, fill: theme.meta, family: "JetBrains Mono, monospace", weight: 800, spacing: 7 })}
  </svg>`;

  await sharp(Buffer.from(svg))
    .png({ quality: 96, compressionLevel: 9 })
    .toFile(path.join(OUT, file));
}

async function main() {
  await composition({
    file: "hero-mockup-miki-fm.png",
    theme: { base: "#090705", fg: "#FFFFFF", muted: "#D8D0C4", meta: "#FF9A15", grain: "#FF9A15" },
    headline: ["HI-FI RADIO", "WITHOUT THE", "NOISE."],
    subhead: "945 curated stations. Albums, stories, crate.",
    bg: `<radialGradient id="heroBg" cx="72%" cy="20%" r="70%"><stop offset="0" stop-color="#3C140A"/><stop offset=".42" stop-color="#100806"/><stop offset="1" stop-color="#050404"/></radialGradient>`,
    decor: `<g fill="none" stroke="#FF2A1F" stroke-width="6" opacity=".42"><circle cx="-20" cy="1600" r="360"/><circle cx="-20" cy="1600" r="470"/><circle cx="1250" cy="420" r="270"/><path d="M1030 1460 C1240 1310 1110 1080 1280 940"/></g><path d="M910 230 L1240 70" stroke="#FF9A15" opacity=".35" stroke-width="4"/>`,
    appSvg: mikiUi(300 + 21, 765 + 27, 690 * .94, 1500 * .964),
    phone: { x: 300, y: 765, w: 690, h: 1500, bezel: "#0A0A0D", screen: "#17120D" },
  });

  await composition({
    file: "hero-mockup-pulsechef.png",
    theme: { base: "#173D2E", fg: "#FFF4DF", muted: "#D8C7A8", meta: "#F36B3D", grain: "#FFF4DF" },
    headline: ["TURN YOUR", "FRIDGE INTO", "DINNER."],
    subhead: "Recipe ideas, pantry checks, and zero-waste lists.",
    bg: `<radialGradient id="heroBg" cx="80%" cy="18%" r="75%"><stop offset="0" stop-color="#F36B3D"/><stop offset=".28" stop-color="#315F43"/><stop offset="1" stop-color="#102E23"/></radialGradient>`,
    decor: `<g opacity=".72"><circle cx="1040" cy="530" r="145" fill="#F36B3D"/><circle cx="1130" cy="635" r="70" fill="#F7C84D"/><path d="M120 1240 C240 1150 250 960 380 880 C350 1030 260 1150 120 1240Z" fill="#F7F0E3" opacity=".16"/><path d="M1060 1660 C1190 1550 1170 1390 1280 1320 C1280 1510 1190 1620 1060 1660Z" fill="#F7F0E3" opacity=".12"/></g>`,
    appSvg: chefUi(332 + 21, 780 + 28, 626 * .94, 1450 * .964),
    phone: { x: 332, y: 780, w: 626, h: 1450, bezel: "#090909", screen: "#F4EBD9", stroke: "rgba(255,244,223,.25)" },
  });

  await composition({
    file: "hero-mockup-orbitfit.png",
    theme: { base: "#071016", fg: "#EAF8F3", muted: "#8FA9A2", meta: "#00E6A8", grain: "#00E6A8" },
    headline: ["TRAIN HARD.", "RECOVER", "SMARTER."],
    subhead: "Daily readiness, sleep, strain, and adaptive plans.",
    bg: `<radialGradient id="heroBg" cx="78%" cy="18%" r="72%"><stop offset="0" stop-color="#145B5A"/><stop offset=".36" stop-color="#0B1B25"/><stop offset="1" stop-color="#050B0F"/></radialGradient>`,
    decor: `<g fill="none" opacity=".7"><circle cx="1030" cy="560" r="250" stroke="#00E6A8" stroke-width="3"/><circle cx="1030" cy="560" r="170" stroke="#7C5CFF" stroke-width="3"/><path d="M45 1530 C340 1370 545 1530 770 1350 S1130 1210 1290 1320" stroke="#00E6A8" stroke-width="5" opacity=".32"/><path d="M0 690 H1290 M0 1840 H1290" stroke="#1C363C" stroke-width="2"/></g>`,
    appSvg: orbitUi(318 + 21, 755 + 28, 654 * .94, 1510 * .964),
    phone: { x: 318, y: 755, w: 654, h: 1510, bezel: "#050709", screen: "#071016", stroke: "rgba(234,248,243,.22)" },
  });

  const contact = await sharp({
    create: { width: 2400, height: 1200, channels: 4, background: "#0A0A0D" },
  })
    .composite([
      { input: await sharp(path.join(OUT, "hero-mockup-miki-fm.png")).resize({ width: 470 }).png().toBuffer(), left: 250, top: 55 },
      { input: await sharp(path.join(OUT, "hero-mockup-pulsechef.png")).resize({ width: 470 }).png().toBuffer(), left: 965, top: 55 },
      { input: await sharp(path.join(OUT, "hero-mockup-orbitfit.png")).resize({ width: 470 }).png().toBuffer(), left: 1680, top: 55 },
    ])
    .png({ quality: 96 })
    .toBuffer();
  await fs.writeFile(path.join(OUT, "hero-mockups-contact-sheet.png"), contact);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
