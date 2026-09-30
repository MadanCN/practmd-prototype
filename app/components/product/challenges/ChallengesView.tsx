"use client";

import { useCallback, useMemo, useState } from "react";
import { FileText, KanbanSquare, List, Search, Settings2 } from "lucide-react";
import { CHALLENGE_PRIORITIES, CHALLENGE_STATUSES, type ChallengePriority, type ChallengeStatus } from "@/lib/product/constants";
import { Button, EmptyState, MultiSelect, Skeleton, ToggleChip, inputClass } from "@/components/product/ui/primitives";
import { useSession } from "@/components/product/SessionContext";
import { useUrlState } from "@/components/product/useUrlState";
import { PresenceAvatars } from "@/components/product/Presence";
import Board from "./Board";
import ListView from "./ListView";
import ChallengeDrawer from "./ChallengeDrawer";
import RecapDialog from "./RecapDialog";
import CategoriesDialog from "./CategoriesDialog";
import { useChallengesData, useChallengesRealtime } from "./useChallenges";
import { cn } from "@/lib/utils";

export default function ChallengesView() {
  const { isAdmin } = useSession();
  const url = useUrlState();
  const { challenges, notes, categories, roadmapCodes, isLoading, error } = useChallengesData();
  useChallengesRealtime();
  const [recap, setRecap] = useState(false);
  const [managing, setManaging] = useState(false);

  const view = url.get("view") === "list" ? "list" : "board";
  const statuses = url.getList("status") as ChallengeStatus[];
  const priorities = url.getList("priority") as ChallengePriority[];
  const owners = url.getList("owner");
  const hasAdvice = url.getFlag("advice");
  const hasActions = url.getFlag("actions");
  const showArchived = url.getFlag("archived");
  const q = url.get("q");

  const active = useMemo(() => challenges.filter((c) => !c.archived_at), [challenges]);
  const ownerOptions = useMemo(() => [...new Set(challenges.map((c) => c.owner).filter((o): o is string => !!o))].sort(), [challenges]);

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const noteText = new Map<string, string>();
    if (needle) for (const n of notes) noteText.set(n.challenge_id, `${noteText.get(n.challenge_id) ?? ""} ${n.body} ${n.source ?? ""}`.toLowerCase());
    return (showArchived ? challenges : active).filter(
      (c) =>
        (!statuses.length || statuses.includes(c.status)) &&
        (!priorities.length || priorities.includes(c.priority)) &&
        (!owners.length || (c.owner && owners.includes(c.owner))) &&
        (!hasAdvice || c.advice_count > 0) &&
        (!hasActions || c.open_actions > 0) &&
        (!needle || `${c.title} ${c.description ?? ""} ${c.ask ?? ""}`.toLowerCase().includes(needle) || (noteText.get(c.id) ?? "").includes(needle)),
    );
  }, [challenges, active, notes, showArchived, statuses, priorities, owners, hasAdvice, hasActions, q]);

  const onOpen = useCallback((id: string) => url.set({ challenge: id }), [url]);
  const open = challenges.find((c) => c.id === url.get("challenge"));
  const filtersActive = statuses.length || priorities.length || owners.length || hasAdvice || hasActions || q;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Challenges</h1>
          <p className="text-sm text-pm-muted">
            {isLoading ? "Loading…" : `${active.length} challenges · ${active.reduce((s, c) => s + c.advice_count, 0)} advice · ${active.reduce((s, c) => s + c.open_actions, 0)} open actions`}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-pm-navy px-2 py-1">
          <span className="pl-1 text-xs text-white/80">Viewing</span>
          <PresenceAvatars page="challenges" />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div role="group" aria-label="View" className="inline-flex rounded-lg border border-pm-border bg-pm-card p-0.5">
            {(
              [
                { id: "board", label: "Board", icon: KanbanSquare },
                { id: "list", label: "List", icon: List },
              ] as const
            ).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={view === id}
                onClick={() => url.set({ view: id === "list" ? "list" : null })}
                className={cn("inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium", view === id ? "bg-pm-navy text-white dark:bg-pm-teal" : "text-pm-muted hover:text-pm-text")}
              >
                <Icon className="h-4 w-4" /> {label}
              </button>
            ))}
          </div>
          <Button onClick={() => setRecap(true)} disabled={isLoading}>
            <FileText className="h-4 w-4" /> Recap
          </Button>
          {isAdmin && (
            <Button onClick={() => setManaging(true)} disabled={!categories.length}>
              <Settings2 className="h-4 w-4" /> Categories
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" role="search" aria-label="Filter challenges">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pm-muted" />
          <input type="search" aria-label="Search challenges and notes" placeholder="Search challenges and notes" value={q} onChange={(e) => url.set({ q: e.target.value })} className={cn(inputClass, "h-9 pl-8")} />
        </div>
        <MultiSelect label="Status" options={CHALLENGE_STATUSES.map((s) => ({ value: s.value, label: s.label }))} value={statuses} onChange={(v) => url.set({ status: v })} />
        <MultiSelect label="Priority" options={CHALLENGE_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} value={priorities} onChange={(v) => url.set({ priority: v })} />
        {ownerOptions.length > 0 && <MultiSelect label="Owner" options={ownerOptions.map((o) => ({ value: o, label: o }))} value={owners} onChange={(v) => url.set({ owner: v })} />}
        <ToggleChip pressed={hasAdvice} onClick={() => url.set({ advice: !hasAdvice })}>
          Has advice
        </ToggleChip>
        <ToggleChip pressed={hasActions} onClick={() => url.set({ actions: !hasActions })}>
          Has open actions
        </ToggleChip>
        <ToggleChip pressed={showArchived} onClick={() => url.set({ archived: !showArchived })}>
          Show archived
        </ToggleChip>
        {filtersActive ? (
          <button type="button" onClick={() => url.set({ status: null, priority: null, owner: null, advice: null, actions: null, q: null })} className="text-sm font-medium text-pm-link hover:underline">
            Clear filters
          </button>
        ) : null}
      </div>

      {error ? (
        <EmptyState title="Couldn't load challenges">{(error as Error).message}</EmptyState>
      ) : isLoading ? (
        <div className="flex gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-[300px]" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState title="No categories yet">{isAdmin ? "Add one with “Categories”." : "An admin can add categories."}</EmptyState>
      ) : view === "board" ? (
        <Board categories={categories} visible={visible} all={active} onOpen={onOpen} />
      ) : visible.length === 0 ? (
        <EmptyState title="No challenges match">Clear a filter or the search to see more.</EmptyState>
      ) : (
        <ListView rows={visible} categories={categories} onOpen={onOpen} />
      )}

      <ChallengeDrawer challenge={open} notes={notes} categories={categories} roadmapCodes={roadmapCodes} onClose={() => url.set({ challenge: null })} />
      {recap && <RecapDialog onClose={() => setRecap(false)} categories={categories} challenges={challenges} notes={notes} />}
      {managing && isAdmin && <CategoriesDialog onClose={() => setManaging(false)} categories={categories} />}
    </div>
  );
}
