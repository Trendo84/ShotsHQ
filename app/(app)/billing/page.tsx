import Link from "next/link";
import { Topbar } from "@/components/app/Topbar";
import { Badge } from "@/components/ui/badge";

const HISTORY = [
  { ts: "2026-04-25 09:14", reason: "ai_copy",        ref: "cp_8a72",         delta: -1,  balance: 142 },
  { ts: "2026-04-24 22:08", reason: "ai_background",  ref: "bg_1a93",         delta: -2,  balance: 143 },
  { ts: "2026-04-24 22:07", reason: "ai_translate",   ref: "tr_44e1",         delta: -12, balance: 145 },
  { ts: "2026-04-22 14:33", reason: "refund",         ref: "rs_87c0",         delta: 3,   balance: 157 },
  { ts: "2026-04-22 14:30", reason: "ai_restyle",     ref: "rs_87c0",         delta: -3,  balance: 154 },
  { ts: "2026-04-19 11:00", reason: "purchase",       ref: "pi_0SH0XX_pro",   delta: 100, balance: 157 },
  { ts: "2026-04-12 09:08", reason: "ai_background",  ref: "bg_8e22",         delta: -2,  balance: 57  },
];

const PACKS = [
  { id: "indie",    name: "INDIE PACK", credits: 100, price: "$19" },
  { id: "pro",      name: "PRO PACK",   credits: 300, price: "$49" },
  { id: "studio",   name: "STUDIO",     credits: "∞", price: "$29/MO" },
  { id: "lifetime", name: "LIFETIME",   credits: "∞", price: "$149" },
];

export default function BillingPage() {
  return (
    <>
      <Topbar section="BILLING" breadcrumb={["OPERATOR", "BILLING"]} />

      <div className="grid grid-cols-12 border-b-2 border-[var(--line-strong)]">
        <div className="col-span-12 md:col-span-7 border-r border-[var(--line)] p-6 md:p-10">
          <div className="t-mono-xs text-[var(--accent)] mb-2">[ MODULE / 02-BILLING ]</div>
          <h1 className="t-display-xl text-[clamp(2.5rem,6vw,5.5rem)] leading-[0.9]">BILLING<br />LEDGER</h1>
        </div>
        <aside className="col-span-12 md:col-span-5 grid grid-cols-2">
          <Stat label="BALANCE"  value="142"        sub="indie pack" tint="accent" />
          <Stat label="THIS MO."  value="-58"       sub="net usage" />
          <Stat label="PLAN"      value="INDIE"     sub="non-recurring" />
          <Stat label="NEXT BILL" value="—"         sub="no auto-charge" />
        </aside>
      </div>

      {/* Packs */}
      <section className="border-b-2 border-[var(--line-strong)]">
        <div className="px-6 py-3 border-b border-[var(--line)]">
          <span className="t-mono-xs text-[var(--accent)]">[ TOP-UP / SUBSCRIBE ]</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 grid-rule">
          {PACKS.map((p) => (
            <article key={p.id} className="p-6 min-h-[220px] flex flex-col justify-between">
              <header>
                <div className="t-mono-xs text-[var(--fg-mute)]">{p.id.toUpperCase()}</div>
                <div className="t-display text-[28px] mt-1 leading-tight">{p.name}</div>
              </header>
              <div>
                <div className="t-mono-xs text-[var(--fg-mute)]">CREDITS</div>
                <div className="t-display text-[32px] t-numeric mt-1">{p.credits}</div>
              </div>
              <div>
                <div className="t-display text-[28px] mt-1 t-numeric">{p.price}</div>
                <button className="btn btn-accent w-full mt-3 text-[10px]">PURCHASE &gt;&gt;</button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* History */}
      <section>
        <div className="px-6 py-3 border-b border-[var(--line)] flex items-center justify-between">
          <span className="t-mono-xs text-[var(--accent)]">[ CREDIT LEDGER · APPEND-ONLY ]</span>
          <Link href="/docs/billing" className="t-mono-xs text-[var(--fg-mute)] hover:text-[var(--fg)]">DOCS →</Link>
        </div>
        <ul>
          <li className="grid grid-cols-12 px-6 py-2 border-b border-[var(--line)] bg-[var(--bg-2)] t-mono-xs text-[var(--fg-mute)]">
            <span className="col-span-3 md:col-span-2">TIMESTAMP</span>
            <span className="col-span-3 md:col-span-2">REASON</span>
            <span className="col-span-3 md:col-span-3">REFERENCE</span>
            <span className="col-span-2 md:col-span-2 text-right">DELTA</span>
            <span className="col-span-1 md:col-span-3 text-right">BALANCE</span>
          </li>
          {HISTORY.map((h, i) => (
            <li key={i} className="grid grid-cols-12 px-6 py-2.5 border-b border-[var(--line)] hover:bg-[var(--bg-2)] t-mono-xs">
              <span className="col-span-3 md:col-span-2 text-[var(--fg-mute)]">{h.ts}</span>
              <span className="col-span-3 md:col-span-2 text-[var(--fg)]">
                {h.reason === "purchase" || h.reason === "refund" ? <Badge variant="live">{h.reason}</Badge> : h.reason}
              </span>
              <span className="col-span-3 md:col-span-3 text-[var(--fg-mute)]">{h.ref}</span>
              <span className={`col-span-2 md:col-span-2 text-right t-numeric ${h.delta > 0 ? "text-[var(--signal)]" : "text-[var(--accent)]"}`}>
                {h.delta > 0 ? "+" : ""}{h.delta}
              </span>
              <span className="col-span-1 md:col-span-3 text-right t-numeric text-[var(--fg)]">{h.balance}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function Stat({ label, value, sub, tint = "default" }: { label: string; value: string; sub?: string; tint?: "default" | "accent" | "signal" }) {
  const color =
    tint === "accent" ? "text-[var(--accent)]"
    : tint === "signal" ? "text-[var(--signal)]"
    : "text-[var(--fg)]";
  return (
    <div className="border-b border-r border-[var(--line)] last:border-r-0 p-5">
      <div className="t-mono-xs text-[var(--fg-mute)]">{label}</div>
      <div className={`t-display text-[36px] t-numeric mt-1 leading-[0.85] ${color}`}>{value}</div>
      {sub && <div className="t-mono-xs text-[var(--fg-mute)] mt-2">▸ {sub}</div>}
    </div>
  );
}
