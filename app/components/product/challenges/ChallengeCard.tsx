"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CheckSquare, Lightbulb, MessageSquare, Quote, User } from "lucide-react";
import { CHALLENGE_PRIORITIES, CHALLENGE_STATUSES, PRIORITY_LABEL, type ChallengeStatus } from "@/lib/product/constants";
import type { ChallengeWithCounts } from "@/lib/product/data/challenges";
import { useFlashing } from "@/lib/product/flash";
import { Chip } from "@/components/product/ui/primitives";
import { cn } from "@/lib/utils";

export function StatusChip({ status }: { status: ChallengeStatus }) {
  const s = CHALLENGE_STATUSES.find((x) => x.value === status)!;
  return <Chip className={s.chip}>{s.label}</Chip>;
}

export function PriorityDot({ priority }: { priority: ChallengeWithCounts["priority"] }) {
  const p = CHALLENGE_PRIORITIES.find((x) => x.value === priority)!;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-pm-muted" title={`${p.label} priority`}>
      <span aria-hidden className={cn("h-2 w-2 rounded-full", p.dot)} />
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function CardContent({ c }: { c: ChallengeWithCounts }) {
  const pinned = c.pinned_notes[0];
  return (
    <>
      <p className="text-sm font-semibold leading-snug">{c.title}</p>
      {c.description && <p className="mt-1 line-clamp-1 text-xs text-pm-muted">{c.description}</p>}
      {c.ask && (
        <p className="mt-1.5 text-xs font-medium leading-snug text-pm-link">
          <span className="font-semibold">Ask:</span> {c.ask}
        </p>
      )}
      {pinned && (
        <blockquote className="mt-2 rounded-lg border-l-4 border-pm-accent bg-pm-subtle px-2.5 py-1.5 text-xs">
          <Quote className="mb-0.5 inline h-3 w-3 text-pm-accent" aria-hidden /> <span className="line-clamp-3">{pinned.body.replace(/\*\*|[*_]/g, "")}</span>
          {pinned.source && <footer className="mt-0.5 font-semibold text-pm-muted">— {pinned.source}</footer>}
        </blockquote>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <StatusChip status={c.status} />
        <PriorityDot priority={c.priority} />
        {c.owner && (
          <span className="inline-flex items-center gap-1 text-xs text-pm-muted">
            <User className="h-3 w-3" aria-hidden /> {c.owner}
          </span>
        )}
      </div>
      <div className="mt-1.5 flex items-center gap-3 text-xs text-pm-muted">
        <span className="inline-flex items-center gap-1" title="Notes">
          <MessageSquare className="h-3 w-3" aria-hidden /> {c.note_count} <span className="sr-only">notes</span>
        </span>
        <span className="inline-flex items-center gap-1" title="Advice" data-testid="advice-count">
          <Lightbulb className="h-3 w-3" aria-hidden /> {c.advice_count} <span className="sr-only">advice</span>
        </span>
        <span className="inline-flex items-center gap-1" title="Open actions">
          <CheckSquare className="h-3 w-3" aria-hidden /> {c.open_actions} <span className="sr-only">open actions</span>
        </span>
      </div>
    </>
  );
}

/** Board card: draggable, and a drop slot for reordering (drop above/below it). */
export default function ChallengeCard({ c, canDrag, onOpen }: { c: ChallengeWithCounts; canDrag: boolean; onOpen: (id: string) => void }) {
  const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({ id: `card:${c.id}`, data: { challenge: c }, disabled: !canDrag });
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `slot:${c.id}`, data: { category: c.category, id: c.id } });
  const flashing = useFlashing(c.id);
  return (
    <li ref={setDropRef} className="relative">
      {isOver && !isDragging && <span aria-hidden className="absolute -top-1 left-0 right-0 h-0.5 rounded bg-pm-accent" />}
      <div
        ref={setDragRef}
        {...attributes}
        {...listeners}
        role="button"
        aria-roledescription={canDrag ? "Draggable challenge" : undefined}
        aria-label={`${c.title}. ${CHALLENGE_STATUSES.find((s) => s.value === c.status)?.label}. ${c.advice_count} advice, ${c.open_actions} open actions.${canDrag ? " Press space to move, enter to open." : ""}`}
        onClick={() => onOpen(c.id)}
        onKeyDown={(e) => {
          listeners?.onKeyDown?.(e);
          if (e.key === "Enter" && !e.defaultPrevented) onOpen(c.id);
        }}
        data-challenge-title={c.title}
        className={cn(
          "cursor-pointer rounded-xl border border-pm-border bg-pm-card p-3 shadow-sm transition-colors duration-700 hover:border-pm-accent focus-visible:outline-2 focus-visible:outline-pm-accent",
          canDrag && "cursor-grab active:cursor-grabbing",
          isDragging && "opacity-40",
          flashing && "bg-pm-aqua/25",
          c.archived_at && "opacity-70",
        )}
      >
        <CardContent c={c} />
      </div>
    </li>
  );
}
