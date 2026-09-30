"use client";

import { useEffect, useMemo, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSupabaseBrowserClient } from "@/lib/product/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/lib/product/database.types";
import {
  challengeKeys,
  deleteNote,
  fetchCategories,
  fetchChallenges,
  fetchNotes,
  fetchRoadmapCodes,
  insertChallenge,
  insertNote,
  reorderChallenges,
  updateChallenge,
  updateNote,
  withCounts,
  type Challenge,
  type ChallengeNote,
} from "@/lib/product/data/challenges";
import { flash } from "@/lib/product/flash";
import { subscribeShared } from "@/lib/product/realtime";
import { useToast } from "@/components/product/ui/Toast";
import { useSession } from "@/components/product/SessionContext";

const NO_CHALLENGES: Challenge[] = [];
const NO_NOTES: ChallengeNote[] = [];

export function useChallengesData() {
  const sb = getSupabaseBrowserClient();
  const challenges = useQuery({ queryKey: challengeKeys.challenges, queryFn: () => fetchChallenges(sb) });
  const notes = useQuery({ queryKey: challengeKeys.notes, queryFn: () => fetchNotes(sb) });
  const categories = useQuery({ queryKey: challengeKeys.categories, queryFn: () => fetchCategories(sb) });
  const roadmapCodes = useQuery({ queryKey: challengeKeys.roadmapCodes, queryFn: () => fetchRoadmapCodes(sb), staleTime: 5 * 60_000 });
  const all = challenges.data ?? NO_CHALLENGES;
  const allNotes = notes.data ?? NO_NOTES;
  const withNoteCounts = useMemo(() => withCounts(all, allNotes), [all, allNotes]);
  return {
    challenges: withNoteCounts,
    notes: allNotes,
    categories: categories.data ?? [],
    roadmapCodes: roadmapCodes.data ?? [],
    isLoading: challenges.isLoading || notes.isLoading || categories.isLoading,
    error: challenges.error ?? notes.error ?? categories.error,
  };
}

/** Live updates for challenges and notes; highlights what other people add or change. */
export function useChallengesRealtime() {
  const qc = useQueryClient();
  const { user } = useSession();
  const timers = useRef<Record<string, number>>({});

  useEffect(() => {
    const pending = timers.current;
    const refetch = (key: readonly string[]) => {
      const k = key.join("/");
      window.clearTimeout(pending[k]);
      pending[k] = window.setTimeout(() => void qc.invalidateQueries({ queryKey: key }), 100);
    };
    const release = subscribeShared(
      getSupabaseBrowserClient(),
      "challenge-changes",
      (channel, emit) =>
        channel
          .on("postgres_changes", { event: "*", schema: "public", table: "challenges" }, (p) => emit("challenges", p.new))
          .on("postgres_changes", { event: "*", schema: "public", table: "challenge_notes" }, (p) => emit(`notes:${p.eventType}`, p.new)),
      (kind, payload) => {
        if (kind === "challenges") {
          const row = payload as Partial<Challenge>;
          const by = (row.updated_by ?? row.created_by ?? "").toLowerCase();
          if (row.id && by && by !== user.email) flash(row.id);
          refetch(challengeKeys.challenges);
        } else if (kind.startsWith("notes:")) {
          const row = payload as Partial<ChallengeNote>;
          if (kind === "notes:INSERT" && row.id && (row.created_by ?? "").toLowerCase() !== user.email) {
            flash(row.id);
            if (row.challenge_id) flash(row.challenge_id);
          }
          refetch(challengeKeys.notes);
        }
      },
    );
    return () => {
      Object.values(pending).forEach((t) => window.clearTimeout(t));
      release();
    };
  }, [qc, user.email]);
}

export function useChallengeMutations() {
  const qc = useQueryClient();
  const toast = useToast();
  const sb = getSupabaseBrowserClient();
  const fail = (what: string) => (err: Error) => toast(`Couldn't ${what}: ${err.message}`, "error");

  const create = useMutation({
    mutationFn: (row: TablesInsert<"challenges">) => insertChallenge(sb, row),
    onSuccess: async (row) => {
      await qc.invalidateQueries({ queryKey: challengeKeys.challenges });
      flash(row.id);
    },
    onError: fail("add the challenge"),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TablesUpdate<"challenges">; quiet?: boolean }) => updateChallenge(sb, id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: challengeKeys.challenges });
      const previous = qc.getQueryData<Challenge[]>(challengeKeys.challenges);
      qc.setQueryData<Challenge[]>(challengeKeys.challenges, (old) => old?.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(challengeKeys.challenges, ctx.previous);
      fail("save")(err);
    },
    onSuccess: (_r, v) => !v.quiet && toast("Saved"),
    onSettled: () => qc.invalidateQueries({ queryKey: challengeKeys.challenges }),
  });

  const reorder = useMutation({
    mutationFn: (rows: { id: string; sort_order: number; category?: string }[]) => reorderChallenges(sb, rows),
    onMutate: async (rows) => {
      await qc.cancelQueries({ queryKey: challengeKeys.challenges });
      const previous = qc.getQueryData<Challenge[]>(challengeKeys.challenges);
      const byId = new Map(rows.map((r) => [r.id, r]));
      qc.setQueryData<Challenge[]>(challengeKeys.challenges, (old) => old?.map((c) => (byId.has(c.id) ? { ...c, ...byId.get(c.id) } : c)));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(challengeKeys.challenges, ctx.previous);
      fail("move the card")(err);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: challengeKeys.challenges }),
  });

  const addNote = useMutation({
    mutationFn: (row: TablesInsert<"challenge_notes">) => insertNote(sb, row),
    onSuccess: async (row) => {
      // The trigger may have changed the challenge's status.
      await Promise.all([
        qc.invalidateQueries({ queryKey: challengeKeys.notes }),
        qc.invalidateQueries({ queryKey: challengeKeys.challenges }),
      ]);
      flash(row.id);
    },
    onError: fail("save the note"),
  });

  const editNote = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: TablesUpdate<"challenge_notes"> }) => updateNote(sb, id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: challengeKeys.notes });
      const previous = qc.getQueryData<ChallengeNote[]>(challengeKeys.notes);
      qc.setQueryData<ChallengeNote[]>(challengeKeys.notes, (old) => old?.map((n) => (n.id === id ? { ...n, ...patch, updated_at: new Date().toISOString() } : n)));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(challengeKeys.notes, ctx.previous);
      fail("update the note")(err);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: challengeKeys.notes }),
  });

  const removeNote = useMutation({
    mutationFn: (id: string) => deleteNote(sb, id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: challengeKeys.notes });
      const previous = qc.getQueryData<ChallengeNote[]>(challengeKeys.notes);
      qc.setQueryData<ChallengeNote[]>(challengeKeys.notes, (old) => old?.filter((n) => n.id !== id));
      return { previous };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.previous) qc.setQueryData(challengeKeys.notes, ctx.previous);
      fail("delete the note")(err);
    },
    onSuccess: () => toast("Note deleted"),
    onSettled: () => qc.invalidateQueries({ queryKey: challengeKeys.notes }),
  });

  return { create, update, reorder, addNote, editNote, removeNote };
}
