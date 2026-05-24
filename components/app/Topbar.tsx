/**
 * Topbar — DEPRECATED at the structural-redesign cycle.
 *
 * The persistent page-header strip used to render the section title +
 * breadcrumb beneath the global AppNav. The redesign drops the
 * second-tier header (every page already has its own H1) so the
 * shell stays light. This component is now a thin no-op that
 * preserves the legacy prop signature for the dozen+ call sites
 * across `app/(app)/*` — once those have been migrated to the
 * AppNav-only pattern, this file can be deleted.
 *
 * Call sites still pass `section` and `breadcrumb` for backwards
 * compatibility. Nothing renders.
 */
export function Topbar(_props: { section: string; breadcrumb?: string[] }) {
  return null;
}
