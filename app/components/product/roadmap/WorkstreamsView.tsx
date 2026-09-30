"use client";

import { useCallback, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Settings2 } from "lucide-react";
import { HORIZONS, HORIZON_LABEL, type Horizon } from "@/lib/product/constants";
import type { Workstream } from "@/lib/product/data/roadmap";
import { useFlashing } from "@/lib/product/flash";
import { Button, EmptyState, Skeleton } from "@/components/product/ui/primitives";
import { useSession } from "@/components/product/SessionContext";
import { useUrlState } from "@/components/product/useUrlState";
import { ItemTags, ScoreBadge } from "./bits";
import ItemDrawer from "./ItemDrawer";
import ManageWorkstreamsDialog from "./ManageWorkstreamsDialog";
import { toWeights, useRankedItems, useRoadmapData, useRoadmapRealtime, useUpdateItem, type RankedItem } from "./useRoadmap";
import { cn } from "@/lib/utils";

function CardBody({ item }: { item: RankedItem }) {
  return (
    <>
      <span className="line-clamp-2 text-[13px] font-medium leading-snug">{item.name}</span>
      <span className="mt-1.5 flex flex-wrap items-center gap-1">
        <ScoreBadge score={item.displayScore} />
        <ItemTags isMvp={item.is_mvp} workstream={item.workstream} />
      </span>
    </>
  );
}

function ItemCard({ item, canEdit, onOpen }: { item: RankedItem; canEdit: boolean; onOpen: (code: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: item.id, data: { item }, disabled: !canEdit });
  const flashing = useFlashing(item.id);
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      role="button"
      aria-roledescription={canEdit ? "Draggable item" : undefined}
      aria-label={`${item.name}, score ${item.displayScore ?? "not scored"}, ${HORIZON_LABEL[item.horizon]}${canEdit ? ". Press space to move between horizons, enter to open." : ""}`}
      onClick={() => onOpen(item.code)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === "Enter" && !e.defaultPrevented) onOpen(item.code);
      }}
      className={cn(
        "flex cursor-pointer flex-col rounded-lg border border-pm-border bg-pm-card px-2.5 py-2 text-left shadow-sm transition-colors hover:border-pm-accent focus-visible:outline-2 focus-visible:outline-pm-accent",
        canEdit && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
        flashing && "bg-pm-aqua/25",
      )}
    >
      <CardBody item={item} />
    </div>
  );
}

function Cell({ ws, horizon, activeWs, children }: { ws: string; horizon: Horizon; activeWs: string | null; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: `${ws}|${horizon}`, data: { ws, horizon }, disabled: activeWs !== null && activeWs !== ws });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-24 flex-col gap-1.5 rounded-lg p-1.5 transition-colors",
        isOver ? "bg-pm-accent/15 ring-2 ring-pm-accent" : activeWs === ws ? "bg-pm-subtle" : "",
      )}
    >
      {children}
    </div>
  );
}

function Summary({ items }: { items: RankedItem[] }) {
  const scored = items.filter((i) => i.displayScore != null);
  const avg = scored.length ? Math.round(scored.reduce((s, i) => s + (i.displayScore ?? 0), 0) / scored.length) : null;
  return (
    <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-xs">
      <dt className="text-pm-muted">Items</dt>
      <dd className="text-right font-semibold tabular-nums">{items.length}</dd>
      <dt className="text-pm-muted">Avg score</dt>
      <dd className="text-right font-semibold tabular-nums">{avg ?? "—"}</dd>
      <dt className="text-pm-muted">Now</dt>
      <dd className="text-right font-semibold tabular-nums">{items.filter((i) => i.horizon === "now").length}</dd>
      <dt className="text-pm-muted">Next</dt>
      <dd className="text-right font-semibold tabular-nums">{items.filter((i) => i.horizon === "next").length}</dd>
    </dl>
  );
}

export default function WorkstreamsView() {
  const { canEdit, isAdmin } = useSession();
  const url = useUrlState();
  const { items, weights, workstreams, isLoading, error } = useRoadmapData();
  useRoadmapRealtime();
  const update = useUpdateItem();
  const { ranked } = useRankedItems(items, null);
  const [active, setActive] = useState<RankedItem | null>(null);
  const [managing, setManaging] = useState(false);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  const byWs = useMemo(() => {
    const m = new Map<string, RankedItem[]>();
    for (const i of ranked) m.set(i.workstream, [...(m.get(i.workstream) ?? []), i]);
    return m;
  }, [ranked]);

  const onOpen = useCallback((code: string) => url.set({ item: code }), [url]);

  function onDragStart(e: DragStartEvent) {
    setActive((e.active.data.current as { item: RankedItem }).item);
  }
  function onDragEnd(e: DragEndEvent) {
    setActive(null);
    const item = (e.active.data.current as { item: RankedItem } | undefined)?.item;
    const target = e.over?.data.current as { ws: string; horizon: Horizon } | undefined;
    if (!item || !target || target.ws !== item.workstream || target.horizon === item.horizon) return;
    update.mutate({ id: item.id, patch: { horizon: target.horizon } });
  }

  const announcements: Announcements = {
    onDragStart: ({ active: a }) => `Picked up ${(a.data.current as { item: RankedItem }).item.name}.`,
    onDragOver: ({ over }) => (over ? `Over ${HORIZON_LABEL[(over.data.current as { horizon: Horizon }).horizon]}.` : "Not over a horizon."),
    onDragEnd: ({ active: a, over }) =>
      over
        ? `Moved ${(a.data.current as { item: RankedItem }).item.name} to ${HORIZON_LABEL[(over.data.current as { horizon: Horizon }).horizon]}.`
        : "Dropped outside a horizon; nothing changed.",
    onDragCancel: () => "Move cancelled.",
  };

  const openItem = items.find((i) => i.code === url.get("item"));
  const cols = "grid-cols-[190px_repeat(5,minmax(170px,1fr))_130px]";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Workstreams</h1>
          <p className="text-sm text-pm-muted">{canEdit ? "Drag a card to another column to change its horizon." : "Items by workstream and horizon."}</p>
        </div>
        {isAdmin && (
          <Button className="ml-auto" onClick={() => setManaging(true)} disabled={!workstreams.length}>
            <Settings2 className="h-4 w-4" /> Manage workstreams
          </Button>
        )}
      </div>

      {error ? (
        <EmptyState title="Couldn't load workstreams">{(error as Error).message}</EmptyState>
      ) : isLoading ? (
        <Skeleton className="h-96" />
      ) : workstreams.length === 0 ? (
        <EmptyState title="No workstreams yet">{isAdmin ? "Use “Manage workstreams” to add one." : "An admin can add workstreams."}</EmptyState>
      ) : (
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setActive(null)} accessibility={{ announcements }}>
          <div className="overflow-x-auto rounded-xl border border-pm-border bg-pm-card">
            <div className="min-w-[1180px]" role="table" aria-label="Items by workstream and horizon">
              <div role="row" className={cn("grid border-b border-pm-border text-xs font-semibold uppercase tracking-wide text-pm-muted", cols)}>
                <div role="columnheader" className="px-3 py-2.5">
                  Workstream
                </div>
                {HORIZONS.map((h) => (
                  <div role="columnheader" key={h.value} className="px-3 py-2.5">
                    {h.label}
                  </div>
                ))}
                <div role="columnheader" className="px-3 py-2.5">
                  Summary
                </div>
              </div>
              {workstreams.map((ws: Workstream) => {
                const wsItems = byWs.get(ws.code) ?? [];
                return (
                  <div role="row" key={ws.code} className={cn("grid border-b border-pm-border last:border-0", cols)}>
                    <div role="rowheader" className="flex gap-2.5 border-r border-pm-border p-3">
                      <span aria-hidden className="mt-0.5 h-4 w-4 shrink-0 rounded" style={{ backgroundColor: ws.color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{ws.name}</p>
                        {ws.description && <p className="mt-0.5 text-xs text-pm-muted">{ws.description}</p>}
                      </div>
                    </div>
                    {HORIZONS.map((h) => (
                      <div role="cell" key={h.value} className="border-r border-pm-border p-1">
                        <Cell ws={ws.code} horizon={h.value} activeWs={active?.workstream ?? null}>
                          {wsItems
                            .filter((i) => i.horizon === h.value)
                            .map((i) => (
                              <ItemCard key={i.id} item={i} canEdit={canEdit} onOpen={onOpen} />
                            ))}
                        </Cell>
                      </div>
                    ))}
                    <div role="cell" className="bg-pm-subtle/40 p-3">
                      <Summary items={wsItems} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <DragOverlay dropAnimation={null}>
            {active && (
              <div className="flex w-56 flex-col rounded-lg border border-pm-accent bg-pm-card px-2.5 py-2 shadow-xl">
                <CardBody item={active} />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {isAdmin && managing && <ManageWorkstreamsDialog open onClose={() => setManaging(false)} workstreams={workstreams} />}
      <ItemDrawer item={openItem} items={items} workstreams={workstreams} weights={toWeights(weights)} onClose={() => url.set({ item: null })} onOpenItem={onOpen} />
    </div>
  );
}
