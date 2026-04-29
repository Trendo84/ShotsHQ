import Link from "next/link";

/**
 * Templates gallery. Each tile is a hand-tuned "screenshot inside a
 * device frame" composition — the actual visual artifact ShotsHQ
 * produces, not a mockup of one. Tile order alternates aspect/density
 * so the grid reads as a portfolio, not a uniform list.
 */

type Template = {
  slug: string;
  name: string;
  category: string;
  tag: string;
  bg: string;
  fg: string;
  accent: string;
  decor: "ring" | "wave" | "bars" | "stack" | "halftone" | "stripe" | "grid" | "orbit" | "ledger" | "blocks";
  headline: React.ReactNode;
  subhead: string;
};

const TEMPLATES: Template[] = [
  {
    slug: "mono-punch",
    name: "Mono Punch",
    category: "Productivity",
    tag: "Free",
    bg: "#0E0E0E",
    fg: "#F5F5F5",
    accent: "#FF2A2A",
    decor: "stripe",
    headline: <>Ship<br /><span style={{ color: "#FF2A2A" }}>fast.</span></>,
    subhead: "One tap, one screen.",
  },
  {
    slug: "soft-sunrise",
    name: "Soft Sunrise",
    category: "Health & fitness",
    tag: "Free",
    bg: "#FBE8D6",
    fg: "#2A1810",
    accent: "#E85A2C",
    decor: "ring",
    headline: <>Wake.<br /><span style={{ color: "#E85A2C" }}>Move.</span></>,
    subhead: "Gentle morning rituals.",
  },
  {
    slug: "tideline",
    name: "Tideline",
    category: "Travel & weather",
    tag: "Free",
    bg: "#0E1A24",
    fg: "#F5F7FA",
    accent: "#3CC8FF",
    decor: "wave",
    headline: <>Catch the<br /><span style={{ color: "#3CC8FF" }}>swell.</span></>,
    subhead: "Tide · Wind · Wave height",
  },
  {
    slug: "indie-grid",
    name: "Indie Grid",
    category: "Photo & video",
    tag: "Free",
    bg: "#F4F4F0",
    fg: "#0A0A0A",
    accent: "#0A0A0A",
    decor: "bars",
    headline: <>Curate<br /><span className="italic" style={{ fontFamily: "var(--font-serif)", color: "#0A0A0A" }}>everything.</span></>,
    subhead: "Library, framed.",
  },
  {
    slug: "hazard-stripe",
    name: "Hazard Stripe",
    category: "Utilities",
    tag: "Pro",
    bg: "#0A0A0A",
    fg: "#FFFFFF",
    accent: "#FFC233",
    decor: "halftone",
    headline: <>Caution.<br /><span style={{ color: "#FFC233" }}>Useful.</span></>,
    subhead: "Tools that get out of the way.",
  },
  {
    slug: "pastel-pop",
    name: "Pastel Pop",
    category: "Kids & lifestyle",
    tag: "Pro",
    bg: "#E0F4DE",
    fg: "#103820",
    accent: "#FF6B9D",
    decor: "stack",
    headline: <>Soft<br /><span style={{ color: "#FF6B9D" }}>+ silly.</span></>,
    subhead: "Made for tiny humans.",
  },
  {
    slug: "editorial-print",
    name: "Editorial Print",
    category: "News & magazine",
    tag: "Pro",
    bg: "#F4F1E8",
    fg: "#1A1A1A",
    accent: "#A02020",
    decor: "halftone",
    headline: <span className="italic" style={{ fontFamily: "var(--font-serif)" }}>Read<br /><span style={{ color: "#A02020" }}>longer.</span></span>,
    subhead: "Stories that hold attention.",
  },
  {
    slug: "tactical-dark",
    name: "Tactical Dark",
    category: "Gaming & tools",
    tag: "Pro",
    bg: "#050810",
    fg: "#D8E0F0",
    accent: "#4AF626",
    decor: "stripe",
    headline: <>Lock.<br /><span style={{ color: "#4AF626" }}>Load.</span></>,
    subhead: "Pro-grade controls.",
  },
  {
    slug: "midnight-mono",
    name: "Midnight Mono",
    category: "Finance & crypto",
    tag: "Pro",
    bg: "#0B0E14",
    fg: "#E5E7EB",
    accent: "#7DF9FF",
    decor: "ledger",
    headline: <>Track<br /><span style={{ color: "#7DF9FF" }}>everything.</span></>,
    subhead: "Real-time portfolio.",
  },
  {
    slug: "paper-cut",
    name: "Paper Cut",
    category: "Books & reading",
    tag: "Free",
    bg: "#EFEAE0",
    fg: "#1C1C1C",
    accent: "#C2410C",
    decor: "halftone",
    headline: <span style={{ fontFamily: "var(--font-serif)" }}>Stay<br /><span className="italic" style={{ color: "#C2410C" }}>curious.</span></span>,
    subhead: "A library in your pocket.",
  },
  {
    slug: "neon-pulse",
    name: "Neon Pulse",
    category: "Music & audio",
    tag: "Pro",
    bg: "#0A0118",
    fg: "#F5E6FF",
    accent: "#FF14B8",
    decor: "wave",
    headline: <>Feel the<br /><span style={{ color: "#FF14B8" }}>frequency.</span></>,
    subhead: "Spatial audio engine.",
  },
  {
    slug: "stadium-bold",
    name: "Stadium Bold",
    category: "Sports & live",
    tag: "Free",
    bg: "#0E1A0E",
    fg: "#F5FFF5",
    accent: "#00FF6A",
    decor: "blocks",
    headline: <>Game.<br /><span style={{ color: "#00FF6A" }}>On.</span></>,
    subhead: "Every result, live.",
  },
  {
    slug: "atelier-grid",
    name: "Atelier Grid",
    category: "Design & creative",
    tag: "Pro",
    bg: "#FAFAF7",
    fg: "#0A0A0A",
    accent: "#0A0A0A",
    decor: "grid",
    headline: <>Build<br /><span className="italic" style={{ fontFamily: "var(--font-serif)" }}>better.</span></>,
    subhead: "A studio for makers.",
  },
  {
    slug: "ember-pitch",
    name: "Ember Pitch",
    category: "Travel & maps",
    tag: "Free",
    bg: "#1A0E08",
    fg: "#FBE7CE",
    accent: "#FF8A3D",
    decor: "orbit",
    headline: <>Go<br /><span style={{ color: "#FF8A3D" }}>further.</span></>,
    subhead: "Routes, refined.",
  },
  {
    slug: "vault-blue",
    name: "Vault Blue",
    category: "Security & VPN",
    tag: "Pro",
    bg: "#08152B",
    fg: "#DCEAFF",
    accent: "#3B82F6",
    decor: "grid",
    headline: <>Locked.<br /><span style={{ color: "#3B82F6" }}>Tight.</span></>,
    subhead: "Zero-trust, by default.",
  },
  {
    slug: "command-center",
    name: "Command Center",
    category: "Business & CRM",
    tag: "Pro",
    bg: "#11130F",
    fg: "#F2F0E8",
    accent: "#D6FF4F",
    decor: "ledger",
    headline: <>Close<br /><span style={{ color: "#D6FF4F" }}>more.</span></>,
    subhead: "Pipeline, calls, follow-up.",
  },
  {
    slug: "clay-ledger",
    name: "Clay Ledger",
    category: "Budgeting",
    tag: "Free",
    bg: "#E9D9C3",
    fg: "#231914",
    accent: "#0F766E",
    decor: "bars",
    headline: <>Spend<br /><span style={{ color: "#0F766E" }}>smarter.</span></>,
    subhead: "Budgets without noise.",
  },
  {
    slug: "aurora-care",
    name: "Aurora Care",
    category: "Wellness",
    tag: "Free",
    bg: "#151221",
    fg: "#F8F2FF",
    accent: "#A7F3D0",
    decor: "orbit",
    headline: <>Feel<br /><span style={{ color: "#A7F3D0" }}>steady.</span></>,
    subhead: "Mood, sleep, recovery.",
  },
  {
    slug: "signal-lab",
    name: "Signal Lab",
    category: "Developer tools",
    tag: "Pro",
    bg: "#061416",
    fg: "#DFF7F4",
    accent: "#F97316",
    decor: "grid",
    headline: <>Debug<br /><span style={{ color: "#F97316" }}>faster.</span></>,
    subhead: "Logs, traces, deploys.",
  },
  {
    slug: "market-bloom",
    name: "Market Bloom",
    category: "Shopping",
    tag: "Free",
    bg: "#FFF7ED",
    fg: "#20130B",
    accent: "#DB2777",
    decor: "stack",
    headline: <>Sell<br /><span style={{ color: "#DB2777" }}>beautifully.</span></>,
    subhead: "Drop, cart, checkout.",
  },
  {
    slug: "atlas-route",
    name: "Atlas Route",
    category: "Navigation",
    tag: "Pro",
    bg: "#10251F",
    fg: "#ECFDF5",
    accent: "#FACC15",
    decor: "wave",
    headline: <>Find<br /><span style={{ color: "#FACC15" }}>the way.</span></>,
    subhead: "Trips, stops, timing.",
  },
];

export const TEMPLATE_COUNT = TEMPLATES.length;

export function Templates({ compact = false }: { compact?: boolean }) {
  const list = compact ? TEMPLATES.slice(0, 6) : TEMPLATES;
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-20 md:py-28">
        <div className="grid grid-cols-12 gap-8 mb-12 items-end">
          <h2 className="col-span-12 md:col-span-7 t-display text-[clamp(2.25rem,5.5vw,4.5rem)] leading-[0.95]">
            Start from a<br />
            <span className="text-[var(--accent)]">starter.</span>
          </h2>
          <p className="col-span-12 md:col-span-5 t-prose max-w-md">
            {TEMPLATE_COUNT} curated starting points. Pick one, swap your screens in,
            ship. Or build a project from blank if you'd rather.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {list.map((t, i) => (
            <TemplateCard key={t.slug} t={t} dense={i % 5 === 2} />
          ))}
        </div>

        {compact && (
          <div className="mt-12 flex justify-center">
            <Link
              href="/templates"
              className="group inline-flex items-center gap-3 bg-[var(--accent)] text-[var(--accent-fg)] pl-6 pr-1.5 py-2 transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
            >
              <span className="btn-label">Browse all templates</span>
              <span className="inline-grid place-items-center w-9 h-9 bg-[var(--accent-fg)] text-[var(--accent)] transition-transform duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-0.5 leading-none font-bold">
                <span aria-hidden className="-mt-px">→</span>
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

function TemplateCard({ t, dense = false }: { t: Template; dense?: boolean }) {
  return (
    <article className="group border border-[var(--line)] bg-[var(--bg)] hover:border-[var(--line-strong)] transition-colors flex flex-col">
      <div className="aspect-[3/4] relative overflow-hidden flex items-center justify-center px-3 py-3" style={{ background: t.bg, color: t.fg }}>
        {/* Decorative texture per template */}
        <Texture decor={t.decor} accent={t.accent} fg={t.fg} />

        {/* Phone surface */}
        <div className="relative z-10 aspect-[9/19.5] h-[88%] flex flex-col" style={{ background: t.bg, color: t.fg }}>
          <div className="relative h-3.5 flex items-center justify-between px-2 text-[5px] font-semibold tabular-nums">
            <span style={{ opacity: 0.85 }}>9:41</span>
            <span className="absolute left-1/2 -translate-x-1/2 top-0.5 h-1.5 w-4 rounded-full bg-black" aria-hidden />
            <span style={{ opacity: 0.85 }}>5G</span>
          </div>
          <div className="flex-1 flex flex-col justify-center px-2.5 gap-1.5">
            <span className="hidden sm:inline text-[5px] uppercase tracking-[0.18em] font-semibold" style={{ color: t.accent }}>
              {t.category}
            </span>
            <h4
              className="leading-[0.85] tracking-[-0.04em] text-[clamp(0.75rem,2.4vw,0.875rem)]"
              style={{ fontFamily: "var(--font-display)", color: t.fg }}
            >
              {t.headline}
            </h4>
            <p className="hidden sm:block text-[5px] leading-snug opacity-65 mt-0.5">{t.subhead}</p>
          </div>
          <span className="block h-[1.5px] w-1/3 mx-auto mb-1 rounded-full" style={{ background: t.fg, opacity: 0.5 }} aria-hidden />
        </div>
      </div>
      <div className="p-4 flex items-start justify-between gap-3 border-t border-[var(--line)]">
        <div className="min-w-0">
          <div className="text-[14px] font-medium text-[var(--fg)] truncate">{t.name}</div>
          <div className="text-[12px] text-[var(--fg-mute)] truncate">{t.category}</div>
        </div>
        <span
          className={`t-eyebrow normal-case tracking-[0.05em] px-1.5 py-0.5 border ${
            t.tag === "Pro"
              ? "text-[var(--accent)] border-[var(--accent)]"
              : "text-[var(--fg-mute)] border-[var(--line-strong)]"
          }`}
        >
          {t.tag}
        </span>
      </div>
    </article>
  );
}

function Texture({ decor, accent, fg }: { decor: Template["decor"]; accent: string; fg: string }) {
  if (decor === "stripe") {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(-45deg, ${accent} 0 6px, transparent 6px 14px)`,
          opacity: 0.07,
        }}
      />
    );
  }
  if (decor === "halftone") {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage: `radial-gradient(${fg} 1px, transparent 1.4px)`,
          backgroundSize: "8px 8px",
          opacity: 0.08,
        }}
      />
    );
  }
  if (decor === "wave") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.18 }}
      >
        <path d="M0 140 Q 50 100, 100 140 T 200 140 V 200 H 0 Z" fill={accent} />
        <path d="M0 160 Q 50 130, 100 160 T 200 160 V 200 H 0 Z" fill={fg} fillOpacity="0.2" />
      </svg>
    );
  }
  if (decor === "ring") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.16 }}
      >
        <circle cx="170" cy="40" r="80" fill="none" stroke={accent} strokeWidth="14" />
      </svg>
    );
  }
  if (decor === "stack") {
    return (
      <div aria-hidden className="absolute inset-0 flex items-end justify-center gap-1 pb-2 opacity-15">
        <span className="block w-3 h-12 rounded-none" style={{ background: accent }} />
        <span className="block w-3 h-20 rounded-none" style={{ background: fg }} />
        <span className="block w-3 h-16 rounded-none" style={{ background: accent }} />
      </div>
    );
  }
  if (decor === "grid") {
    return (
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          backgroundImage:
            `linear-gradient(${fg} 1px, transparent 1px), linear-gradient(90deg, ${fg} 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
          opacity: 0.07,
        }}
      />
    );
  }
  if (decor === "orbit") {
    return (
      <svg
        aria-hidden
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.18 }}
      >
        <circle cx="40" cy="170" r="120" fill="none" stroke={accent} strokeWidth="1" />
        <circle cx="40" cy="170" r="80"  fill="none" stroke={fg}     strokeWidth="1" strokeOpacity="0.5" />
        <circle cx="40" cy="170" r="40"  fill="none" stroke={accent} strokeWidth="1" />
        <circle cx="60" cy="60"  r="3"   fill={accent} />
      </svg>
    );
  }
  if (decor === "ledger") {
    return (
      <div aria-hidden className="absolute inset-0 flex flex-col justify-end pb-3 px-3 gap-[2px] opacity-20">
        {[78, 55, 92, 41, 68, 84, 33, 71].map((w, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span className="block h-px flex-1" style={{ background: fg, width: `${w}%`, maxWidth: `${w}%` }} />
            <span
              className="block h-1 w-1"
              style={{ background: i % 3 === 0 ? accent : fg }}
            />
          </div>
        ))}
      </div>
    );
  }
  if (decor === "blocks") {
    return (
      <div aria-hidden className="absolute inset-0 grid grid-cols-3 grid-rows-4 gap-[3px] opacity-15 p-3">
        {[0,1,0,1,1,0,0,1,1,0,1,0].map((on, i) => (
          <span key={i} style={{ background: on ? accent : fg }} />
        ))}
      </div>
    );
  }
  // bars
  return (
    <div aria-hidden className="absolute inset-x-3 bottom-3 flex items-end gap-px h-10 opacity-20">
      {[0.5, 0.8, 0.4, 0.9, 0.6, 0.85, 0.55, 0.7, 0.45, 0.95].map((h, i) => (
        <span key={i} className="flex-1" style={{ background: i % 3 === 0 ? accent : fg, height: `${h * 100}%` }} />
      ))}
    </div>
  );
}
