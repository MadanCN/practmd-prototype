"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/product/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/lib/product/database.types";
import {
  fetchItems,
  fetchMvpLine,
  fetchWeights,
  fetchWorkstreams,
  insertItem,
  roadmapKeys,
  updateItem,
  type RoadmapItem,
  type WeightsRow,
} from "@/lib/product/data/roadmap";
import { compareByRank, dependencyWarnings, finalScore, type Weights } from "@/lib/product/score";
import { flash } from "@/lib/product/flash";
import { subscribeShared } from "@/lib/product/realtime";
import { useToast } from "@/components/product/ui/Toast";
import { useSession } from "@/components/product/SessionContext";

export type RankedItem = RoadmapItem & { displayScore: number | null; rank: number | null };

const EMPTY: RoadmapItem[] = [];

export function toWeights(w: WeightsRow | undefined): Weights | undefined {
  return w && { w_revenue: w.w_revenue, w_operational: w.w_operational, w_unlocks: w.w_unlocks, w_ease: w.w_ease };
}

export function useRoadmapData() {
  const sb = getSupabaseBrowserClient();
  const items = useQuery({ queryKey: roadmapKeys.items, queryFn: () => fetchItems(sb) });
  const weights = useQuery({ queryKey: roadmapKeys.weights, queryFn: () => fetchWeights(sb) });
  const workstreams = useQuery({ queryKey: roadmapKeys.workstreams, queryFn: () => fetchWorkstreams(sb) });
  const mvpLine = useQuery({ queryKey: roadmapKeys.mvpLine, queryFn: () => fetchMvpLine(sb) });
  return {
    items: items.data ?? EMPTY,
    weights: weights.data,
    workstreams: workstreams.data ?? [],
    mvpLine: mvpLine.data,
    isLoading: items.isLoading || weights.isLoading || workstreams.isLoading,
    error: items.error ?? weights.error ?? workstreams.error,
  };
}

/**
 * Ranks active items. The database score is the source of truth; while someone drags a weight
 * slider (`draftWeights`), scores are recomputed locally with the same integer maths for instant
 * feedback.
 */
export function useRankedItems(items: RoadmapItem[], draftWeights: Weights | null) {
  return useMemo(() => {
    const active = items.filter((i) => !i.archived_at);
    const scored: RankedItem[] = active.map((i) => ({
      ...i,
      displayScore: draftWeights ? finalScore(i, draftWeights, i.score_adjustment) : i.score,
      rank: null,
    }));
    scored.sort((a, b) => compareByRank({ ...a, score: a.displayScore }, { ...b, score: b.displayScore }));
    scored.forEach((i, idx) => (i.rank = idx + 1));
    const archived: RankedItem[] = items.filter((i) => i.archived_at).map((i) => ({ ...i, displayScore: null, rank: null }));
    return { ranked: scored, archived, warnings: dependencyWarnings(scored) };
  }, [items, draftWeights]);
}

/**
 * Live updates: refetch on any change to items, weights or workstreams, and flash rows someone
 * else changed.
 */
export function useRoadmapRealtime() {
  const qc = useQueryClient();
  const { user } = useSession();
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const refetch = (keys: readonly (readonly string[])[]) => {
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => keys.forEach((k) => void qc.invalidateQueries({ queryKey: k })), 120);
    };
    const release = subscribeShared(
      getSupabaseBrowserClient(),
      "roadmap-changes",
      (channel, emit) =>
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "roadmap_items" }, (p) => emit("roadmap_items", p.new))
          .on("postgres_changes", { event: "*", schema: "public", table: "scoring_weights" }, () => emit("scoring_weights", null))
          .on("postgres_changes", { event: "*", schema: "public", table: "workstreams" }, () => emit("workstreams", null)),
      (kind, payload) => {
        if (kind === "roadmap_items") {
          const row = payload as Partial<RoadmapItem>;
          const by = (row.updated_by ?? row.created_by ?? "").toLowerCase();
          if (row.id && by !== user.email) flash(row.id);
          refetch([roadmapKeys.items]);
        } else if (kind === "scoring_weights") refetch([roadmapKeys.weights, roadmapKeys.items]);
        else if (kind === "workstreams") refetch([roadmapKeys.workstreams]);
      },
    );
    return () => {
      window.clearTimeout(timer.current);
      release();
    };
  }, [qc, user.email]);
}

/** Optimistic item update: patch the cache, recompute the score locally, roll back on error. */
export function useUpdateItem() {
  const qc = useQueryClient();
  const toast = useToast();
  const sb = getSupabaseBrowserClient();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TablesUpdate<"roadmap_items">; quiet?: boolean }) => updateItem(sb, id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: roadmapKeys.items });
      const previous = qc.getQueryData<RoadmapItem[]>(roadmapKeys.items);
      const weights = toWeights(qc.getQueryData<WeightsRow>(roadmapKeys.weights));
      qc.setQueryData<RoadmapItem[]>(roadmapKeys.items, (old) =>
        old?.map((i) => {
          if (i.id !== id) return i;
          const next = { ...i, ...patch };
          const score = weights && !next.archived_at ? finalScore(next, weights, next.score_adjustment) : null;
          return { ...next, score };
        }),
      );
      return { previous };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.previous) qc.setQueryData(roadmapKeys.items, ctx.previous);
      toast(`Couldn't save: ${err.message}`, "error");
    },
    onSuccess: (_row, vars) => {
      if (!vars.quiet) toast("Saved");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: roadmapKeys.items }),
  });
}

export function useInsertItem() {
  const qc = useQueryClient();
  const toast = useToast();
  const sb = getSupabaseBrowserClient();
  return useMutation({
    mutationFn: (item: TablesInsert<"roadmap_items">) => insertItem(sb, item),
    onSuccess: async (row) => {
      await qc.invalidateQueries({ queryKey: roadmapKeys.items });
      flash(row.id);
      toast(`Added “${row.name}”`);
    },
    onError: (err) => toast(`Couldn't add item: ${err.message}`, "error"),
  });
}
