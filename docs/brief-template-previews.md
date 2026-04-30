# Template Previews — Image-Gen Brief

**For:** the GPT image-gen agent (or human designer with imagegen access).
**Goal:** generate **21 PNG previews**, one per template, that replace the current programmatic placeholder cards on `https://shotshq.com/templates`.

---

## Why this exists

Right now every card on `/templates` renders an identical generic phone-frame mockup with a small headline. UX audit pass 2 flagged this as the single biggest perception issue on the site:

> "Every one of 21 template cards renders identically — same status bar, same gray placeholder, same layout. Only differentiator is headline copy. For a *templates* page this is fatal — visitors come to browse and see 21 identical things."

The fix: each card needs a **real, visually distinct rendered preview** of what that template's App Store screenshot would actually look like — so a visitor can scan the grid and recognize at a glance which palette / type system / mood matches their app.

---

## What "good" looks like

Each preview is a **single 3:4 portrait PNG** showing a realistic App Store screenshot composition built in that template's palette and type system. Think: a hand-tuned screenshot the way a senior designer at a top indie studio would produce it. Not a mockup of a mockup — the actual artifact.

Each preview must contain:

1. A **device frame** (iPhone 16 Pro / 16 Pro Max). Pixel-realistic, dynamic-island accurate, modern bezel. The frame fills ~75% of the canvas height, centered.
2. A **screenshot inside the frame** of an imagined app's hero screen, drawn in the template's bg / fg / accent palette. The screen content can be invented but must look like a real iOS app of the stated category — not lorem ipsum.
3. **Display copy** floating outside the frame (above and/or to the side of the device), set in the template's typeface direction (see `decor` cue per template). One tight headline + one subhead line per the template's `headline` and `subhead` fields below.
4. The **decor** texture treatment (wave, ring, bars, stripe, halftone, stack, grid, orbit, ledger, blocks) applied as a tasteful background flourish — *behind* the device, never over the screenshot.
5. **No watermark, no logos, no third-party brand marks.** No real app screenshots. Invented apps only.

Style direction by family:

| Tag | Mood | Reference points |
|---|---|---|
| `Free` | Confident, restrained, brand-forward | Apple's own App Store featured shots; Linear's marketing |
| `Pro` | Editorial / cinematic / high-craft | Awwwards SOTD work; Things 3, Bear, Halide |

---

## Output spec

| | Value |
|---|---|
| Format | PNG, 8-bit RGB (no alpha) |
| Dimensions | **1290 × 1720 px** (3:4 aspect, retina-grade) |
| File size cap | 350 KB per file (use compression / quality ~85) |
| Color profile | sRGB, IEC61966-2.1 |
| Filename | `template-preview-{slug}.png` (slug column below) |
| Total files | 21 |

**Where they go:** drop all 21 into the repo at `public/templates/preview/` (create the folder if it doesn't exist). The rendering component is `components/marketing/Templates.tsx` — once the PNGs are in place, the component will be updated to use `<Image src={`/templates/preview/${slug}.png`} … />` instead of the current programmatic mockup.

---

## The 21 templates (canonical data)

Source of truth: `components/marketing/Templates.tsx` lines 31–284. Snapshot below — if it ever drifts from the source, the source wins.

| # | Slug | Name | Category | Tag | bg | fg | accent | Decor | Headline | Subhead |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `mono-punch` | Mono Punch | Productivity | Free | `#0E0E0E` | `#F5F5F5` | `#FF2A2A` | stripe | **Ship / fast.** | One tap, one screen. |
| 2 | `soft-sunrise` | Soft Sunrise | Health & fitness | Free | `#FBE8D6` | `#2A1810` | `#E85A2C` | ring | **Wake. / Move.** | Gentle morning rituals. |
| 3 | `tideline` | Tideline | Travel & weather | Free | `#0E1A24` | `#F5F7FA` | `#3CC8FF` | wave | **Catch the / swell.** | Tide · Wind · Wave height |
| 4 | `indie-grid` | Indie Grid | Photo & video | Free | `#F4F4F0` | `#0A0A0A` | `#0A0A0A` | bars | **Curate / *everything.*** (italic serif on line 2) | Library, framed. |
| 5 | `hazard-stripe` | Hazard Stripe | Utilities | Pro | `#0A0A0A` | `#FFFFFF` | `#FFC233` | halftone | **Caution. / Useful.** | Tools that get out of the way. |
| 6 | `pastel-pop` | Pastel Pop | Kids & lifestyle | Pro | `#E0F4DE` | `#103820` | `#FF6B9D` | stack | **Soft / + silly.** | Made for tiny humans. |
| 7 | `editorial-print` | Editorial Print | News & magazine | Pro | `#F4F1E8` | `#1A1A1A` | `#A02020` | halftone | ***Read / longer.*** (italic serif throughout) | Stories that hold attention. |
| 8 | `tactical-dark` | Tactical Dark | Gaming & tools | Pro | `#050810` | `#D8E0F0` | `#4AF626` | stripe | **Lock. / Load.** | Pro-grade controls. |
| 9 | `midnight-mono` | Midnight Mono | Finance & crypto | Pro | `#0B0E14` | `#E5E7EB` | `#7DF9FF` | ledger | **Track / everything.** | Real-time portfolio. |
| 10 | `paper-cut` | Paper Cut | Books & reading | Free | `#EFEAE0` | `#1C1C1C` | `#C2410C` | halftone | **Stay / *curious.*** (italic serif on line 2) | A library in your pocket. |
| 11 | `neon-pulse` | Neon Pulse | Music & audio | Pro | `#0A0118` | `#F5E6FF` | `#FF14B8` | wave | **Feel the / frequency.** | Spatial audio engine. |
| 12 | `stadium-bold` | Stadium Bold | Sports & live | Free | `#0E1A0E` | `#F5FFF5` | `#00FF6A` | blocks | **Game. / On.** | Every result, live. |
| 13 | `atelier-grid` | Atelier Grid | Design & creative | Pro | `#FAFAF7` | `#0A0A0A` | `#0A0A0A` | grid | **Build / *better.*** (italic serif on line 2) | A studio for makers. |
| 14 | `ember-pitch` | Ember Pitch | Travel & maps | Free | `#1A0E08` | `#FBE7CE` | `#FF8A3D` | orbit | **Go / further.** | Routes, refined. |
| 15 | `vault-blue` | Vault Blue | Security & VPN | Pro | `#08152B` | `#DCEAFF` | `#3B82F6` | grid | **Locked. / Tight.** | Zero-trust, by default. |
| 16 | `command-center` | Command Center | Business & CRM | Pro | `#11130F` | `#F2F0E8` | `#D6FF4F` | ledger | **Close / more.** | Pipeline, calls, follow-up. |
| 17 | `clay-ledger` | Clay Ledger | Budgeting | Free | `#E9D9C3` | `#231914` | `#0F766E` | bars | **Spend / smarter.** | Budgets without noise. |
| 18 | `aurora-care` | Aurora Care | Wellness | Free | `#151221` | `#F8F2FF` | `#A7F3D0` | orbit | **Feel / steady.** | Mood, sleep, recovery. |
| 19 | `signal-lab` | Signal Lab | Developer tools | Pro | `#061416` | `#DFF7F4` | `#F97316` | grid | **Debug / faster.** | Logs, traces, deploys. |
| 20 | `market-bloom` | Market Bloom | Shopping | Free | `#FFF7ED` | `#20130B` | `#DB2777` | stack | **Sell / beautifully.** | Drop, cart, checkout. |
| 21 | `atlas-route` | Atlas Route | Navigation | Pro | `#10251F` | `#ECFDF5` | `#FACC15` | wave | **Find / the way.** | Trips, stops, timing. |

**Headline notation:**
- `**bold**` text is set in **Archivo Black** (display weight 900, ~92px in the canvas, letter-spacing -0.04em, line-height 0.9). The slash `/` indicates a line break.
- `*italic*` text is set in **EB Garamond italic** at the same point size — used as a deliberate type-disruptor on certain templates.
- The **second line** of every headline is colored with the template's `accent`, except where noted.

**Decor cues** (apply behind the device frame, max 12% opacity except where noted):

| Decor | What it looks like |
|---|---|
| `stripe` | Fine 45° diagonal stripes in the accent color, 6–14px stripe width |
| `halftone` | Dot grid in the fg color, 1px dots on 8px grid |
| `wave` | Two stacked SVG sine waves anchored to the bottom — one in accent, one in fg at 20% |
| `ring` | A single fat unfilled circle (stroke ~14px) in the accent, anchored upper-right, partially off-canvas |
| `stack` | Three vertical bars at the bottom — alternating accent and fg, varying heights |
| `grid` | 16×16 hairline grid in the fg color |
| `orbit` | Three concentric circles in accent / fg / accent, anchored bottom-left, with one accent dot in the upper-right |
| `ledger` | 8 horizontal hairlines at the bottom-edge, varying widths, with small terminator squares — looks like a financial chart axis |
| `blocks` | 3×4 grid of filled squares, ~half accent / half fg, anchored to the corners |
| `bars` | A row of vertical bars at the bottom (think bar chart), heights 0.4–0.95 of the row |

---

## Per-template visual notes

Read these *together* with the table above — they call out the few cases where a template needs more than the default treatment.

- **#4 Indie Grid**, **#7 Editorial Print**, **#10 Paper Cut**, **#13 Atelier Grid**: these are the "editorial" set. The italic serif on the headline must read distinctly as serif (EB Garamond italic, not Archivo italicized). Editorial Print is fully italic serif.
- **#5 Hazard Stripe**: yellow accent (`#FFC233`) is bright. Use it sparingly on the screenshot; don't let it overwhelm the dark canvas. The decor is halftone, not actual hazard stripes (those are reserved for the WIP banner motif).
- **#8 Tactical Dark**: very deep blue-black (`#050810`) with neon-green accent. The screenshot inside the frame should feel like a tactical app — gaming HUD, dev tools, ops dashboard.
- **#11 Neon Pulse**: the brightest accent (`#FF14B8`) on the deepest violet-black. Music/audio app. Lean into the saturation.
- **#15 Vault Blue**, **#19 Signal Lab**: technical / utility apps. The screenshot can show a sparkline, a security state, a log — but no real cryptography or live data.
- **#21 Atlas Route**: navigation app. The screenshot can show an abstract map *but* don't reproduce real Apple Maps / Google Maps / Mapbox tiles — invent the cartography style.

---

## How to access the codebase to drop the files in

If you (the agent) have repo write access:

1. Clone or open the repo at `https://github.com/Trendo84/ShotsHQ`.
2. Create the directory `public/templates/preview/` if it doesn't exist.
3. Drop all 21 PNGs in there with the exact filenames `template-preview-{slug}.png` (slug from the table above — kebab-case, no spaces).
4. Open a PR titled `feat: real per-template visual previews` against `main`. The PR will trigger Vercel preview, where the cards can be visually verified before merge.
5. Note in the PR body: which model you used, total render cost, and any templates you're least happy with so the maintainer can flag re-renders.

If you don't have repo access:

1. Generate all 21 PNGs.
2. Zip them into `template-previews-v1.zip` with the exact filenames above.
3. Hand off to the maintainer via the chat. They will commit the assets + flip the rendering component in one commit.

The maintainer will then update `components/marketing/Templates.tsx` to swap the programmatic `<TemplateCard>` body for an `<Image src={...} />` reference. That part is ~5 lines and is **NOT in scope for the image-gen agent** — focus only on producing the 21 PNGs.

---

## Hard constraints (do not violate)

- **No real app screenshots.** Every screen content must be invented. Any visual that looks lifted from a shipping app is rejected.
- **No real brand marks.** No App Store icon, no Apple logo, no GitHub mark, no Google logo, no third-party app names.
- **No celebrity faces, no real people.** If the screen needs a human (e.g. wellness or social app), use abstract avatars or geometric portraits. Never stock photography of real faces.
- **No copyrighted typefaces.** Stick to Archivo Black + EB Garamond italic + JetBrains Mono. Both are SIL Open Font License via Google Fonts.
- **No alpha transparency in the final PNG.** Composited flat onto the template's `bg` color.
- **No upscaling artifacts.** Render natively at 1290×1720 — don't upscale a smaller image.
- **No off-brand accent colors.** Use the exact hex from the table.

---

## QA checklist before shipping the batch

- [ ] All 21 files present in `public/templates/preview/`.
- [ ] Filenames match `template-preview-{slug}.png` exactly.
- [ ] Every file is 1290×1720, ≤350 KB, sRGB, no alpha.
- [ ] Open the grid at `/templates` in the Vercel preview deploy. Scroll the page on a phone — at no point do two adjacent cards look interchangeable.
- [ ] Pro-tagged templates feel measurably more crafted than Free-tagged.
- [ ] Italic-serif templates (Indie Grid / Editorial Print / Paper Cut / Atelier Grid) are visibly serif at thumbnail size.
- [ ] Dark-bg templates have foreground type that hits ≥4.5:1 contrast on the screen content (run via Chrome devtools' contrast checker).
- [ ] No template's screen content reproduces real-world UI (Apple Music, Spotify, Maps, etc.).
- [ ] Total bundle delta on the `/templates` route is under 7 MB.

---

## Open questions for the maintainer

If you (the agent) hit any of these, ask before generating:

1. Do you have a preferred image-gen model? (gpt-image-1 / Imagen / Flux / Midjourney). The site already uses gpt-image-1 for in-product backdrops, so consistency suggests gpt-image-1 — but if you have a specific model in mind, say so.
2. Is the iPhone 16 Pro frame correct, or should we render iPhone 16 Pro Max specifically (1320 × 2868 source resolution)?
3. Do you want a dark / light pair per template? (Currently spec is one PNG per slug.)
4. Should the "Pro" tag show a visible chip on the preview (e.g. a small "PRO" pill in a corner), or is the existing UI badge below the image enough? Default to the latter.

---

## Out of scope

This brief covers ONLY the 21 marketing-page template previews. Out of scope:

- App Store screenshots inside the editor (handled by the AI Backdrop module — that's a runtime feature, not a static asset).
- Hero / OG / Press kit images (already shipped).
- Per-template starter canvases inside the app (separate task — the Template config will need a `starterCanvas: ShotsCanvas` field, but that's runtime, not preview).
