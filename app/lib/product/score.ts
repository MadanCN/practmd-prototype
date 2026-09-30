// Roadmap scoring — mirrors the `roadmap_items_scored` view (supabase/migrations/0001_roadmap.sql).
// The database view is the source of truth; this exists for instant feedback while a slider moves.
//
//   weighted = (R·wR + O·wO + U·wU + E·wE) / (wR + wO + wU + wE)   → 1..5
//   base     = round((weighted − 1) / 4 × 100)                     → 0..100
//   score    = clamp(base + adjustment, 0, 100)
//
// Integer maths keeps it identical to Postgres `numeric`: base = round((sumSW − sumW) · 100 / (4 · sumW)).
// Ratings are ≥ 1, so the quotient is never negative and Math.round's half-up equals half-away-from-zero.

export type Rating = number | null | undefined;

export interface Ratings {
  revenue_impact: Rating;
  operational_efficiency: Rating;
  unlocks: Rating;
  ease: Rating;
}

export interface Weights {
  w_revenue: number;
  w_operational: number;
  w_unlocks: number;
  w_ease: number;
}

export const DEFAULT_WEIGHTS: Weights = { w_revenue: 3, w_operational: 3, w_unlocks: 2, w_ease: 2 };

export const WEIGHT_PRESETS: { id: string; label: string; weights: Weights }[] = [
  { id: "balanced", label: "Balanced", weights: DEFAULT_WEIGHTS },
  { id: "revenue", label: "Revenue first", weights: { w_revenue: 5, w_operational: 2, w_unlocks: 2, w_ease: 1 } },
  { id: "relief", label: "Relief first", weights: { w_revenue: 2, w_operational: 5, w_unlocks: 2, w_ease: 1 } },
];

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;
export const ADJUSTMENT_MIN = -20;
export const ADJUSTMENT_MAX = 20;

/** Base score 0–100, or null when a rating is missing or every weight is 0. */
export function baseScore(r: Ratings, w: Weights): number | null {
  const { revenue_impact: R, operational_efficiency: O, unlocks: U, ease: E } = r;
  if (R == null || O == null || U == null || E == null) return null;
  const sumW = w.w_revenue + w.w_operational + w.w_unlocks + w.w_ease;
  if (sumW === 0) return null;
  const sumSW = R * w.w_revenue + O * w.w_operational + U * w.w_unlocks + E * w.w_ease;
  return Math.round(((sumSW - sumW) * 100) / (4 * sumW));
}

export function clampScore(n: number): number {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, n));
}

/** Final score: base plus the per-item adjustment, clamped to 0–100. Null when unscored. */
export function finalScore(r: Ratings, w: Weights, adjustment = 0): number | null {
  const base = baseScore(r, w);
  return base == null ? null : clampScore(base + adjustment);
}

export interface Rankable {
  score: number | null;
  unlocks: Rating;
  ease: Rating;
  name: string;
}

/**
 * Default ranking: score descending (unscored last), then unlocks descending, ease descending, name.
 */
export function compareByRank(a: Rankable, b: Rankable): number {
  if (a.score !== b.score) {
    if (a.score == null) return 1;
    if (b.score == null) return -1;
    return b.score - a.score;
  }
  const byUnlocks = (b.unlocks ?? 0) - (a.unlocks ?? 0);
  if (byUnlocks !== 0) return byUnlocks;
  const byEase = (b.ease ?? 0) - (a.ease ?? 0);
  if (byEase !== 0) return byEase;
  return a.name.localeCompare(b.name);
}

/**
 * For each item in rank order, the names of items it depends on that rank below it.
 * Purely a warning — it never changes the score.
 */
export function dependencyWarnings<T extends { code: string; name: string; depends_on_codes: string[] }>(
  ranked: T[],
): Map<string, string[]> {
  const position = new Map(ranked.map((item, i) => [item.code, i]));
  const warnings = new Map<string, string[]>();
  ranked.forEach((item, i) => {
    const below = item.depends_on_codes
      .filter((code) => (position.get(code) ?? -1) > i)
      .map((code) => ranked[position.get(code)!].name);
    if (below.length) warnings.set(item.code, below);
  });
  return warnings;
}
