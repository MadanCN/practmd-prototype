"use client";

import { useCallback, useMemo, useState } from "react";
import type { SortingState } from "@tanstack/react-table";
import { Download, ListChecks, Plus, Search } from "lucide-react";
import { AI_WORKSTREAM, CRITERIA, HORIZONS, HORIZON_LABEL, type Horizon } from "@/lib/product/constants";
import { compareByRank, type Weights } from "@/lib/product/score";
import { formatMonth } from "@/lib/product/dates";
import { toCsv, downloadText } from "@/lib/product/csv";
import type { TablesUpdate } from "@/lib/product/database.types";
import { Button, EmptyState, MultiSelect, Skeleton, ToggleChip, inputClass } from "@/components/product/ui/primitives";
import { useSession } from "@/components/product/SessionContext";
import { useUrlState } from "@/components/product/useUrlState";
import PrioritiesTable, { parseSort, serializeSort } from "./PrioritiesTable";
import WeightsPanel from "./WeightsPanel";
import ItemDrawer from "./ItemDrawer";
import AddItemSheet from "./AddItemSheet";
import { toWeights, useDeleteItem, useRankedItems, useRoadmapData, useRoadmapRealtime, useUpdateItem, type RankedItem } from "./useRoadmap";
import { useConfirm } from "@/components/product/ui/Confirm";

export default function PrioritiesView() {
  const { canEdit } = useSession();
  const url = useUrlState();
  const { items, weights, workstreams, isLoading, error } = useRoadmapData();
  useRoadmapRealtime();
  const update = useUpdateItem();
  const remove = useDeleteItem();
  const confirm = useConfirm();
  const [draftWeights, setDraftWeights] = useState<Weights | null>(null);
  const [adding, setAdding] = useState(false);
  const { ranked, archived, warnings } = useRankedItems(items, draftWeights);

  const wsFilter = url.getList("ws");
  const horizonFilter = url.getList("h") as Horizon[];
  const aiOnly = url.getFlag("ai");
  const mvpOnly = url.getFlag("mvp");
  const unscoredOnly = url.getFlag("unscored");
  const showArchived = url.getFlag("archived");
  const q = url.get("q");
  const sortParam = url.get("sort");
  const sorting = useMemo(() => parseSort(sortParam), [sortParam]);
  const openCode = url.get("item");

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const base = showArchived ? [...ranked, ...archived] : ranked;
    return base.filter(
      (i) =>
        (!wsFilter.length || wsFilter.includes(i.workstream)) &&
        (!horizonFilter.length || horizonFilter.includes(i.horizon)) &&
        (!aiOnly || i.workstream === AI_WORKSTREAM) &&
        (!mvpOnly || i.is_mvp) &&
        (!unscoredOnly || i.displayScore == null) &&
        (!needle || `${i.name} ${i.description ?? ""}`.toLowerCase().includes(needle)),
    );
  }, [ranked, archived, showArchived, wsFilter, horizonFilter, aiOnly, mvpOnly, unscoredOnly, q]);

  const onSave = useCallback((id: string, patch: TablesUpdate<"roadmap_items">) => update.mutate({ id, patch }), [update]);
  const onRestore = useCallback((id: string) => update.mutate({ id, patch: { archived_at: null } }), [update]);
  const onDelete = useCallback(
    async (item: RankedItem) => {
      const ok = await confirm({
        title: "Delete this item?",
        message: (
          <p>
            <strong>{item.name}</strong>{" "}and its change history will be permanently deleted. This can&apos;t be undone.
          </p>
        ),
        confirmLabel: "Delete item",
      });
      if (ok) remove.mutate(item);
    },
    [confirm, remove],
  );
  const onOpen = useCallback((code: string) => url.set({ item: code }), [url]);
  const onSortingChange = useCallback((s: SortingState) => url.set({ sort: serializeSort(s) }), [url]);

  function exportCsv() {
    const byWs = new Map(workstreams.map((w) => [w.code, w.name]));
    // Same order as on screen: the table sorts client-side, so re-apply its sort for the export.
    const ordered = sorting.length ? sortForExport(rows, sorting, workstreams.map((w) => w.code)) : rows;
    const csv = toCsv(
      ["Rank", "Code", "Item", "Workstream", ...CRITERIA.map((c) => c.label), "Adjustment", "Adjustment reason", "Score", "From", "To", "Horizon", "MVP", "Depends on", "Owner", "Archived"],
      ordered.map((i) => [
        i.rank,
        i.code,
        i.name,
        byWs.get(i.workstream) ?? i.workstream,
        ...CRITERIA.map((c) => i[c.key]),
        i.score_adjustment,
        i.adjustment_reason,
        i.displayScore,
        formatMonth(i.start_date),
        formatMonth(i.end_date),
        HORIZON_LABEL[i.horizon],
        i.is_mvp ? "Yes" : "",
        i.depends_on_codes.join(" "),
        i.owner,
        i.archived_at ? "Yes" : "",
      ]),
    );
    downloadText(`practmd-priorities-${new Date().toISOString().slice(0, 10)}.csv`, csv, "text/csv");
  }

  const openItem = items.find((i) => i.code === openCode);
  const filtersActive = wsFilter.length || horizonFilter.length || aiOnly || mvpOnly || unscoredOnly || q;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Priorities</h1>
          <p className="text-sm text-pm-muted">
            {isLoading ? "Loading…" : `${ranked.length} items, ${ranked.filter((i) => i.displayScore == null).length} not scored yet`}
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button onClick={exportCsv} disabled={!rows.length}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {canEdit && (
            <Button variant="primary" onClick={() => setAdding(true)} disabled={!workstreams.length}>
              <Plus className="h-4 w-4" /> Add item
            </Button>
          )}
        </div>
      </div>

      <WeightsPanel weights={toWeights(weights)} onDraft={setDraftWeights} />

      <div className="flex flex-wrap items-center gap-2" role="search" aria-label="Filter items">
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pm-muted" />
          <input
            type="search"
            aria-label="Search items"
            placeholder="Search name or description"
            value={q}
            onChange={(e) => url.set({ q: e.target.value })}
            className={`${inputClass} h-9 pl-8`}
          />
        </div>
        <MultiSelect label="Workstream" options={workstreams.map((w) => ({ value: w.code, label: w.name, swatch: w.color }))} value={wsFilter} onChange={(v) => url.set({ ws: v })} />
        <MultiSelect label="Horizon" options={HORIZONS.map((h) => ({ value: h.value, label: h.label }))} value={horizonFilter} onChange={(v) => url.set({ h: v })} />
        <ToggleChip pressed={aiOnly} onClick={() => url.set({ ai: !aiOnly })}>
          AI only
        </ToggleChip>
        <ToggleChip pressed={mvpOnly} onClick={() => url.set({ mvp: !mvpOnly })}>
          MVP only
        </ToggleChip>
        <ToggleChip pressed={unscoredOnly} onClick={() => url.set({ unscored: !unscoredOnly })}>
          Unscored only
        </ToggleChip>
        <ToggleChip pressed={showArchived} onClick={() => url.set({ archived: !showArchived })}>
          Show archived
        </ToggleChip>
        {(filtersActive || sorting.length > 0) && (
          <button
            type="button"
            onClick={() => url.set({ ws: null, h: null, ai: null, mvp: null, unscored: null, q: null, sort: null })}
            className="text-sm font-medium text-pm-link hover:underline"
          >
            Reset view
          </button>
        )}
      </div>

      {error ? (
        <EmptyState title="Couldn't load the roadmap">{(error as Error).message}</EmptyState>
      ) : isLoading ? (
        <div className="space-y-2 rounded-xl border border-pm-border bg-pm-card p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState icon={<ListChecks className="h-8 w-8" />} title={items.length ? "No items match these filters" : "No roadmap items yet"}>
          {items.length ? "Clear a filter or the search to see more." : canEdit ? "Use “Add item” to create the first one." : "An editor can add items."}
        </EmptyState>
      ) : (
        <PrioritiesTable
          rows={rows}
          workstreams={workstreams}
          warnings={warnings}
          canEdit={canEdit}
          sorting={sorting}
          onSortingChange={onSortingChange}
          onOpen={onOpen}
          onSave={onSave}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      )}

      {canEdit && <AddItemSheet open={adding} onClose={() => setAdding(false)} items={items} workstreams={workstreams} weights={toWeights(weights)} />}
      <ItemDrawer item={openItem} items={items} workstreams={workstreams} weights={toWeights(weights)} onClose={() => url.set({ item: null })} onOpenItem={onOpen} />
    </div>
  );
}

/** Same ordering the table applies, for the CSV export. */
function sortForExport(rows: RankedItem[], sorting: SortingState, wsOrder: string[]): RankedItem[] {
  const value = (i: RankedItem, id: string): number | string | undefined => {
    switch (id) {
      case "rank":
        return i.rank ?? undefined;
      case "name":
        return i.name;
      case "workstream":
        return wsOrder.indexOf(i.workstream);
      case "score":
        return i.displayScore ?? undefined;
      case "from":
        return i.start_date ?? undefined;
      case "to":
        return i.end_date ?? undefined;
      case "horizon":
        return HORIZONS.findIndex((h) => h.value === i.horizon);
      default:
        return (i[id as (typeof CRITERIA)[number]["key"]] as number | null) ?? undefined;
    }
  };
  return [...rows].sort((a, b) => {
    for (const s of sorting) {
      const va = value(a, s.id);
      const vb = value(b, s.id);
      if (va === undefined || vb === undefined) {
        if (va !== vb) return va === undefined ? 1 : -1;
        continue;
      }
      let cmp =
        s.id === "score"
          ? -compareByRank({ ...a, score: a.displayScore }, { ...b, score: b.displayScore })
          : typeof va === "number" && typeof vb === "number"
            ? va - vb
            : String(va).localeCompare(String(vb));
      if (s.desc) cmp = -cmp;
      if (cmp) return cmp;
    }
    return 0;
  });
}
