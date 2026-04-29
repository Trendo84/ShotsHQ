"use client";

import { useMemo, useState } from "react";
import {
  DEVICES,
  type Device,
  type DeviceFamily,
  groupByFamily,
} from "@/lib/devices/catalog";
import { DeviceTile } from "./DeviceTile";

type Props = {
  selected: string[];
  onChange: (ids: string[]) => void;
  /** Minimum number of devices that must be selected. */
  minSelected?: number;
  className?: string;
};

/**
 * Multi-select picker grouped by family. Filterable by current/all,
 * search by name. Required devices are highlighted with an accent
 * eyebrow so users know which ones the App Store actually demands.
 */
export function DevicePicker({
  selected,
  onChange,
  minSelected = 1,
  className = "",
}: Props) {
  const [filter, setFilter] = useState<"current" | "all">("current");
  const [activeFamily, setActiveFamily] = useState<DeviceFamily | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = filter === "current" ? DEVICES.filter((d) => d.current) : DEVICES;
    if (activeFamily !== "all") list = list.filter((d) => d.family === activeFamily);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.shortSpec.toLowerCase().includes(q),
      );
    }
    return list;
  }, [filter, activeFamily, query]);

  const grouped = groupByFamily(filtered);

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      // Don't allow drop below minSelected.
      if (selected.length <= minSelected) return;
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const totalSelected = selected.length;

  return (
    <div className={className}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-[var(--line)]">
        {/* Family tabs */}
        <div className="inline-flex border border-[var(--line)] divide-x divide-[var(--line)]">
          {(["all", "iphone", "ipad"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFamily(f)}
              className={`px-3 py-1.5 t-mono-xs uppercase tracking-[0.12em] transition-colors ${
                activeFamily === f
                  ? "bg-[var(--fg)] text-[var(--bg)]"
                  : "text-[var(--fg-dim)] hover:text-[var(--fg)]"
              }`}
            >
              {f === "all" ? "All" : f === "iphone" ? "iPhone" : "iPad"}
            </button>
          ))}
        </div>

        {/* Current vs all */}
        <div className="inline-flex border border-[var(--line)] divide-x divide-[var(--line)]">
          {(["current", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 t-mono-xs uppercase tracking-[0.12em] transition-colors ${
                filter === f
                  ? "bg-[var(--fg)] text-[var(--bg)]"
                  : "text-[var(--fg-dim)] hover:text-[var(--fg)]"
              }`}
            >
              {f === "current" ? "Current" : "All gens"}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter devices…"
          className="bg-[var(--bg-2)] border border-[var(--line)] text-[13px] px-3 py-1.5 outline-none focus:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)] placeholder:text-[var(--fg-dim)] flex-1 min-w-[160px]"
        />

        <span className="t-mono-xs text-[var(--fg-dim)] ml-auto tabular-nums">
          {totalSelected} selected
        </span>
      </div>

      {/* Family sections */}
      {(activeFamily === "all" || activeFamily === "iphone") && grouped.iphone.length > 0 && (
        <FamilySection
          title="iPhone"
          devices={grouped.iphone}
          selected={selected}
          onToggle={toggle}
        />
      )}
      {(activeFamily === "all" || activeFamily === "ipad") && grouped.ipad.length > 0 && (
        <FamilySection
          title="iPad"
          devices={grouped.ipad}
          selected={selected}
          onToggle={toggle}
        />
      )}

      {filtered.length === 0 && (
        <div className="text-[13px] text-[var(--fg-mute)] py-12 text-center">
          No devices match your filter.
        </div>
      )}
    </div>
  );
}

function FamilySection({
  title,
  devices,
  selected,
  onToggle,
}: {
  title: string;
  devices: Device[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <section className="mb-6">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="t-eyebrow t-eyebrow-accent">{title}</h3>
        <span className="t-mono-xs text-[var(--fg-mute)] tabular-nums">{devices.length}</span>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 md:gap-4">
        {devices.map((d) => {
          const isSelected = selected.includes(d.id);
          return (
            <button
              key={d.id}
              type="button"
              onClick={() => onToggle(d.id)}
              aria-pressed={isSelected}
              className={`group relative p-3 border transition-colors text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)] ${
                isSelected
                  ? "border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
                  : "border-[var(--line)] hover:border-[var(--line-strong)] hover:bg-[var(--bg-2)]"
              }`}
            >
              {d.isStoreRequired && (
                <span className="absolute top-2 right-2 t-mono-xs text-[9px] uppercase tracking-[0.14em] font-semibold text-[var(--accent)]">
                  Required
                </span>
              )}
              {!d.current && (
                <span className="absolute top-2 right-2 t-mono-xs text-[9px] uppercase tracking-[0.14em] font-semibold text-[var(--fg-mute)]">
                  Legacy
                </span>
              )}
              <DeviceTile device={d} selected={isSelected} size="md" showName />
            </button>
          );
        })}
      </div>
    </section>
  );
}
