import type { Json } from "@/lib/product/database.types";
import { HORIZON_LABEL, type Horizon } from "@/lib/product/constants";

// Turns roadmap_item_history before/after snapshots into readable field changes.

const FIELD_LABELS: Record<string, string> = {
  code: "Code",
  name: "Name",
  description: "Description",
  outcome: "Outcome",
  workstream: "Workstream",
  horizon: "Horizon",
  revenue_impact: "Revenue impact",
  operational_efficiency: "Operational efficiency",
  unlocks: "Unlocks",
  ease: "Ease",
  score_adjustment: "Adjustment",
  adjustment_reason: "Adjustment reason",
  start_date: "From",
  end_date: "To",
  depends_on_codes: "Depends on",
  is_mvp: "MVP",
  owner: "Owner",
  archived_at: "Archived",
};

export interface FieldChange {
  field: string;
  label: string;
  from: string;
  to: string;
}

function show(field: string, v: Json | undefined): string {
  if (v === null || v === undefined || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.join(", ") : "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (field === "horizon" && typeof v === "string") return HORIZON_LABEL[v as Horizon] ?? v;
  if (field === "archived_at") return "Yes";
  return String(v);
}

function asRecord(j: Json | null): Record<string, Json | undefined> {
  return j && typeof j === "object" && !Array.isArray(j) ? j : {};
}

export function describeChanges(before: Json | null, after: Json | null): FieldChange[] {
  const b = asRecord(before);
  const a = asRecord(after);
  return Object.keys(FIELD_LABELS)
    .filter((f) => JSON.stringify(b[f] ?? null) !== JSON.stringify(a[f] ?? null))
    .map((f) => ({ field: f, label: FIELD_LABELS[f], from: show(f, b[f]), to: show(f, a[f]) }));
}
