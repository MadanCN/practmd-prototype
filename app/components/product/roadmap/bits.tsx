import { AlertTriangle, Diamond, Sparkles } from "lucide-react";
import { AI_WORKSTREAM, HORIZONS, type Horizon } from "@/lib/product/constants";
import { Chip } from "@/components/product/ui/primitives";
import { cn } from "@/lib/utils";

export function scoreColor(score: number): string {
  if (score >= 70) return "#02979D";
  if (score >= 45) return "#D97706";
  return "#B63B26";
}

export function HorizonChip({ horizon }: { horizon: Horizon }) {
  const h = HORIZONS.find((x) => x.value === horizon)!;
  return <Chip className={h.chip}>{h.label}</Chip>;
}

export function ItemTags({ isMvp, workstream }: { isMvp: boolean; workstream: string }) {
  return (
    <>
      {isMvp && (
        <Chip className="bg-pm-navy text-white dark:bg-pm-aqua dark:text-pm-navy" title="Part of the MVP">
          <Diamond className="h-2.5 w-2.5" aria-hidden /> MVP
        </Chip>
      )}
      {workstream === AI_WORKSTREAM && (
        <Chip className="bg-violet-100 text-violet-800 dark:bg-violet-500/20 dark:text-violet-200" title="Cortex AI">
          <Sparkles className="h-2.5 w-2.5" aria-hidden /> AI
        </Chip>
      )}
    </>
  );
}

export function AdjustmentBadge({ adjustment, reason }: { adjustment: number; reason: string | null }) {
  if (!adjustment) return null;
  const text = `${adjustment > 0 ? "+" : "−"}${Math.abs(adjustment)}`;
  return (
    <span
      title={reason ? `Adjustment ${text}: ${reason}` : `Adjustment ${text}`}
      className="rounded bg-pm-subtle px-1 py-px text-[10px] font-semibold text-pm-text"
    >
      {text}
      <span className="sr-only">{reason ? ` adjustment: ${reason}` : " adjustment"}</span>
    </span>
  );
}

export function NotScored() {
  return <Chip className="border border-dashed border-pm-border text-pm-muted">Not scored</Chip>;
}

/** Score number plus a thin bar coloured by value. */
export function ScoreBar({ score, adjustment, reason, compact }: { score: number | null; adjustment: number; reason: string | null; compact?: boolean }) {
  if (score == null) return <NotScored />;
  return (
    <div className={cn("flex items-center gap-2", compact ? "min-w-0" : "min-w-[92px]")}>
      <span className="w-7 text-right text-sm font-semibold tabular-nums">{score}</span>
      {!compact && (
        <span aria-hidden className="h-1.5 w-12 overflow-hidden rounded-full bg-pm-subtle">
          <span className="block h-full rounded-full" style={{ width: `${score}%`, backgroundColor: scoreColor(score) }} />
        </span>
      )}
      <AdjustmentBadge adjustment={adjustment} reason={reason} />
    </div>
  );
}

export function ScoreBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="rounded-md border border-dashed border-pm-border px-1.5 text-[11px] text-pm-muted">—</span>;
  return (
    <span className="rounded-md px-1.5 py-px text-[11px] font-bold tabular-nums text-white" style={{ backgroundColor: scoreColor(score) }} title={`Score ${score}`}>
      {score}
    </span>
  );
}

export function DependencyWarning({ names }: { names: string[] | undefined }) {
  if (!names?.length) return null;
  const text = `Ranks above something it depends on: ${names.join(", ")}.`;
  return (
    <span title={text} className="inline-flex text-amber-600 dark:text-amber-400">
      <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">{text}</span>
    </span>
  );
}
