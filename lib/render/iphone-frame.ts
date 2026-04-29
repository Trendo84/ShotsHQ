/**
 * Vector iPhone frame for compositing.
 *
 * Returns an SVG of an iPhone 16 Pro silhouette with a transparent
 * "hole" where the screen sits — so a real screenshot can be layered
 * BEHIND the frame and show through the cutout.
 *
 * Also exports the screen rect coordinates so the compositor knows
 * exactly where to place the user's screenshot.
 *
 * NOTE: this is a pragmatic vector placeholder. Swap to a curated
 * photo-realistic PNG mockup pack later — the screen rect is the
 * stable contract.
 */

export type ScreenRect = {
  x:           number;
  y:           number;
  width:       number;
  height:      number;
  cornerRadius: number;
};

export type IphoneFrame = {
  svg:        string;     // full-frame SVG with screen cutout (transparent hole)
  width:      number;     // frame width (in canvas pixels)
  height:     number;     // frame height
  screen:     ScreenRect; // where the user's screenshot goes (relative to frame top-left)
};

/**
 * iPhone 16 Pro frame, sized for the lower portion of an App Store
 * canvas (1290×2796). Frame is 840×1820 — leaving ~480px on top for
 * a headline + ~280px breathing room.
 *
 * The SVG renders the dark frame body + dynamic island + side buttons.
 * The screen area is a transparent hole (fill-rule="evenodd").
 */
export function iphoneFrame(): IphoneFrame {
  const W      = 840;
  const H      = 1820;
  const FRAME_RADIUS = 130;
  const SCREEN_INSET = 18;
  const SCREEN_RADIUS = 110;
  const ISLAND_W = 240;
  const ISLAND_H = 56;
  const ISLAND_TOP = 38;

  const sw = W - SCREEN_INSET * 2;
  const sh = H - SCREEN_INSET * 2;
  const sx = SCREEN_INSET;
  const sy = SCREEN_INSET;

  // Single path with even-odd fill = donut (frame minus screen)
  const donutPath = [
    // Outer rounded rectangle
    `M ${FRAME_RADIUS} 0`,
    `L ${W - FRAME_RADIUS} 0`,
    `Q ${W} 0, ${W} ${FRAME_RADIUS}`,
    `L ${W} ${H - FRAME_RADIUS}`,
    `Q ${W} ${H}, ${W - FRAME_RADIUS} ${H}`,
    `L ${FRAME_RADIUS} ${H}`,
    `Q 0 ${H}, 0 ${H - FRAME_RADIUS}`,
    `L 0 ${FRAME_RADIUS}`,
    `Q 0 0, ${FRAME_RADIUS} 0`,
    `Z`,
    // Inner rounded rectangle (the screen hole) — clockwise reversed for evenodd
    `M ${sx + SCREEN_RADIUS} ${sy}`,
    `Q ${sx} ${sy}, ${sx} ${sy + SCREEN_RADIUS}`,
    `L ${sx} ${sy + sh - SCREEN_RADIUS}`,
    `Q ${sx} ${sy + sh}, ${sx + SCREEN_RADIUS} ${sy + sh}`,
    `L ${sx + sw - SCREEN_RADIUS} ${sy + sh}`,
    `Q ${sx + sw} ${sy + sh}, ${sx + sw} ${sy + sh - SCREEN_RADIUS}`,
    `L ${sx + sw} ${sy + SCREEN_RADIUS}`,
    `Q ${sx + sw} ${sy}, ${sx + sw - SCREEN_RADIUS} ${sy}`,
    `Z`,
  ].join(" ");

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bezel" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"  stop-color="#0F0F12"/>
      <stop offset="50%" stop-color="#1F1F24"/>
      <stop offset="100%" stop-color="#0F0F12"/>
    </linearGradient>
    <linearGradient id="hilite" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"  stop-color="#3A3A40" stop-opacity="0.6"/>
      <stop offset="6%"  stop-color="#3A3A40" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Drop shadow under the frame -->
  <ellipse cx="${W / 2}" cy="${H + 12}" rx="${W / 2 - 30}" ry="14"
           fill="#000" opacity="0.45" filter="blur(6px)"/>

  <!-- Frame body with screen cutout (donut path, even-odd fill) -->
  <path d="${donutPath}" fill="url(#bezel)" fill-rule="evenodd"/>

  <!-- Top edge highlight -->
  <path d="${donutPath}" fill="url(#hilite)" fill-rule="evenodd"/>

  <!-- Dynamic Island -->
  <rect x="${(W - ISLAND_W) / 2}" y="${ISLAND_TOP}"
        width="${ISLAND_W}" height="${ISLAND_H}"
        rx="${ISLAND_H / 2}" ry="${ISLAND_H / 2}"
        fill="#000"/>

  <!-- Side buttons (subtle) -->
  <rect x="-3" y="380" width="5" height="50"  rx="2" fill="#2A2A2E"/>
  <rect x="-3" y="540" width="5" height="120" rx="2" fill="#2A2A2E"/>
  <rect x="-3" y="700" width="5" height="120" rx="2" fill="#2A2A2E"/>
  <rect x="${W - 2}" y="500" width="5" height="160" rx="2" fill="#2A2A2E"/>
</svg>`;

  return {
    svg,
    width:  W,
    height: H,
    screen: {
      x:            sx,
      y:            sy,
      width:        sw,
      height:       sh,
      cornerRadius: SCREEN_RADIUS,
    },
  };
}
