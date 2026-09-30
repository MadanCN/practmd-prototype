// Supabase queries for Roadmap and Priorities. All access goes through RLS with the user's session.
import type { ProductSupabase } from "@/lib/product/supabase/client";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/lib/product/database.types";
import type { Weights } from "@/lib/product/score";
import { DataError, must, mustAffect } from "./errors";

export type RoadmapItemRow = Tables<"roadmap_items">;
/** A roadmap item plus its score from the `roadmap_items_scored` view (null when unscored or archived). */
export type RoadmapItem = RoadmapItemRow & { score: number | null; base_score: number | null };
export type Workstream = Tables<"workstreams">;
export type WeightsRow = Tables<"scoring_weights">;
export type HistoryEntry = Tables<"roadmap_item_history">;
export interface MvpLine {
  label: string;
  date: string | null;
}

export const roadmapKeys = {
  items: ["roadmap", "items"] as const,
  weights: ["roadmap", "weights"] as const,
  workstreams: ["roadmap", "workstreams"] as const,
  mvpLine: ["roadmap", "mvp-line"] as const,
  history: (itemId: string) => ["roadmap", "history", itemId] as const,
};

/** Every item (archived included), with the database's score merged in from the view. */
export async function fetchItems(sb: ProductSupabase): Promise<RoadmapItem[]> {
  const [rows, scores] = await Promise.all([
    sb.from("roadmap_items").select("*").order("sort_order"),
    sb.from("roadmap_items_scored").select("id, score, base_score"),
  ]);
  const byId = new Map(must(scores).map((s) => [s.id, s]));
  return must(rows).map((r) => ({
    ...r,
    score: byId.get(r.id)?.score ?? null,
    base_score: byId.get(r.id)?.base_score ?? null,
  }));
}

export async function fetchWeights(sb: ProductSupabase): Promise<WeightsRow> {
  return must(await sb.from("scoring_weights").select("*").eq("id", 1).single());
}

export async function updateWeights(sb: ProductSupabase, w: Weights, email: string): Promise<void> {
  const { error } = await sb
    .from("scoring_weights")
    .update({ ...w, updated_by: email, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) throw new DataError(error.message, error.code);
}

export async function fetchWorkstreams(sb: ProductSupabase): Promise<Workstream[]> {
  return must(await sb.from("workstreams").select("*").order("sort_order"));
}

export async function upsertWorkstreams(sb: ProductSupabase, rows: TablesInsert<"workstreams">[]): Promise<void> {
  must(await sb.from("workstreams").upsert(rows).select("code"));
}

export async function fetchMvpLine(sb: ProductSupabase): Promise<MvpLine> {
  const { data, error } = await sb.from("settings").select("value").eq("key", "mvp_line").maybeSingle();
  if (error) throw new DataError(error.message, error.code);
  const v = (data?.value ?? {}) as { label?: unknown; date?: unknown };
  return {
    label: typeof v.label === "string" ? v.label : "MVP",
    date: typeof v.date === "string" && v.date ? v.date : null,
  };
}

export async function saveMvpLine(sb: ProductSupabase, line: MvpLine): Promise<void> {
  must(await sb.from("settings").upsert({ key: "mvp_line", value: line as unknown as Json }).select("key"));
}

export async function insertItem(sb: ProductSupabase, item: TablesInsert<"roadmap_items">): Promise<RoadmapItemRow> {
  return must(await sb.from("roadmap_items").insert(item).select("*").single());
}

export async function updateItem(sb: ProductSupabase, id: string, patch: TablesUpdate<"roadmap_items">): Promise<RoadmapItemRow> {
  return must(await sb.from("roadmap_items").update(patch).eq("id", id).select("*").single());
}

/** Permanently deletes an item (its history goes with it; references are cleared by a trigger). */
export async function deleteItem(sb: ProductSupabase, id: string): Promise<void> {
  mustAffect(await sb.from("roadmap_items").delete().eq("id", id).select("id"));
}

/** Removes items from the timeline by clearing their From and To. */
export async function clearDates(sb: ProductSupabase, ids: string[]): Promise<void> {
  mustAffect(await sb.from("roadmap_items").update({ start_date: null, end_date: null }).in("id", ids).select("id"));
}

export async function deleteWorkstream(sb: ProductSupabase, code: string): Promise<void> {
  mustAffect(await sb.from("workstreams").delete().eq("code", code).select("code"));
}

export async function fetchHistory(sb: ProductSupabase, itemId: string): Promise<HistoryEntry[]> {
  return must(
    await sb.from("roadmap_item_history").select("*").eq("item_id", itemId).order("changed_at", { ascending: false }).limit(100),
  );
}
