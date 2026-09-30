"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Archive, ArchiveRestore, History } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/product/supabase/client";
import { fetchHistory, roadmapKeys, type RoadmapItem, type Workstream } from "@/lib/product/data/roadmap";
import { describeChanges } from "@/lib/product/history";
import type { Weights } from "@/lib/product/score";
import { Button, ColorChip, Sheet, Skeleton } from "@/components/product/ui/primitives";
import { useSession } from "@/components/product/SessionContext";
import ItemForm, { itemToInput } from "./ItemForm";
import { HorizonChip, ItemTags } from "./bits";
import { useUpdateItem } from "./useRoadmap";

function HistoryList({ itemId }: { itemId: string }) {
  const sb = getSupabaseBrowserClient();
  const { nameFor } = useSession();
  const { data, isLoading } = useQuery({ queryKey: roadmapKeys.history(itemId), queryFn: () => fetchHistory(sb, itemId) });
  if (isLoading) return <Skeleton className="h-16" />;
  const entries = (data ?? [])
    .map((h) => ({ ...h, changes: describeChanges(h.before, h.after), created: h.before === null }))
    .filter((h) => h.created || h.changes.length);
  if (!entries.length) return <p className="text-sm text-pm-muted">No changes recorded yet.</p>;
  return (
    <ol className="space-y-3">
      {entries.map((h) => (
        <li key={h.id} className="rounded-lg border border-pm-border bg-pm-card p-3 text-sm">
          <p className="text-xs text-pm-muted">
            <span className="font-semibold text-pm-text">{h.changed_by ? nameFor(h.changed_by) : "System (seed)"}</span>{" "}
            {h.created ? "created this item" : "changed"} ·{" "}
            <time dateTime={h.changed_at} title={new Date(h.changed_at).toLocaleString()}>
              {formatDistanceToNow(parseISO(h.changed_at), { addSuffix: true })}
            </time>
          </p>
          {!h.created && (
            <ul className="mt-1.5 space-y-0.5">
              {h.changes.map((c) => (
                <li key={c.field}>
                  <span className="font-medium">{c.label}:</span> <span className="text-pm-muted line-through decoration-pm-muted/50">{c.from}</span>{" "}
                  → <span>{c.to}</span>
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function ItemDrawer({
  item,
  items,
  workstreams,
  weights,
  onClose,
  onOpenItem,
}: {
  item: RoadmapItem | undefined;
  items: RoadmapItem[];
  workstreams: Workstream[];
  weights: Weights | undefined;
  onClose: () => void;
  onOpenItem: (code: string) => void;
}) {
  const { canEdit } = useSession();
  const update = useUpdateItem();
  if (!item) return null;
  const ws = workstreams.find((w) => w.code === item.workstream);
  const dependedOnBy = items.filter((i) => !i.archived_at && i.depends_on_codes.includes(item.code));

  return (
    <Sheet
      open
      onClose={onClose}
      title={item.name}
      subtitle={
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs">{item.code}</span>
          {ws && <ColorChip color={ws.color} label={ws.name} />}
          <HorizonChip horizon={item.horizon} />
          <ItemTags isMvp={item.is_mvp} workstream={item.workstream} />
          {item.archived_at && <span className="text-xs font-semibold text-pm-warning">Archived</span>}
        </span>
      }
      actions={
        canEdit && (
          <Button
            size="sm"
            onClick={() => update.mutate({ id: item.id, patch: { archived_at: item.archived_at ? null : new Date().toISOString() } })}
          >
            {item.archived_at ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {item.archived_at ? "Restore" : "Archive"}
          </Button>
        )
      }
    >
      <div className="space-y-6">
        <ItemForm
          key={`${item.id}-${item.updated_at}`}
          defaultValues={itemToInput(item)}
          items={items}
          workstreams={workstreams}
          weights={weights}
          readOnly={!canEdit}
          submitLabel="Save changes"
          onSubmit={(values) => update.mutateAsync({ id: item.id, patch: values })}
        />

        <section aria-labelledby="depended-by">
          <h3 id="depended-by" className="mb-2 text-sm font-semibold">
            Depended on by
          </h3>
          {dependedOnBy.length === 0 ? (
            <p className="text-sm text-pm-muted">Nothing depends on this item.</p>
          ) : (
            <ul className="flex flex-wrap gap-1.5">
              {dependedOnBy.map((d) => (
                <li key={d.id}>
                  <button type="button" onClick={() => onOpenItem(d.code)} className="rounded-full border border-pm-border bg-pm-card px-2.5 py-0.5 text-xs hover:border-pm-accent">
                    <span className="font-mono text-pm-muted">{d.code}</span> {d.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="item-history">
          <h3 id="item-history" className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
            <History className="h-4 w-4" /> History
          </h3>
          <HistoryList itemId={item.id} />
        </section>
      </div>
    </Sheet>
  );
}
