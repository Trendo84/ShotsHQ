import Image from "next/image";

type Voice = {
  quote: string;
  author: string;
  handle: string;
  app: string;
  avatar: string;
};

const VOICES: Voice[] = [
  {
    quote: "Forty languages in eight minutes. The localization fan-out alone justifies the lifetime tier.",
    author: "K. Arnesen",
    handle: "@arnesendev",
    app: "FocusForge — Productivity",
    avatar: "/avatar-focus.png",
  },
  {
    quote: "I shipped my screenshots before my coffee got cold. The Polotno editor doesn't fight me, which is a first.",
    author: "M. Davies",
    handle: "@mdavies",
    app: "Tideline — Surf reports",
    avatar: "/avatar-tideline.png",
  },
  {
    quote: "Free tier is generous, paid tier is honest. No deceptive paywalls, no fake free trials. Refreshing.",
    author: "S. Patel",
    handle: "@sk_indie",
    app: "Lentil — Grocery inventory",
    avatar: "/avatar-lentil.png",
  },
];

export function Testimonials() {
  return (
    <section className="border-b border-[var(--line)]">
      <div className="max-w-[1480px] mx-auto px-4 md:px-8 py-20 md:py-28">
        <h2 className="t-display text-[clamp(2rem,5vw,4rem)] mb-12 leading-[0.95] max-w-3xl text-balance">
          What operators say<br />
          <span className="text-[var(--accent)]">when they ship.</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
          {VOICES.map((v) => (
            <article key={v.handle} className="bg-[var(--bg)] p-7 min-h-[260px] flex flex-col">
              <p className="t-serif-disrupt text-[20px] leading-snug text-[var(--fg)] flex-1">
                <span className="text-[var(--accent)] mr-1">“</span>
                {v.quote}
                <span className="text-[var(--accent)] ml-1">”</span>
              </p>
              <footer className="mt-6 pt-4 border-t border-[var(--line)] flex items-center gap-3">
                <Image
                  src={v.avatar}
                  alt={`${v.author} portrait`}
                  width={44}
                  height={44}
                  className="w-11 h-11 shrink-0 select-none"
                  draggable={false}
                />
                <div className="min-w-0">
                  <div className="text-[var(--fg)] text-[14px] font-medium truncate">{v.author}</div>
                  <div className="t-eyebrow text-[var(--fg-mute)] mt-0.5 truncate">{v.handle}</div>
                  <div className="text-[var(--fg-mute)] text-[13px] mt-1 truncate">{v.app}</div>
                </div>
              </footer>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
