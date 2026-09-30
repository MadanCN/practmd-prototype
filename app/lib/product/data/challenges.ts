// Supabase queries for Challenges. All access goes through RLS with the user's session.
import type { ProductSupabase } from "@/lib/product/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/lib/product/database.types";
import { must } from "./errors";

export type Challenge = Tables<"challenges">;
export type ChallengeNote = Tables<"challenge_notes">;
export type ChallengeCategory = Tables<"challenge_categories">;

/** Challenge plus the counts `challenges_summary` exposes, derived from the loaded notes. */
export type ChallengeWithCounts = Challenge & {
  note_count: number;
  advice_count: number;
  open_actions: number;
  last_note_at: string | null;
  pinned_notes: ChallengeNote[];
};

export const challengeKeys = {
  challenges: ["challenges", "list"] as const,
  notes: ["challenges", "notes"] as const,
  categories: ["challenges", "categories"] as const,
  roadmapCodes: ["challenges", "roadmap-codes"] as const,
};

export async function fetchChallenges(sb: ProductSupabase): Promise<Challenge[]> {
  return must(await sb.from("challenges").select("*").order("sort_order").order("created_at"));
}

/** All notes, newest first. The board searches note text and shows pinned notes, so it needs them all. */
export async function fetchNotes(sb: ProductSupabase): Promise<ChallengeNote[]> {
  return must(await sb.from("challenge_notes").select("*").order("created_at", { ascending: false }));
}

export async function fetchCategories(sb: ProductSupabase): Promise<ChallengeCategory[]> {
  return must(await sb.from("challenge_categories").select("*").order("sort_order"));
}

export async function upsertCategories(sb: ProductSupabase, rows: TablesInsert<"challenge_categories">[]): Promise<void> {
  must(await sb.from("challenge_categories").upsert(rows).select("code"));
}

export async function fetchRoadmapCodes(sb: ProductSupabase): Promise<{ code: string; name: string }[]> {
  return must(await sb.from("roadmap_items").select("code, name").is("archived_at", null).order("code"));
}

export async function insertChallenge(sb: ProductSupabase, row: TablesInsert<"challenges">): Promise<Challenge> {
  return must(await sb.from("challenges").insert(row).select("*").single());
}

export async function updateChallenge(sb: ProductSupabase, id: string, patch: TablesUpdate<"challenges">): Promise<Challenge> {
  return must(await sb.from("challenges").update(patch).eq("id", id).select("*").single());
}

/** Writes new sort_order values (and category, when a card moved column) in one round trip per row. */
export async function reorderChallenges(
  sb: ProductSupabase,
  rows: { id: string; sort_order: number; category?: string }[],
): Promise<void> {
  await Promise.all(
    rows.map(async ({ id, ...patch }) => must(await sb.from("challenges").update(patch).eq("id", id).select("id"))),
  );
}

export async function insertNote(sb: ProductSupabase, row: TablesInsert<"challenge_notes">): Promise<ChallengeNote> {
  return must(await sb.from("challenge_notes").insert(row).select("*").single());
}

export async function updateNote(sb: ProductSupabase, id: string, patch: TablesUpdate<"challenge_notes">): Promise<ChallengeNote> {
  return must(
    await sb
      .from("challenge_notes")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("*")
      .single(),
  );
}

export async function deleteNote(sb: ProductSupabase, id: string): Promise<void> {
  must(await sb.from("challenge_notes").delete().eq("id", id).select("id"));
}

/** Same counts as the `challenges_summary` view. */
export function withCounts(challenges: Challenge[], notes: ChallengeNote[]): ChallengeWithCounts[] {
  const byChallenge = new Map<string, ChallengeNote[]>();
  for (const n of notes) {
    const list = byChallenge.get(n.challenge_id) ?? [];
    list.push(n);
    byChallenge.set(n.challenge_id, list);
  }
  return challenges.map((c) => {
    const list = byChallenge.get(c.id) ?? [];
    return {
      ...c,
      note_count: list.length,
      advice_count: list.filter((n) => n.note_type === "advice").length,
      open_actions: list.filter((n) => n.note_type === "action" && !n.action_done).length,
      last_note_at: list.reduce<string | null>((max, n) => (!max || n.created_at > max ? n.created_at : max), null),
      pinned_notes: list.filter((n) => n.pinned),
    };
  });
}
