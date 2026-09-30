"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Plus } from "lucide-react";
import { challengeSchema } from "@/lib/product/schemas";
import type { ChallengeCategory, ChallengeWithCounts } from "@/lib/product/data/challenges";
import { useSession } from "@/components/product/SessionContext";
import { useToast } from "@/components/product/ui/Toast";
import { inputClass } from "@/components/product/ui/primitives";
import ChallengeCard, { CardContent } from "./ChallengeCard";
import { useChallengeMutations } from "./useChallenges";
import { cn } from "@/lib/utils";

// Prefer dropping on a card (reorder) over the column itself (append).
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  const cards = hits.filter((h) => String(h.id).startsWith("slot:"));
  if (cards.length) return cards;
  return hits.length ? hits : rectIntersection(args);
};

function QuickAdd({ category, onCreated }: { category: string; onCreated: (id: string) => void }) {
  const { create } = useChallengeMutations();
  const toast = useToast();
  const [title, setTitle] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const parsed = challengeSchema.shape.title.safeParse(title);
        if (!parsed.success) {
          toast(parsed.error.issues[0].message, "error");
          return;
        }
        create.mutate({ title: parsed.data, category }, { onSuccess: (row) => (setTitle(""), onCreated(row.id)) });
      }}
      className="relative mt-2"
    >
      <Plus className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-pm-muted" />
      <input
        aria-label="Quick add a challenge"
        placeholder="Add a challenge…"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={cn(inputClass, "h-9 bg-transparent pl-8")}
        disabled={create.isPending}
      />
    </form>
  );
}

function Column({
  category,
  cards,
  canEdit,
  onOpen,
}: {
  category: ChallengeCategory;
  cards: ChallengeWithCounts[];
  canEdit: boolean;
  onOpen: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col:${category.code}`, data: { category: category.code } });
  return (
    <section aria-labelledby={`col-${category.code}`} className="flex w-[300px] shrink-0 flex-col rounded-xl border border-pm-border bg-pm-subtle/50">
      <header className="flex items-center gap-2 rounded-t-xl border-b border-pm-border bg-pm-card px-3 py-2.5" style={{ borderTop: `4px solid ${category.color}` }}>
        <h2 id={`col-${category.code}`} className="flex-1 text-sm font-semibold">
          {category.name}
        </h2>
        <span className="rounded-full bg-pm-subtle px-2 py-0.5 text-xs font-semibold tabular-nums" aria-label={`${cards.length} challenges`}>
          {cards.length}
        </span>
      </header>
      <div ref={setNodeRef} className={cn("flex flex-1 flex-col p-2 transition-colors", isOver && "bg-pm-accent/10")}>
        <ul className="flex flex-col gap-2">
          {cards.map((c) => (
            <ChallengeCard key={c.id} c={c} canDrag={canEdit && !c.archived_at} onOpen={onOpen} />
          ))}
        </ul>
        {cards.length === 0 && <p className="py-4 text-center text-xs text-pm-muted">No challenges here yet.</p>}
        {canEdit && <QuickAdd category={category.code} onCreated={onOpen} />}
      </div>
    </section>
  );
}

export default function Board({
  categories,
  visible,
  all,
  onOpen,
}: {
  categories: ChallengeCategory[];
  /** Cards to show (filtered). */
  visible: ChallengeWithCounts[];
  /** Every active card, used to compute the new order. */
  all: ChallengeWithCounts[];
  onOpen: (id: string) => void;
}) {
  const { canEdit } = useSession();
  const { reorder } = useChallengeMutations();
  const [active, setActive] = useState<ChallengeWithCounts | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor));

  function onDragEnd(e: DragEndEvent) {
    setActive(null);
    const moving = (e.active.data.current as { challenge: ChallengeWithCounts } | undefined)?.challenge;
    const over = e.over?.data.current as { category: string; id?: string } | undefined;
    if (!moving || !over) return;
    const column = all.filter((c) => c.category === over.category && c.id !== moving.id).sort((a, b) => a.sort_order - b.sort_order);
    let index = column.length;
    if (over.id) {
      if (over.id === moving.id) return;
      index = column.findIndex((c) => c.id === over.id);
      // Dropped on the lower half of a card → after it.
      const dragged = e.active.rect.current.translated;
      if (dragged && e.over && dragged.top + dragged.height / 2 > e.over.rect.top + e.over.rect.height / 2) index++;
    }
    column.splice(index, 0, moving);
    const updates = column
      .map((c, i) => ({ id: c.id, sort_order: (i + 1) * 10, category: over.category, prevOrder: c.sort_order, prevCategory: c.category }))
      .filter((u) => u.sort_order !== u.prevOrder || u.category !== u.prevCategory)
      .map(({ id, sort_order, category }) => ({ id, sort_order, category }));
    if (updates.length) reorder.mutate(updates);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={(e) => setActive((e.active.data.current as { challenge: ChallengeWithCounts }).challenge)}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActive(null)}
      accessibility={{
        announcements: {
          onDragStart: ({ active: a }) => `Picked up ${(a.data.current as { challenge: ChallengeWithCounts }).challenge.title}.`,
          onDragOver: ({ over }) => (over ? `Over ${categories.find((c) => c.code === (over.data.current as { category: string }).category)?.name ?? "a column"}.` : "Not over a column."),
          onDragEnd: ({ over }) => (over ? "Dropped." : "Dropped outside a column; nothing changed."),
          onDragCancel: () => "Move cancelled.",
        },
      }}
    >
      <div className="flex gap-3 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <Column
            key={cat.code}
            category={cat}
            cards={visible.filter((c) => c.category === cat.code).sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at))}
            canEdit={canEdit}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active && (
          <div className="w-[284px] rounded-xl border border-pm-accent bg-pm-card p-3 shadow-2xl">
            <CardContent c={active} />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
