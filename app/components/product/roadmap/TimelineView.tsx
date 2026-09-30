"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarRange, CalendarX2, Diamond, Flag, GitBranch, X } from "lucide-react";
import { contrastWithWhite, HORIZONS, type Horizon } from "@/lib/product/constants";
import {
  addMonths,
  currentMonth,
  dateToMonth,
  differenceInCalendarMonths,
  format,
  formatMonth,
  monthIndex,
  monthToFrom,
  shiftMonths,
  startOfMonth,
  toISODate,
  endOfMonth,
} from "@/lib/product/dates";
import { roadmapKeys, saveMvpLine, type MvpLine, type Workstream } from "@/lib/product/data/roadmap";
import { getSupabaseBrowserClient } from "@/lib/product/supabase/client";
import { Button, Dialog, EmptyState, Field, Skeleton, ToggleChip, inputClass } from "@/components/product/ui/primitives";
import { useToast } from "@/components/product/ui/Toast";
import { useSession } from "@/components/product/SessionContext";
import { useUrlState } from "@/components/product/useUrlState";
import { ScoreBadge } from "./bits";
import ItemDrawer from "./ItemDrawer";
import { toWeights, useClearDates, useRankedItems, useRoadmapData, useRoadmapRealtime, useUpdateItem, type RankedItem } from "./useRoadmap";
import { useConfirm } from "@/components/product/ui/Confirm";
import { cn } from "@/lib/utils";

const LABEL_W = 210;
const HEADER_H = 44;
const LANE_H = 30;
const ROW_H = 34;
const EMPTY_ROW_H = 28;
const MONTH_W = { month: 64, quarter: 26 } as const;
type Zoom = keyof typeof MONTH_W;

type DragKind = "move" | "start" | "end" | "tray";
interface DragData {
  kind: DragKind;
  item: RankedItem;
}

/** Arrow keys move a dragged bar by exactly one month (and a row vertically). */
function monthStepGetter(monthW: number): KeyboardCoordinateGetter {
  return (event, { currentCoordinates }) => {
    switch (event.code) {
      case "ArrowRight":
        return { ...currentCoordinates, x: currentCoordinates.x + monthW };
      case "ArrowLeft":
        return { ...currentCoordinates, x: currentCoordinates.x - monthW };
      case "ArrowDown":
        return { ...currentCoordinates, y: currentCoordinates.y + ROW_H };
      case "ArrowUp":
        return { ...currentCoordinates, y: currentCoordinates.y - ROW_H };
    }
    return undefined;
  };
}

interface Lane {
  ws: Workstream;
  items: RankedItem[];
  top: number;
  height: number;
}

function Bar({
  item,
  ws,
  startIdx,
  endIdx,
  monthW,
  canEdit,
  onOpen,
}: {
  item: RankedItem;
  ws: Workstream;
  startIdx: number;
  endIdx: number;
  monthW: number;
  canEdit: boolean;
  onOpen: (code: string) => void;
}) {
  const { attributes: moveAttrs, listeners: moveListeners, setNodeRef: setMoveRef, isDragging: moving } = useDraggable({
    id: `move:${item.id}`,
    data: { kind: "move", item } satisfies DragData,
    disabled: !canEdit,
  });
  const { attributes: startAttrs, listeners: startListeners, setNodeRef: setStartRef, isDragging: resizingStart } = useDraggable({
    id: `start:${item.id}`,
    data: { kind: "start", item } satisfies DragData,
    disabled: !canEdit,
  });
  const { attributes: endAttrs, listeners: endListeners, setNodeRef: setEndRef, isDragging: resizingEnd } = useDraggable({
    id: `end:${item.id}`,
    data: { kind: "end", item } satisfies DragData,
    disabled: !canEdit,
  });
  const width = (endIdx - startIdx + 1) * monthW;
  const nameInside = width >= 130;
  const textColor = contrastWithWhite(ws.color) >= 4.5 ? "text-white" : "text-slate-950";
  const label = `${item.name}. ${ws.name}. ${formatMonth(item.start_date)} to ${formatMonth(item.end_date)}. Score ${item.displayScore ?? "not scored"}.${item.is_mvp ? " MVP." : ""}`;
  const dragging = moving || resizingStart || resizingEnd;

  return (
    <div className="relative flex items-center" style={{ gridColumn: `${startIdx + 1} / ${endIdx + 2}`, height: ROW_H }}>
      <div
        ref={setMoveRef}
        {...moveAttrs}
        {...moveListeners}
        role="button"
        aria-label={`${label}${canEdit ? " Press space to move by month with the arrow keys, enter to open." : ""}`}
        title={`${item.name}\n${formatMonth(item.start_date)} – ${formatMonth(item.end_date)}\nScore: ${item.displayScore ?? "not scored"}`}
        onClick={() => onOpen(item.code)}
        onKeyDown={(e) => {
          moveListeners?.onKeyDown?.(e);
          if (e.key === "Enter" && !e.defaultPrevented) onOpen(item.code);
        }}
        className={cn(
          "relative flex h-6 w-full items-center gap-1 overflow-hidden rounded-md px-2 text-xs font-medium shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pm-accent",
          textColor,
          canEdit ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
          dragging && "ring-2 ring-pm-aqua",
        )}
        style={{ backgroundColor: ws.color }}
      >
        {item.is_mvp && <Diamond className="h-3 w-3 shrink-0 fill-current" aria-hidden />}
        {nameInside && <span className="truncate">{item.name}</span>}
      </div>
      {!nameInside && (
        <span className="pointer-events-none absolute left-full ml-1.5 flex items-center gap-1 whitespace-nowrap text-xs font-medium text-pm-text">
          {item.name}
        </span>
      )}
      {canEdit && (
        <>
          <span
            ref={setStartRef}
            {...startAttrs}
            {...startListeners}
            role="button"
            aria-label={`Change start month of ${item.name}`}
            className="absolute left-0 top-1/2 h-6 w-2 -translate-y-1/2 cursor-ew-resize rounded-l-md hover:bg-black/25 focus-visible:bg-black/30 focus-visible:outline-none"
          />
          <span
            ref={setEndRef}
            {...endAttrs}
            {...endListeners}
            role="button"
            aria-label={`Change end month of ${item.name}`}
            className="absolute right-0 top-1/2 h-6 w-2 -translate-y-1/2 cursor-ew-resize rounded-r-md hover:bg-black/25 focus-visible:bg-black/30 focus-visible:outline-none"
          />
        </>
      )}
    </div>
  );
}

function TrayCard({ item, canEdit, onOpen }: { item: RankedItem; canEdit: boolean; onOpen: (code: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `tray:${item.id}`, data: { kind: "tray", item } satisfies DragData, disabled: !canEdit });
  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      aria-label={`${item.name}, unscheduled.${canEdit ? " Drag onto the timeline to schedule, or press enter to open." : ""}`}
      onClick={() => onOpen(item.code)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === "Enter" && !e.defaultPrevented) onOpen(item.code);
      }}
      className={cn(
        "flex items-center gap-2 rounded-md border border-pm-border bg-pm-card px-2 py-1.5 text-xs shadow-sm hover:border-pm-accent focus-visible:outline-2 focus-visible:outline-pm-accent",
        canEdit ? "cursor-grab" : "cursor-pointer",
        isDragging && "opacity-40",
      )}
    >
      <span className="flex-1 leading-snug">{item.name}</span>
      <ScoreBadge score={item.displayScore} />
    </li>
  );
}

/** The droppable area over the month grid (tray drops), which also hosts markers and dependency lines. */
function GridDropZone({ width, height, highlight, children }: { width: number; height: number; highlight: boolean; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: "timeline" });
  return (
    <div
      ref={setNodeRef}
      aria-hidden
      className={cn("pointer-events-none absolute top-0", isOver && highlight && "bg-pm-accent/10 ring-2 ring-inset ring-pm-accent")}
      style={{ left: LABEL_W, width, height }}
    >
      {children}
    </div>
  );
}

function Track({ children, monthCount, monthW }: { children: React.ReactNode; monthCount: number; monthW: number }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${monthCount}, ${monthW}px)`,
        backgroundImage: `repeating-linear-gradient(to right, transparent 0, transparent ${monthW - 1}px, var(--pm-border) ${monthW - 1}px, var(--pm-border) ${monthW}px)`,
      }}
    >
      {children}
    </div>
  );
}

function MvpLineDialog({ line, onClose, onRemove }: { line: MvpLine; onClose: () => void; onRemove: () => void }) {
  const [label, setLabel] = useState(line.label);
  const [month, setMonth] = useState(dateToMonth(line.date));
  const qc = useQueryClient();
  const toast = useToast();
  async function save() {
    try {
      await saveMvpLine(getSupabaseBrowserClient(), { label: label.trim() || "MVP", date: month ? monthToFrom(month) : null });
      await qc.invalidateQueries({ queryKey: roadmapKeys.mvpLine });
      toast("MVP line saved");
      onClose();
    } catch (e) {
      toast(`Couldn't save: ${(e as Error).message}`, "error");
    }
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title="MVP line"
      footer={
        <>
          {line.date && (
            <Button variant="ghost" className="mr-auto text-pm-warning hover:bg-pm-warning/10" onClick={onRemove}>
              Remove line
            </Button>
          )}
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={save}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label="Label" htmlFor="mvp-label">
          <input id="mvp-label" data-autofocus className={inputClass} value={label} onChange={(e) => setLabel(e.target.value)} />
        </Field>
        <Field label="Month" htmlFor="mvp-month" hint="Leave empty to hide the line">
          <input id="mvp-month" type="month" className={inputClass} value={month} onChange={(e) => setMonth(e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
}

export default function TimelineView() {
  const { canEdit, isAdmin } = useSession();
  const url = useUrlState();
  const { items, weights, workstreams, mvpLine, isLoading, error } = useRoadmapData();
  useRoadmapRealtime();
  const update = useUpdateItem();
  const clear = useClearDates();
  const confirm = useConfirm();
  const qc = useQueryClient();
  const toast = useToast();
  const { ranked } = useRankedItems(items, null);

  const [zoom, setZoom] = useState<Zoom>("month");
  const [rangeFrom, setRangeFrom] = useState(() => format(currentMonth(), "yyyy-MM"));
  const [rangeTo, setRangeTo] = useState(() => format(addMonths(currentMonth(), 18), "yyyy-MM"));
  const [hiddenWs, setHiddenWs] = useState<string[]>([]);
  const [horizons, setHorizons] = useState<Horizon[]>([]);
  const [showDeps, setShowDeps] = useState(false);
  const [editingMvp, setEditingMvp] = useState(false);
  const [drag, setDrag] = useState<{ kind: DragKind; item: RankedItem; delta: number } | null>(null);
  const monthsRef = useRef<HTMLDivElement>(null);

  const monthW = MONTH_W[zoom];
  const rangeStart = useMemo(() => startOfMonth(new Date(`${rangeFrom}-01T00:00:00`)), [rangeFrom]);
  const monthCount = Math.min(60, Math.max(1, differenceInCalendarMonths(new Date(`${rangeTo}-01T00:00:00`), rangeStart) + 1));
  const months = useMemo(() => Array.from({ length: monthCount }, (_, i) => addMonths(rangeStart, i)), [rangeStart, monthCount]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: monthStepGetter(monthW) }),
  );

  const onOpen = useCallback((code: string) => url.set({ item: code }), [url]);

  async function removeFromTimeline(item: RankedItem) {
    const ok = await confirm({
      title: "Remove from the timeline?",
      message: (
        <p>
          <strong>{item.name}</strong>{" "}loses its From and To dates and goes back to the Unscheduled tray. The item itself is not deleted.
        </p>
      ),
      confirmLabel: "Remove from timeline",
    });
    if (ok) clear.mutate([item.id]);
  }

  async function removeMvpLine() {
    if (!mvpLine) return;
    const ok = await confirm({
      title: "Remove the MVP line?",
      message: <p>The “{mvpLine.label}” marker will no longer show on the timeline. You can set it again at any time.</p>,
      confirmLabel: "Remove line",
    });
    if (!ok) return;
    try {
      await saveMvpLine(getSupabaseBrowserClient(), { label: mvpLine.label, date: null });
      await qc.invalidateQueries({ queryKey: roadmapKeys.mvpLine });
      toast("MVP line removed");
      setEditingMvp(false);
    } catch (e) {
      toast(`Couldn't remove the MVP line: ${(e as Error).message}`, "error");
    }
  }

  const visible = ranked.filter((i) => !hiddenWs.includes(i.workstream) && (!horizons.length || horizons.includes(i.horizon)));
  const scheduled = visible.filter((i) => i.start_date && i.end_date);
  const unscheduled = visible.filter((i) => !i.start_date || !i.end_date);

  /** Dates for a bar, including the live drag preview (snapped to months). */
  const datesFor = (i: RankedItem): { start: string; end: string } => {
    let start = i.start_date!;
    let end = i.end_date!;
    if (drag && drag.item.id === i.id && drag.delta) {
      if (drag.kind === "move") {
        start = shiftMonths(start, drag.delta, "from");
        end = shiftMonths(end, drag.delta, "to");
      } else if (drag.kind === "start") {
        start = shiftMonths(start, drag.delta, "from");
        if (start > end) start = toISODate(startOfMonth(new Date(`${end}T00:00:00`)));
      } else if (drag.kind === "end") {
        end = shiftMonths(end, drag.delta, "to");
        if (end < start) end = toISODate(endOfMonth(new Date(`${start}T00:00:00`)));
      }
    }
    return { start, end };
  };

  const lanes: Lane[] = [];
  let top = 0;
  for (const ws of workstreams) {
    if (hiddenWs.includes(ws.code)) continue;
    const laneItems = scheduled.filter((i) => i.workstream === ws.code).sort((a, b) => (a.start_date! < b.start_date! ? -1 : a.start_date! > b.start_date! ? 1 : 0));
    const height = LANE_H + (laneItems.length ? laneItems.length * ROW_H : EMPTY_ROW_H);
    lanes.push({ ws, items: laneItems, top, height });
    top += height;
  }
  const bodyHeight = top;

  // Row centre y for dependency lines.
  const rowY = new Map<string, number>();
  for (const lane of lanes) lane.items.forEach((i, idx) => rowY.set(i.code, lane.top + LANE_H + idx * ROW_H + ROW_H / 2));
  const byCode = new Map(scheduled.map((i) => [i.code, i]));

  const today = new Date();
  const todayX = monthIndex(rangeStart, toISODate(today)) * monthW + ((today.getDate() - 1) / endOfMonth(today).getDate()) * monthW;
  const mvpX = mvpLine?.date ? monthIndex(rangeStart, mvpLine.date) * monthW : null;
  const trackWidth = monthCount * monthW;

  function onDragStart(e: DragStartEvent) {
    const d = e.active.data.current as DragData;
    setDrag({ kind: d.kind, item: d.item, delta: 0 });
  }
  function onDragMove(e: DragMoveEvent) {
    const d = e.active.data.current as DragData;
    if (d.kind === "tray") return;
    const delta = Math.round(e.delta.x / monthW);
    setDrag((prev) => (prev && prev.delta !== delta ? { ...prev, delta } : prev));
  }
  function onDragEnd(e: DragEndEvent) {
    const d = e.active.data.current as DragData;
    const current = drag;
    setDrag(null);
    if (d.kind === "tray") {
      if (e.over?.id !== "timeline" || !monthsRef.current) return;
      const pointer = e.activatorEvent as PointerEvent;
      const x = typeof pointer.clientX === "number" ? pointer.clientX + e.delta.x : (e.active.rect.current.translated?.left ?? 0) + 8;
      const idx = Math.floor((x - monthsRef.current.getBoundingClientRect().left) / monthW);
      if (idx < 0 || idx >= monthCount) return;
      const from = toISODate(months[idx]);
      update.mutate({ id: d.item.id, patch: { start_date: from, end_date: toISODate(endOfMonth(months[idx])) } });
      return;
    }
    if (!current || !current.delta) return;
    const { start, end } = datesFor(d.item);
    // datesFor reads `drag`, which is still the pre-reset value in this closure.
    update.mutate({ id: d.item.id, patch: { start_date: start, end_date: end }, quiet: false });
  }

  // Header groups (years in month zoom, quarters in quarter zoom).
  const groups: { label: string; span: number }[] = [];
  for (const m of months) {
    const label = zoom === "month" ? format(m, "yyyy") : `Q${Math.floor(m.getMonth() / 3) + 1} ${format(m, "yyyy")}`;
    const last = groups[groups.length - 1];
    if (last?.label === label) last.span++;
    else groups.push({ label, span: 1 });
  }

  const openItem = items.find((i) => i.code === url.get("item"));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timeline</h1>
          <p className="text-sm text-pm-muted">{canEdit ? "Drag bars to move them, drag their edges to resize, or drag items from the tray to schedule them." : "Scheduled work by workstream."}</p>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Zoom" className="inline-flex rounded-lg border border-pm-border bg-pm-card p-0.5">
            {(["month", "quarter"] as const).map((z) => (
              <button
                key={z}
                type="button"
                aria-pressed={zoom === z}
                onClick={() => setZoom(z)}
                className={cn("rounded-md px-3 py-1.5 text-sm font-medium capitalize", zoom === z ? "bg-pm-navy text-white dark:bg-pm-teal" : "text-pm-muted hover:text-pm-text")}
              >
                {z}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-sm">
            <CalendarRange className="h-4 w-4 text-pm-muted" />
            <span className="sr-only">Range from</span>
            <input type="month" value={rangeFrom} onChange={(e) => e.target.value && setRangeFrom(e.target.value)} className={cn(inputClass, "h-9 w-[10.75rem]")} />
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <span className="text-pm-muted">to</span>
            <input type="month" value={rangeTo} min={rangeFrom} onChange={(e) => e.target.value && setRangeTo(e.target.value)} className={cn(inputClass, "h-9 w-[10.75rem]")} />
          </label>
          <ToggleChip pressed={showDeps} onClick={() => setShowDeps((s) => !s)}>
            <GitBranch className="h-3.5 w-3.5" /> Dependencies
          </ToggleChip>
          {isAdmin && mvpLine && (
            <div className="inline-flex">
              <Button onClick={() => setEditingMvp(true)} className={cn(mvpLine.date && "rounded-r-none")}>
                <Flag className="h-4 w-4" /> MVP line
              </Button>
              {mvpLine.date && (
                <Button onClick={removeMvpLine} aria-label="Remove MVP line" title="Remove MVP line" className="-ml-px rounded-l-none px-2 text-pm-warning">
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
          {canEdit && scheduled.length > 0 && (
            <Button
              className="text-pm-warning"
              onClick={async () => {
                const ok = await confirm({
                  title: "Clear the timeline?",
                  message: (
                    <p>
                      {scheduled.length === 1 ? "1 item" : `${scheduled.length} items`} shown on the timeline will lose their From and To dates and go back to the
                      Unscheduled tray. Hidden workstreams and horizons are not affected, and no items are deleted.
                    </p>
                  ),
                  confirmLabel: "Clear timeline",
                });
                if (ok) clear.mutate(scheduled.map((i) => i.id));
              }}
            >
              <CalendarX2 className="h-4 w-4" /> Clear timeline
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" aria-label="Filter by horizon" role="group">
        <span className="text-xs font-semibold uppercase tracking-wide text-pm-muted">Horizon</span>
        {HORIZONS.map((h) => (
          <ToggleChip key={h.value} pressed={horizons.includes(h.value)} onClick={() => setHorizons((hs) => (hs.includes(h.value) ? hs.filter((x) => x !== h.value) : [...hs, h.value]))}>
            {h.label}
          </ToggleChip>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Legend: click a workstream to show or hide it">
        <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-pm-muted">Legend</span>
        {workstreams.map((ws) => {
          const shown = !hiddenWs.includes(ws.code);
          return (
            <button
              key={ws.code}
              type="button"
              aria-pressed={shown}
              onClick={() => setHiddenWs((h) => (shown ? [...h, ws.code] : h.filter((c) => c !== ws.code)))}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-opacity focus-visible:outline-2 focus-visible:outline-pm-accent",
                shown ? "border-pm-border bg-pm-card" : "border-dashed border-pm-border bg-transparent text-pm-muted line-through opacity-70",
              )}
            >
              <span aria-hidden className="h-3 w-3 rounded-sm" style={{ backgroundColor: ws.color }} />
              {ws.name}
            </button>
          );
        })}
      </div>

      {error ? (
        <EmptyState title="Couldn't load the timeline">{(error as Error).message}</EmptyState>
      ) : isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragMove={onDragMove} onDragEnd={onDragEnd} onDragCancel={() => setDrag(null)}>
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_250px]">
            <div className="min-w-0 overflow-x-auto rounded-xl border border-pm-border bg-pm-card">
              <div style={{ width: LABEL_W + trackWidth }} className="relative">
                {/* header */}
                <div className="sticky top-0 z-20 flex border-b border-pm-border bg-pm-card" style={{ height: HEADER_H }}>
                  <div className="sticky left-0 z-10 flex shrink-0 items-end border-r border-pm-border bg-pm-card px-3 pb-1.5 text-xs font-semibold uppercase tracking-wide text-pm-muted" style={{ width: LABEL_W }}>
                    Workstream
                  </div>
                  <div ref={monthsRef} className="flex flex-col" style={{ width: trackWidth }}>
                    <div className="grid h-1/2 text-[11px] font-semibold text-pm-muted" style={{ gridTemplateColumns: `repeat(${monthCount}, ${monthW}px)` }}>
                      {groups.map((g, i) => (
                        <div key={i} className="truncate border-l border-pm-border px-1.5 pt-1" style={{ gridColumn: `span ${g.span}` }}>
                          {g.label}
                        </div>
                      ))}
                    </div>
                    <div className="grid h-1/2 text-[11px] text-pm-muted" style={{ gridTemplateColumns: `repeat(${monthCount}, ${monthW}px)` }}>
                      {months.map((m) => (
                        <div key={m.toISOString()} className="border-l border-pm-border px-1 pt-0.5 text-center">
                          {zoom === "month" ? format(m, "MMM") : format(m, "MMMMM")}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* body */}
                <div className="relative">
                  {lanes.length === 0 && <p className="p-6 text-sm text-pm-muted">All workstreams are hidden. Click one in the legend to show it.</p>}
                  {lanes.map((lane) => (
                    <section key={lane.ws.code} aria-label={`${lane.ws.name} swimlane`}>
                      <div className="flex border-b border-pm-border bg-pm-subtle/60" style={{ height: LANE_H }}>
                        <div className="sticky left-0 z-10 flex shrink-0 items-center gap-2 border-r border-pm-border bg-pm-subtle px-3 text-xs font-semibold" style={{ width: LABEL_W }}>
                          <span aria-hidden className="h-3 w-3 shrink-0 rounded-sm" style={{ backgroundColor: lane.ws.color }} />
                          <span className="truncate">{lane.ws.name}</span>
                          <span className="ml-auto font-normal text-pm-muted">{lane.items.length}</span>
                        </div>
                      </div>
                      {lane.items.length === 0 ? (
                        <div className="flex border-b border-pm-border" style={{ height: EMPTY_ROW_H }}>
                          <div className="sticky left-0 shrink-0 border-r border-pm-border bg-pm-card" style={{ width: LABEL_W }} />
                          <p className="px-3 text-xs leading-7 text-pm-muted">No scheduled items</p>
                        </div>
                      ) : (
                        lane.items.map((item) => {
                          const { start, end } = datesFor(item);
                          const s = monthIndex(rangeStart, start);
                          const e = monthIndex(rangeStart, end);
                          const inRange = e >= 0 && s < monthCount;
                          return (
                            <div key={item.id} className="flex border-b border-pm-border/60" style={{ height: ROW_H }}>
                              <div className="sticky left-0 z-10 flex shrink-0 items-center gap-1.5 border-r border-pm-border bg-pm-card px-3 text-xs" style={{ width: LABEL_W }}>
                                <button type="button" onClick={() => onOpen(item.code)} className="truncate text-left hover:text-pm-link hover:underline" title={item.name}>
                                  {item.name}
                                </button>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => removeFromTimeline(item)}
                                    aria-label={`Remove ${item.name} from the timeline`}
                                    title="Remove from the timeline"
                                    className="ml-auto shrink-0 rounded p-0.5 text-pm-muted hover:bg-pm-subtle hover:text-pm-warning focus-visible:outline-2 focus-visible:outline-pm-accent"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                              <Track monthCount={monthCount} monthW={monthW}>
                                {inRange ? (
                                  <Bar item={item} ws={lane.ws} startIdx={Math.max(0, s)} endIdx={Math.min(monthCount - 1, e)} monthW={monthW} canEdit={canEdit} onOpen={onOpen} />
                                ) : (
                                  <span className="col-span-full px-2 text-[11px] leading-[34px] text-pm-muted">
                                    {s >= monthCount ? "After this range →" : "← Before this range"} ({formatMonth(start)} – {formatMonth(end)})
                                  </span>
                                )}
                              </Track>
                            </div>
                          );
                        })
                      )}
                    </section>
                  ))}

                  {/* drop target for the unscheduled tray, markers and dependency lines */}
                  <GridDropZone width={trackWidth} height={Math.max(bodyHeight, 60)} highlight={drag?.kind === "tray"}>
                    {todayX >= 0 && todayX <= trackWidth && (
                      <div className="absolute top-0 h-full border-l-2 border-pm-warning" style={{ left: todayX }}>
                        <span className="absolute -top-0 left-1 rounded bg-pm-warning px-1 text-[10px] font-semibold text-white">Today</span>
                      </div>
                    )}
                    {mvpX !== null && mvpX >= 0 && mvpX <= trackWidth && (
                      <div className="absolute top-0 h-full border-l-2 border-dashed border-pm-navy dark:border-pm-aqua" style={{ left: mvpX }}>
                        <span className="absolute top-5 left-1 whitespace-nowrap rounded bg-pm-navy px-1 text-[10px] font-semibold text-white dark:bg-pm-aqua dark:text-pm-navy">
                          ◆ {mvpLine?.label}
                        </span>
                      </div>
                    )}
                    {showDeps && (
                      <svg className="absolute inset-0 overflow-visible" width={trackWidth} height={bodyHeight}>
                        <defs>
                          <marker id="dep-arrow" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="6" markerHeight="6" orient="auto">
                            <path d="M0,0 L6,3 L0,6 z" fill="context-stroke" />
                          </marker>
                        </defs>
                        {scheduled.flatMap((item) =>
                          item.depends_on_codes
                            .map((code) => byCode.get(code))
                            .filter((dep): dep is RankedItem => !!dep && rowY.has(dep.code) && rowY.has(item.code))
                            .map((dep) => {
                              const x1 = (monthIndex(rangeStart, datesFor(dep).end) + 1) * monthW;
                              const x2 = monthIndex(rangeStart, datesFor(item).start) * monthW;
                              const y1 = rowY.get(dep.code)!;
                              const y2 = rowY.get(item.code)!;
                              const clash = datesFor(item).start < datesFor(dep).end;
                              const mid = Math.max(x1 + 10, x2 - 10);
                              return (
                                <path
                                  key={`${dep.code}-${item.code}`}
                                  d={`M ${x1} ${y1} H ${mid} V ${y2} H ${x2}`}
                                  fill="none"
                                  stroke={clash ? "#B63B26" : "#52627A"}
                                  strokeWidth={clash ? 1.75 : 1.25}
                                  strokeDasharray={clash ? undefined : "3 3"}
                                  markerEnd="url(#dep-arrow)"
                                >
                                  <title>{`${item.name} depends on ${dep.name}${clash ? " — starts before it ends" : ""}`}</title>
                                </path>
                              );
                            }),
                        )}
                      </svg>
                    )}
                  </GridDropZone>
                </div>
              </div>
            </div>

            <aside aria-labelledby="tray-heading" className="self-start rounded-xl border border-pm-border bg-pm-card p-3 xl:sticky xl:top-[108px] xl:max-h-[calc(100vh-128px)] xl:overflow-y-auto">
              <h2 id="tray-heading" className="text-sm font-semibold">
                Unscheduled <span className="font-normal text-pm-muted">({unscheduled.length})</span>
              </h2>
              <p className="mb-3 mt-0.5 text-xs text-pm-muted">{canEdit ? "Drag onto the timeline to set From and To." : "Items without both dates."}</p>
              {unscheduled.length === 0 ? (
                <p className="text-sm text-pm-muted">Everything shown is scheduled.</p>
              ) : (
                workstreams
                  .filter((ws) => unscheduled.some((i) => i.workstream === ws.code))
                  .map((ws) => (
                    <div key={ws.code} className="mb-3">
                      <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold">
                        <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: ws.color }} />
                        {ws.name}
                      </p>
                      <ul className="space-y-1">
                        {unscheduled
                          .filter((i) => i.workstream === ws.code)
                          .map((i) => (
                            <TrayCard key={i.id} item={i} canEdit={canEdit} onOpen={onOpen} />
                          ))}
                      </ul>
                    </div>
                  ))
              )}
            </aside>
          </div>
          <DragOverlay dropAnimation={null}>
            {drag?.kind === "tray" && (
              <div className="w-52 rounded-md border border-pm-accent bg-pm-card px-2 py-1.5 text-xs font-medium shadow-xl">{drag.item.name}</div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {editingMvp && mvpLine && <MvpLineDialog line={mvpLine} onClose={() => setEditingMvp(false)} onRemove={removeMvpLine} />}
      <ItemDrawer item={openItem} items={items} workstreams={workstreams} weights={toWeights(weights)} onClose={() => url.set({ item: null })} onOpenItem={onOpen} />
    </div>
  );
}
