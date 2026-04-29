import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth/clerk";
import { getBalance, getLedgerHistory } from "@/lib/db/queries/credits";

const PACKS = [
  { id: "indie",          name: "INDIE PACK",       credits: "100", price: "$19",     desc: "One-time",   accent: false },
  { id: "pro",            name: "PRO PACK",         credits: "300", price: "$49",     desc: "One-time",   accent: true  },
  { id: "studio_monthly", name: "STUDIO",           credits: "∞",   price: "$29 /MO", desc: "Subscription", accent: false },
  { id: "studio_annual",  name: "STUDIO ANNUAL",    credits: "∞",   price: "$290 /YR", desc: "Save 17%",   accent: false },
];

export default async function BillingPage() {
  const user    = await requireUser();
  const balance = await getBalance(user.id);
  const history = await getLedgerHistory(user.id, 50);

  const isStudio  = user.plan === "studio_monthly" || user.plan === "studio_annual" || user.plan === "lifetime";
  const planLabel = isStudio
    ? user.plan === "lifetime" ? "LIFETIME" : "STUDIO"
    : "FREE";

  // Compute net usage this month from ledger (negative = spent).
  const monthAgo  = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const monthNet  = history
    .filter((h) => h.createdAt >= monthAgo)
    .reduce((acc, h) => acc + h.delta, 0);

  return (
    <>
      <Topbar section="BILLING" breadcrumb={["OPERATOR", "BILLING"]} />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r-0 md:border-r border-[var(--line)] p-5 sm:p-6 md:p-10">
          <div className="t-mono-xs text-[var(--accent)] mb-2">[ MODULE / 02-BILLING ]</div>
          <h1 className="t-display text-[clamp(2rem,6vw,5.5rem)] leading-[0.92] text-balance">
            BILLING<br />LEDGER
          </h1>
        </div>
        <aside className="col-span-12 md:col-span-5 grid grid-cols-2 border-t md:border-t-0 border-[var(--line)]">
          <Stat
            label="BALANCE"
            value={isStudio ? "∞" : String(balance)}
            sub={isStudio ? "studio · unmetered" : "current"}
            tint="accent"
          />
          <Stat
            label="THIS MO."
            value={isStudio ? "—" : (monthNet >= 0 ? `+${monthNet}` : String(monthNet))}
            sub={isStudio ? "no meter" : "net usage"}
          />
          <Stat label="PLAN"      value={planLabel} sub={isStudio ? "active" : "non-recurring"} />
          <Stat
            label="NEXT BILL"
            value={isStudio ? "Auto" : "—"}
            sub={isStudio ? "subscription renewal" : "no auto-charge"}
          />
        </aside>
      </div>

      {/* Packs */}
      <section className="border-b-2 border-[var(--line-strong)]">
        <div className="px-5 sm:px-6 py-3 border-b border-[var(--line)]">
          <span className="t-mono-xs text-[var(--accent)]">[ TOP-UP / SUBSCRIBE ]</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 grid-rule">
          {PACKS.map((p) => (
            <article
              key={p.id}
              className="p-5 sm:p-6 min-h-[200px] sm:min-h-[220px] flex flex-col justify-between gap-4"
            >
              <header>
                <div className="t-mono-xs text-[var(--fg-mute)]">{p.id.toUpperCase()}</div>
                <div className="t-display text-[clamp(1.25rem,2.5vw,1.75rem)] mt-1 leading-[0.95]">{p.name}</div>
              </header>
              <div>
                <div className="t-mono-xs text-[var(--fg-mute)]">CREDITS</div>
                <div className="t-display text-[clamp(1.5rem,3vw,2rem)] t-numeric mt-1">{p.credits}</div>
              </div>
              <div>
                <div className="t-display text-[clamp(1.25rem,2.5vw,1.75rem)] t-numeric leading-tight">{p.price}</div>
                <div className="t-mono-xs text-[var(--fg-mute)] mt-0.5">{p.desc}</div>
                <button
                  type="button"
                  className={`w-full mt-3 text-[10px] py-2 transition-colors ${
                    p.accent
                      ? "btn btn-accent"
                      : "btn"
                  }`}
                >
                  PURCHASE &gt;&gt;
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* History */}
      <section>
        <div className="px-5 sm:px-6 py-3 border-b border-[var(--line)] flex items-center justify-between flex-wrap gap-2">
          <span className="t-mono-xs text-[var(--accent)]">[ CREDIT LEDGER · APPEND-ONLY ]</span>
          <Link href="/docs/billing" className="t-mono-xs text-[var(--fg-mute)] hover:text-[var(--fg)]">DOCS →</Link>
        </div>

        {history.length === 0 ? (
          <div className="px-5 sm:px-6 py-16 text-center">
            <div className="t-eyebrow t-eyebrow-accent mb-2">No transactions yet</div>
            <p className="t-mono-sm text-[var(--fg-mute)] max-w-md mx-auto">
              Your ledger is empty. Every credit purchase, AI debit, and refund
              will appear here in chronological order.
            </p>
          </div>
        ) : (
          <ul>
            <li className="grid grid-cols-12 px-5 sm:px-6 py-2 border-b border-[var(--line)] bg-[var(--bg-2)] t-mono-xs text-[var(--fg-mute)]">
              <span className="col-span-4 sm:col-span-3">TIMESTAMP</span>
              <span className="col-span-3 sm:col-span-3">REASON</span>
              <span className="hidden sm:block sm:col-span-3">REFERENCE</span>
              <span className="col-span-3 sm:col-span-2 text-right">DELTA</span>
              <span className="col-span-2 sm:col-span-1 text-right">RUN.</span>
            </li>
            {history.map((h, i) => (
              <li
                key={h.id ?? i}
                className="grid grid-cols-12 px-5 sm:px-6 py-2.5 border-b border-[var(--line)] hover:bg-[var(--bg-2)] t-mono-xs"
              >
                <span className="col-span-4 sm:col-span-3 text-[var(--fg-mute)] truncate tabular-nums">
                  {h.createdAt.toISOString().slice(0, 16).replace("T", " ")}
                </span>
                <span className="col-span-3 sm:col-span-3 text-[var(--fg)] truncate">
                  {h.reason === "purchase" || h.reason === "refund" ? (
                    <Badge variant="live">{h.reason}</Badge>
                  ) : (
                    h.reason
                  )}
                </span>
                <span className="hidden sm:block sm:col-span-3 text-[var(--fg-mute)] truncate">
                  {h.refId?.slice(0, 16) ?? "—"}
                </span>
                <span
                  className={`col-span-3 sm:col-span-2 text-right t-numeric ${
                    h.delta > 0
                      ? "text-[var(--signal)]"
                      : h.delta < 0
                      ? "text-[var(--accent)]"
                      : "text-[var(--fg-mute)]"
                  }`}
                >
                  {h.delta > 0 ? "+" : ""}
                  {h.delta}
                </span>
                <span className="col-span-2 sm:col-span-1 text-right t-numeric text-[var(--fg-mute)] truncate">
                  {h.id?.slice(0, 4) ?? ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Stat({
  label, value, sub, tint = "default",
}: {
  label: string;
  value: string;
  sub?:  string;
  tint?: "default" | "accent" | "signal";
}) {
  const color =
    tint === "accent" ? "text-[var(--accent)]"
    : tint === "signal" ? "text-[var(--signal)]"
    : "text-[var(--fg)]";
  return (
    <div className="border-b border-r border-[var(--line)] last:border-r-0 p-4 sm:p-5 min-w-0">
      <div className="t-mono-xs text-[var(--fg-mute)] truncate">{label}</div>
      <div className={`t-display text-[clamp(1.5rem,3.5vw,2.25rem)] t-numeric mt-1 leading-[0.85] truncate ${color}`}>
        {value}
      </div>
      {sub && <div className="t-mono-xs text-[var(--fg-mute)] mt-2 truncate">▸ {sub}</div>}
    </div>
  );
}
