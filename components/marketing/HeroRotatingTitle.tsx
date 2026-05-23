/**
 * Hero headline (top of fold) + a stable surface-list line beneath
 * the trust microcopy.
 *
 * The "rotator" was previously a 3.2s ticker that swapped one of six
 * non-App-Store surfaces in and out (web hero · press kit · OG card
 * · Discord banner · Product Hunt gallery · GitHub social card).
 * Brief: "Simplify any unstable rotating surface copy — prefer one
 * clear static list." Replaced with a static three-surface line that
 * names the most-common adjacent outputs in one scan. The full list
 * lives on /tools/web-hero where it actually belongs.
 *
 * `HeroRotatingTitle` keeps its original export name for callsite
 * stability; the title hasn't ever actually rotated.
 */

export function HeroRotatingTitle() {
  return (
    <h1 className="t-display t-h-1 break-words">
      Ship App Store
      <br />
      <span className="text-[var(--accent)]">screenshots</span>
      <br />
      before coffee.
    </h1>
  );
}

export function HeroSurfaceRotator() {
  return (
    <div className="inline-flex items-center gap-2.5 self-start max-w-full t-mono-xs">
      <span className="inline-flex items-center gap-1.5 text-[var(--fg-dim)] uppercase tracking-[0.16em] shrink-0">
        <span aria-hidden className="block w-1.5 h-1.5 bg-[var(--accent)]" />
        Also exports
      </span>
      <span className="text-[var(--fg)] truncate">
        web heroes · press kits · OG cards
      </span>
    </div>
  );
}
