import { describe, expect, it } from "vitest";
import {
  DEFAULT_WEIGHTS,
  baseScore,
  compareByRank,
  dependencyWarnings,
  finalScore,
  type Ratings,
} from "./score";

const r = (R: number | null, O: number | null, U: number | null, E: number | null): Ratings => ({
  revenue_impact: R,
  operational_efficiency: O,
  unlocks: U,
  ease: E,
});

const ZERO_WEIGHTS = { w_revenue: 0, w_operational: 0, w_unlocks: 0, w_ease: 0 };

describe("score", () => {
  it("(5,4,4,3) at default weights → 78, not the pack's floating-point 77", () => {
    expect(finalScore(r(5, 4, 4, 3), DEFAULT_WEIGHTS)).toBe(78);
  });

  it("(1,3,5,4) → 50", () => {
    expect(finalScore(r(1, 3, 5, 4), DEFAULT_WEIGHTS)).toBe(50);
  });

  it("(5,5,5,5) → 100", () => {
    expect(finalScore(r(5, 5, 5, 5), DEFAULT_WEIGHTS)).toBe(100);
  });

  it("(1,1,1,1) → 0", () => {
    expect(finalScore(r(1, 1, 1, 1), DEFAULT_WEIGHTS)).toBe(0);
  });

  it("(4,4,4,4) → 75", () => {
    expect(finalScore(r(4, 4, 4, 4), DEFAULT_WEIGHTS)).toBe(75);
  });

  it("one rating missing → null", () => {
    expect(finalScore(r(5, 4, null, 3), DEFAULT_WEIGHTS)).toBeNull();
  });

  it("all weights 0 → null", () => {
    expect(finalScore(r(5, 4, 4, 3), ZERO_WEIGHTS)).toBeNull();
  });

  it("base 95 + adjustment 10 → 100 (clamped)", () => {
    // (5,5,5,4) at default weights: sumSW = 48, sumW = 10 → 3800 / 40 = 95
    expect(baseScore(r(5, 5, 5, 4), DEFAULT_WEIGHTS)).toBe(95);
    expect(finalScore(r(5, 5, 5, 4), DEFAULT_WEIGHTS, 10)).toBe(100);
  });

  it("clamps below zero", () => {
    expect(finalScore(r(1, 1, 1, 2), DEFAULT_WEIGHTS, -20)).toBe(0);
  });
});

describe("compareByRank", () => {
  const item = (name: string, score: number | null, unlocks: number | null, ease: number | null) => ({
    name,
    score,
    unlocks,
    ease,
  });

  it("orders by score, then unlocks, then ease, then name; unscored last", () => {
    const sorted = [
      item("Unscored", null, 5, 5),
      item("B", 78, 4, 3),
      item("Low", 40, 5, 5),
      item("A", 78, 4, 3),
      item("More unlocks", 78, 5, 1),
      item("Easier", 78, 4, 4),
    ].sort(compareByRank);
    expect(sorted.map((i) => i.name)).toEqual(["More unlocks", "Easier", "A", "B", "Low", "Unscored"]);
  });
});

describe("seed ranking", () => {
  // Scored seed items that can reach the top three (spec acceptance checklist).
  const seed = [
    { code: "r1", name: "Insurance verification (manual)", R: 5, O: 4, U: 4, E: 3 },
    { code: "r2", name: "Office Ally clearinghouse connection", R: 5, O: 4, U: 4, E: 3 },
    { code: "a1", name: "Quill: scribe and coding", R: 5, O: 5, U: 3, E: 2 },
    { code: "t1", name: "Outcome baselines", R: 2, O: 4, U: 5, E: 5 },
    { code: "s3", name: "Run in parallel with Office Ally", R: 4, O: 4, U: 5, E: 2 },
    { code: "c2", name: "Encounter and clinical note", R: 4, O: 4, U: 5, E: 2 },
    { code: "r3", name: "Claims from signed notes", R: 5, O: 4, U: 3, E: 2 },
  ].map((s) => ({ ...s, unlocks: s.U, ease: s.E, score: finalScore(r(s.R, s.O, s.U, s.E), DEFAULT_WEIGHTS) }));

  it("top three are Insurance verification (78), Office Ally clearinghouse (78), Quill (75)", () => {
    const top = [...seed].sort(compareByRank).slice(0, 3);
    expect(top.map((i) => [i.name, i.score])).toEqual([
      ["Insurance verification (manual)", 78],
      ["Office Ally clearinghouse connection", 78],
      ["Quill: scribe and coding", 75],
    ]);
  });
});

describe("dependencyWarnings", () => {
  it("flags an item ranked above something it depends on", () => {
    const ranked = [
      { code: "a", name: "Alpha", depends_on_codes: ["b"] },
      { code: "b", name: "Beta", depends_on_codes: [] },
      { code: "c", name: "Gamma", depends_on_codes: ["a", "missing"] },
    ];
    const w = dependencyWarnings(ranked);
    expect(w.get("a")).toEqual(["Beta"]);
    expect(w.has("b")).toBe(false);
    expect(w.has("c")).toBe(false);
  });
});
