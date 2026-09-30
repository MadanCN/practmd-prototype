"use client";

import { createContext, memo, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import {
  createColumnHelper,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, ArchiveRestore } from "lucide-react";
import { CRITERIA, HORIZONS, type Horizon } from "@/lib/product/constants";
import { dateToMonth, formatMonth, monthToFrom, monthToTo } from "@/lib/product/dates";
import { compareByRank } from "@/lib/product/score";
import type { Workstream } from "@/lib/product/data/roadmap";
import type { TablesUpdate } from "@/lib/product/database.types";
import { useFlashing } from "@/lib/product/flash";
import { ColorChip } from "@/components/product/ui/primitives";
import { useToast } from "@/components/product/ui/Toast";
import { DependencyWarning, HorizonChip, ItemTags, ScoreBar } from "./bits";
import type { RankedItem } from "./useRoadmap";
import { cn } from "@/lib/utils";

const features = tableFeatures({ rowSortingFeature, sortedRowModel: createSortedRowModel() });
type F = typeof features;
const helper = createColumnHelper<F, RankedItem>();

const ROW_HEIGHT = 48;
const VIRTUALIZE_ABOVE = 200;

const cellSelect =
  "w-full cursor-pointer appearance-none rounded-md border border-transparent bg-transparent px-1.5 py-1 text-center text-sm tabular-nums hover:border-pm-border focus:border-pm-accent focus:outline-none focus:ring-2 focus:ring-pm-accent/25";

export function parseSort(s: string): SortingState {
  return s
    .split(",")
    .filter(Boolean)
    .map((part) => {
      const [id, dir] = part.split(".");
      return { id, desc: dir !== "asc" };
    });
}
export function serializeSort(s: SortingState): string {
  return s.map((x) => `${x.id}.${x.desc ? "desc" : "asc"}`).join(",");
}

const num = (a: Row<F, RankedItem>, b: Row<F, RankedItem>, id: string) => (a.getValue<number>(id) ?? 0) - (b.getValue<number>(id) ?? 0);
const text = (a: Row<F, RankedItem>, b: Row<F, RankedItem>, id: string) => String(a.getValue(id) ?? "").localeCompare(String(b.getValue(id) ?? ""));
// Ascending comparator; the table reverses it for descending, which gives the default rank order.
const byScore = (a: Row<F, RankedItem>, b: Row<F, RankedItem>) =>
  -compareByRank({ ...a.original, score: a.original.displayScore }, { ...b.original, score: b.original.displayScore });

type Save = (id: string, patch: TablesUpdate<"roadmap_items">) => void;

// Warnings change on every re-rank; reading them from context keeps the column definitions stable.
const WarningsContext = createContext<Map<string, string[]>>(new Map());
function RowWarning({ code }: { code: string }) {
  return <DependencyWarning names={useContext(WarningsContext).get(code)} />;
}

function RatingCell({ item, field, canEdit, save }: { item: RankedItem; field: (typeof CRITERIA)[number]; canEdit: boolean; save: Save }) {
  const value = item[field.key];
  if (!canEdit) return <span className="block text-center tabular-nums">{value ?? <span className="text-pm-muted">—</span>}</span>;
  return (
    <select
      aria-label={`${field.label} for ${item.name}`}
      className={cellSelect}
      value={value ?? ""}
      onChange={(e) => save(item.id, { [field.key]: e.target.value ? Number(e.target.value) : null })}
    >
      <option value="">—</option>
      {[1, 2, 3, 4, 5].map((n) => (
        <option key={n} value={n}>
          {n}
        </option>
      ))}
    </select>
  );
}

function MonthCell({ item, edge, canEdit, save }: { item: RankedItem; edge: "from" | "to"; canEdit: boolean; save: Save }) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const value = edge === "from" ? item.start_date : item.end_date;
  const label = `${edge === "from" ? "From" : "To"} month for ${item.name}`;
  const shown = formatMonth(value) || <span className="text-pm-muted">—</span>;
  if (!canEdit) return <span className="whitespace-nowrap text-sm">{shown}</span>;
  if (!editing) {
    return (
      <button
        type="button"
        aria-label={`${label}: ${formatMonth(value) || "not set"}. Click to change.`}
        onClick={() => setEditing(true)}
        className="w-[5.25rem] whitespace-nowrap rounded-md border border-transparent px-1.5 py-1 text-left text-sm hover:border-pm-border focus-visible:outline-2 focus-visible:outline-pm-accent"
      >
        {shown}
      </button>
    );
  }
  return (
    <input
      type="month"
      autoFocus
      aria-label={label}
      defaultValue={dateToMonth(value)}
      onBlur={() => setEditing(false)}
      onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
      onChange={(e) => {
        const m = e.target.value;
        const next = m ? (edge === "from" ? monthToFrom(m) : monthToTo(m)) : null;
        const start = edge === "from" ? next : item.start_date;
        const end = edge === "to" ? next : item.end_date;
        if (start && end && end < start) {
          toast("To must be on or after From.", "error");
          return;
        }
        save(item.id, edge === "from" ? { start_date: next } : { end_date: next });
      }}
      className="w-[9rem] rounded-md border border-pm-accent bg-pm-card px-1 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-pm-accent/25"
    />
  );
}

function HorizonCell({ item, canEdit, save }: { item: RankedItem; canEdit: boolean; save: Save }) {
  if (!canEdit) return <HorizonChip horizon={item.horizon} />;
  return (
    <select
      aria-label={`Horizon for ${item.name}`}
      value={item.horizon}
      onChange={(e) => save(item.id, { horizon: e.target.value as Horizon })}
      className={cn(cellSelect, "text-left", HORIZONS.find((h) => h.value === item.horizon)?.chip, "rounded-full px-2.5 py-0.5 text-xs font-semibold")}
    >
      {HORIZONS.map((h) => (
        <option key={h.value} value={h.value}>
          {h.label}
        </option>
      ))}
    </select>
  );
}

const TableRow = memo(function TableRow({ row, cells }: { row: Row<F, RankedItem>; cells: ReactNode[] }) {
  const flashing = useFlashing(row.original.id);
  return (
    <tr
      style={{ height: ROW_HEIGHT }}
      className={cn(
        "border-b border-pm-border transition-colors duration-700 last:border-0",
        flashing ? "bg-pm-aqua/25" : "hover:bg-pm-subtle/60",
        row.original.archived_at && "opacity-70",
      )}
    >
      {cells}
    </tr>
  );
});

export default function PrioritiesTable({
  rows,
  workstreams,
  warnings,
  canEdit,
  sorting,
  onSortingChange,
  onOpen,
  onSave,
  onRestore,
}: {
  rows: RankedItem[];
  workstreams: Workstream[];
  warnings: Map<string, string[]>;
  canEdit: boolean;
  sorting: SortingState;
  onSortingChange: (s: SortingState) => void;
  onOpen: (code: string) => void;
  onSave: Save;
  onRestore: (id: string) => void;
}) {
  const wsByCode = useMemo(() => new Map(workstreams.map((w) => [w.code, w])), [workstreams]);

  const columns = useMemo(
    () =>
      helper.columns([
        helper.accessor((r) => r.rank ?? undefined, {
          id: "rank",
          header: "#",
          sortFn: num,
          sortUndefined: "last",
          cell: (c) => <span className="block text-center text-sm font-semibold tabular-nums text-pm-muted">{c.row.original.rank ?? "—"}</span>,
        }),
        helper.accessor("name", {
          id: "name",
          header: "Item",
          sortFn: text,
          cell: (c) => {
            const i = c.row.original;
            return (
              <div className="flex min-w-[220px] max-w-[330px] items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpen(i.code)}
                  className="truncate text-left text-sm font-medium text-pm-text hover:text-pm-link hover:underline focus-visible:outline-2 focus-visible:outline-pm-accent"
                  title={i.description ?? i.name}
                >
                  {i.name}
                </button>
                <ItemTags isMvp={i.is_mvp} workstream={i.workstream} />
                <RowWarning code={i.code} />
                {i.archived_at && canEdit && (
                  <button type="button" onClick={() => onRestore(i.id)} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-pm-link hover:underline">
                    <ArchiveRestore className="h-3.5 w-3.5" /> Restore
                  </button>
                )}
              </div>
            );
          },
        }),
        helper.accessor((r) => wsByCode.get(r.workstream)?.sort_order ?? 999, {
          id: "workstream",
          header: "Workstream",
          sortFn: num,
          cell: (c) => {
            const ws = wsByCode.get(c.row.original.workstream);
            return ws ? <ColorChip color={ws.color} label={ws.name} className="max-w-[150px]" /> : c.row.original.workstream;
          },
        }),
        ...CRITERIA.map((field) =>
          helper.accessor((r) => r[field.key] ?? undefined, {
            id: field.key,
            header: field.short,
            sortFn: num,
            sortUndefined: "last",
            sortDescFirst: true,
            cell: (c) => <RatingCell item={c.row.original} field={field} canEdit={canEdit && !c.row.original.archived_at} save={onSave} />,
          }),
        ),
        helper.accessor((r) => r.displayScore ?? undefined, {
          id: "score",
          header: "Score",
          sortFn: byScore,
          sortUndefined: "last",
          sortDescFirst: true,
          cell: (c) => {
            const i = c.row.original;
            return i.archived_at ? <span className="text-xs text-pm-muted">Archived</span> : <ScoreBar score={i.displayScore} adjustment={i.score_adjustment} reason={i.adjustment_reason} />;
          },
        }),
        helper.accessor((r) => r.start_date ?? undefined, {
          id: "from",
          header: "From",
          sortFn: text,
          sortUndefined: "last",
          cell: (c) => <MonthCell item={c.row.original} edge="from" canEdit={canEdit && !c.row.original.archived_at} save={onSave} />,
        }),
        helper.accessor((r) => r.end_date ?? undefined, {
          id: "to",
          header: "To",
          sortFn: text,
          sortUndefined: "last",
          cell: (c) => <MonthCell item={c.row.original} edge="to" canEdit={canEdit && !c.row.original.archived_at} save={onSave} />,
        }),
        helper.accessor((r) => HORIZONS.findIndex((h) => h.value === r.horizon), {
          id: "horizon",
          header: "Horizon",
          sortFn: num,
          cell: (c) => <HorizonCell item={c.row.original} canEdit={canEdit && !c.row.original.archived_at} save={onSave} />,
        }),
      ]),
    [wsByCode, canEdit, onOpen, onSave, onRestore],
  );

  const table = useTable({
    features,
    columns,
    data: rows,
    getRowId: (r) => r.id,
    enableMultiSort: true,
    enableSortingRemoval: true,
    state: { sorting },
    onSortingChange: (u) => onSortingChange(typeof u === "function" ? u(sorting) : u),
  });

  const modelRows = table.getRowModel().rows;
  const scroller = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const virtual = modelRows.length > VIRTUALIZE_ABOVE;
  const viewport = 720;
  const start = virtual ? Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - 10) : 0;
  const end = virtual ? Math.min(modelRows.length, Math.ceil((scrollTop + viewport) / ROW_HEIGHT) + 10) : modelRows.length;
  const visible = modelRows.slice(start, end);

  return (
    <WarningsContext.Provider value={warnings}>
    <div
      ref={scroller}
      onScroll={virtual ? (e) => setScrollTop(e.currentTarget.scrollTop) : undefined}
      className={cn("overflow-x-auto rounded-xl border border-pm-border bg-pm-card", virtual && "overflow-y-auto")}
      style={virtual ? { maxHeight: viewport } : undefined}
    >
      <table className="w-full min-w-[1080px] border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-pm-card">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-b border-pm-border">
              {group.headers.map((header) => {
                const sorted = header.column.getIsSorted();
                const index = sorting.length > 1 ? header.column.getSortIndex() : -1;
                const centered = ["rank", ...CRITERIA.map((c) => c.key)].includes(header.column.id);
                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={sorted === "asc" ? "ascending" : sorted === "desc" ? "descending" : "none"}
                    className={cn("whitespace-nowrap px-2 py-2 text-[11px] font-semibold uppercase tracking-wide text-pm-muted", centered ? "text-center" : "text-left")}
                  >
                    <button
                      type="button"
                      onClick={header.column.getToggleSortingHandler()}
                      title="Click to sort. Shift-click to add a secondary sort."
                      className="inline-flex items-center gap-1 rounded hover:text-pm-text focus-visible:outline-2 focus-visible:outline-pm-accent"
                    >
                      <table.FlexRender header={header} />
                      {sorted === "asc" ? <ArrowUp className="h-3 w-3" /> : sorted === "desc" ? <ArrowDown className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                      {index >= 0 && sorted && <span className="text-[10px] text-pm-accent">{index + 1}</span>}
                    </button>
                  </th>
                );
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {virtual && start > 0 && <tr aria-hidden style={{ height: start * ROW_HEIGHT }} />}
          {visible.map((row) => (
            <TableRow
              key={row.id}
              row={row}
              cells={row.getAllCells().map((cell) => (
                <td key={cell.id} className="px-2 py-1 align-middle">
                  <table.FlexRender cell={cell} />
                </td>
              ))}
            />
          ))}
          {virtual && end < modelRows.length && <tr aria-hidden style={{ height: (modelRows.length - end) * ROW_HEIGHT }} />}
        </tbody>
      </table>
    </div>
    </WarningsContext.Provider>
  );
}
