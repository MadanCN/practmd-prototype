"use client";

import { useMemo, useState } from "react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { CHALLENGE_PRIORITIES, CHALLENGE_STATUSES } from "@/lib/product/constants";
import type { ChallengeCategory, ChallengeWithCounts } from "@/lib/product/data/challenges";
import { useFlashing } from "@/lib/product/flash";
import { ColorChip } from "@/components/product/ui/primitives";
import { PriorityDot, StatusChip } from "./ChallengeCard";
import { cn } from "@/lib/utils";

type Key = "title" | "category" | "status" | "priority" | "owner" | "raised_by" | "note_count" | "advice_count" | "open_actions" | "last" | "created_at";

const COLUMNS: { key: Key; label: string; numeric?: boolean }[] = [
  { key: "title", label: "Title" },
  { key: "category", label: "Category" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "owner", label: "Owner" },
  { key: "raised_by", label: "Raised by" },
  { key: "note_count", label: "Notes", numeric: true },
  { key: "advice_count", label: "Advice", numeric: true },
  { key: "open_actions", label: "Open actions", numeric: true },
  { key: "last", label: "Last activity" },
  { key: "created_at", label: "Created" },
];

function Row({ c, category, onOpen }: { c: ChallengeWithCounts; category: ChallengeCategory | undefined; onOpen: (id: string) => void }) {
  const flashing = useFlashing(c.id);
  const last = c.last_note_at && c.last_note_at > c.updated_at ? c.last_note_at : c.updated_at;
  return (
    <tr className={cn("border-b border-pm-border transition-colors duration-700 last:border-0 hover:bg-pm-subtle/60", flashing && "bg-pm-aqua/25", c.archived_at && "opacity-70")}>
      <td className="px-3 py-2">
        <button type="button" onClick={() => onOpen(c.id)} className="text-left text-sm font-medium hover:text-pm-link hover:underline">
          {c.title}
        </button>
      </td>
      <td className="px-3 py-2">{category && <ColorChip color={category.color} label={category.name} className="max-w-[190px]" />}</td>
      <td className="px-3 py-2">
        <StatusChip status={c.status} />
      </td>
      <td className="px-3 py-2">
        <PriorityDot priority={c.priority} />
      </td>
      <td className="px-3 py-2 text-sm">{c.owner ?? <span className="text-pm-muted">—</span>}</td>
      <td className="px-3 py-2 text-sm">{c.raised_by ?? <span className="text-pm-muted">—</span>}</td>
      <td className="px-3 py-2 text-right tabular-nums">{c.note_count}</td>
      <td className="px-3 py-2 text-right tabular-nums">{c.advice_count}</td>
      <td className="px-3 py-2 text-right tabular-nums">{c.open_actions}</td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-pm-muted" title={new Date(last).toLocaleString()}>
        {formatDistanceToNow(parseISO(last), { addSuffix: true })}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-sm text-pm-muted">{format(parseISO(c.created_at), "d MMM yyyy")}</td>
    </tr>
  );
}

export default function ListView({ rows, categories, onOpen }: { rows: ChallengeWithCounts[]; categories: ChallengeCategory[]; onOpen: (id: string) => void }) {
  const [sort, setSort] = useState<{ key: Key; desc: boolean }>({ key: "last", desc: true });
  const catIndex = useMemo(() => new Map(categories.map((c, i) => [c.code, i])), [categories]);
  const sorted = useMemo(() => {
    const val = (c: ChallengeWithCounts): string | number => {
      switch (sort.key) {
        case "category":
          return catIndex.get(c.category) ?? 99;
        case "status":
          return CHALLENGE_STATUSES.findIndex((s) => s.value === c.status);
        case "priority":
          return CHALLENGE_PRIORITIES.findIndex((p) => p.value === c.priority);
        case "last":
          return c.last_note_at && c.last_note_at > c.updated_at ? c.last_note_at : c.updated_at;
        case "note_count":
        case "advice_count":
        case "open_actions":
          return c[sort.key];
        default:
          return (c[sort.key] ?? "").toString().toLowerCase();
      }
    };
    return [...rows].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
      return sort.desc ? -cmp : cmp;
    });
  }, [rows, sort, catIndex]);

  return (
    <div className="overflow-x-auto rounded-xl border border-pm-border bg-pm-card">
      <table className="w-full min-w-[1100px] border-collapse">
        <thead>
          <tr className="border-b border-pm-border">
            {COLUMNS.map((col) => {
              const active = sort.key === col.key;
              return (
                <th
                  key={col.key}
                  scope="col"
                  aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
                  className={cn("whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-pm-muted", col.numeric ? "text-right" : "text-left")}
                >
                  <button
                    type="button"
                    onClick={() => setSort((s) => ({ key: col.key, desc: s.key === col.key ? !s.desc : !!col.numeric || col.key === "last" || col.key === "created_at" }))}
                    className="inline-flex items-center gap-1 hover:text-pm-text"
                  >
                    {col.label}
                    {active ? sort.desc ? <ArrowDown className="h-3 w-3" /> : <ArrowUp className="h-3 w-3" /> : <ArrowUpDown className="h-3 w-3 opacity-40" />}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((c) => (
            <Row key={c.id} c={c} category={categories.find((x) => x.code === c.category)} onOpen={onOpen} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
