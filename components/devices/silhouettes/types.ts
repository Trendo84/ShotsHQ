/**
 * Shared props for all silhouette components.
 *
 * `selected` flips the cutout fill from a quiet `currentColor` to the
 * brand `var(--accent)` so the picker's selected tile reads at-a-
 * glance. All four silhouette components consume the same prop shape
 * to keep `pickSilhouette()` interchangeable.
 */
export type SilhouetteProps = {
  selected?: boolean;
};
