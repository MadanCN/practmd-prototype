import type { Enums } from "@/lib/product/database.types";

export type Horizon = Enums<"horizon">;
export type ChallengeStatus = Enums<"challenge_status">;
export type ChallengePriority = Enums<"challenge_priority">;
export type NoteType = Enums<"note_type">;
export type AppRole = "viewer" | "editor" | "admin";

// Colours are paired with a text label everywhere they appear — never colour alone.
export const HORIZONS: { value: Horizon; label: string; chip: string }[] = [
  { value: "done", label: "Done", chip: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200" },
  { value: "now", label: "Now", chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200" },
  { value: "next", label: "Next", chip: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200" },
  { value: "later", label: "Later", chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200" },
  { value: "not_now", label: "Not now", chip: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200" },
];
export const HORIZON_LABEL = Object.fromEntries(HORIZONS.map((h) => [h.value, h.label])) as Record<Horizon, string>;

export const CRITERIA = [
  { key: "revenue_impact", weightKey: "w_revenue", label: "Revenue impact", short: "Revenue", meaning: "Brings in or protects revenue" },
  { key: "operational_efficiency", weightKey: "w_operational", label: "Operational efficiency", short: "Ops", meaning: "Removes manual work at the practice" },
  { key: "unlocks", weightKey: "w_unlocks", label: "Unlocks", short: "Unlocks", meaning: "Other items depend on it" },
  { key: "ease", weightKey: "w_ease", label: "Ease", short: "Ease", meaning: "Higher means less effort" },
] as const;
export type CriterionKey = (typeof CRITERIA)[number]["key"];

/** Items in the Cortex AI workstream carry the "AI" tag. */
export const AI_WORKSTREAM = "cortex_ai";

export const CHALLENGE_STATUSES: { value: ChallengeStatus; label: string; chip: string }[] = [
  { value: "open", label: "Open", chip: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200" },
  { value: "discussing", label: "Discussing", chip: "bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200" },
  { value: "action_agreed", label: "Action agreed", chip: "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200" },
  { value: "resolved", label: "Resolved", chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200" },
  { value: "parked", label: "Parked", chip: "bg-zinc-200 text-zinc-700 dark:bg-zinc-600/40 dark:text-zinc-200" },
];
export const STATUS_LABEL = Object.fromEntries(CHALLENGE_STATUSES.map((s) => [s.value, s.label])) as Record<ChallengeStatus, string>;

export const CHALLENGE_PRIORITIES: { value: ChallengePriority; label: string; dot: string }[] = [
  { value: "high", label: "High", dot: "bg-[#B63B26]" },
  { value: "medium", label: "Medium", dot: "bg-amber-500" },
  { value: "low", label: "Low", dot: "bg-slate-400" },
];
export const PRIORITY_LABEL = Object.fromEntries(CHALLENGE_PRIORITIES.map((p) => [p.value, p.label])) as Record<ChallengePriority, string>;

export const NOTE_TYPES: { value: NoteType; label: string; chip: string }[] = [
  { value: "advice", label: "Advice", chip: "bg-teal-100 text-teal-900 dark:bg-teal-500/20 dark:text-teal-100" },
  { value: "decision", label: "Decision", chip: "bg-indigo-100 text-indigo-900 dark:bg-indigo-500/20 dark:text-indigo-100" },
  { value: "action", label: "Action", chip: "bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-100" },
  { value: "question", label: "Question", chip: "bg-rose-100 text-rose-900 dark:bg-rose-500/20 dark:text-rose-100" },
  { value: "comment", label: "Comment", chip: "bg-slate-100 text-slate-700 dark:bg-slate-700/40 dark:text-slate-200" },
];
export const NOTE_TYPE_LABEL = Object.fromEntries(NOTE_TYPES.map((n) => [n.value, n.label])) as Record<NoteType, string>;

export const DEFAULT_ADVISER = "Prasanna Gopalakrishnan";

/** WCAG contrast ratio of white text on a hex background. */
export function contrastWithWhite(hex: string): number {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return 1;
  const n = parseInt(m[1], 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const L = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return 1.05 / (L + 0.05);
}
