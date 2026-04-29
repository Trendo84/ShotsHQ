"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

const STORAGE_KEY = "shotshq:wip-dismissed-2026-04-30";

/**
 * "Work in progress" banner. Lives at the very top of every page on
 * shotshq.com while the product is in active pre-launch development.
 *
 * - Hazard-stripe yellow/black diagonal pattern (matches the brand
 *   bookmark in the marketing footer).
 * - Dismissible — choice persisted to localStorage so it doesn't nag
 *   on every page load. Re-appears when the storage key version bumps.
 * - Compact, single-line, black text on yellow for max contrast.
 */
export function WipBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setShow(localStorage.getItem(STORAGE_KEY) !== "1");
  }, []);

  if (!show) return null;

  return (
    <div
      role="status"
      aria-label="Work in progress notice"
      className="relative w-full text-[#0A0A0A] z-50"
      style={{
        background:
          "repeating-linear-gradient(135deg, #FFC800 0 18px, #0A0A0A 18px 22px, #FFC800 22px 40px)",
      }}
    >
      <div className="bg-[#FFC800] mx-[44px] py-[6px] px-3 sm:px-6 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5 text-[12px] font-mono uppercase tracking-[0.16em] font-semibold min-w-0">
          <span className="block w-2 h-2 rounded-full bg-[#0A0A0A] animate-pulse shrink-0" />
          <span className="truncate">
            Work in progress · Pre-launch build · Some features still wiring up
          </span>
        </div>
        <button
          onClick={() => {
            localStorage.setItem(STORAGE_KEY, "1");
            setShow(false);
          }}
          className="inline-flex items-center justify-center w-6 h-6 hover:bg-[#0A0A0A] hover:text-[#FFC800] transition-colors shrink-0"
          aria-label="Dismiss work in progress notice"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}
