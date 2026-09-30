"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Info, RotateCcw, SlidersHorizontal } from "lucide-react";
import { CRITERIA } from "@/lib/product/constants";
import { DEFAULT_WEIGHTS, WEIGHT_PRESETS, type Weights } from "@/lib/product/score";
import { roadmapKeys, updateWeights } from "@/lib/product/data/roadmap";
import { getSupabaseBrowserClient } from "@/lib/product/supabase/client";
import { useSession } from "@/components/product/SessionContext";
import { useToast } from "@/components/product/ui/Toast";
import { Button, Popover, focusRing } from "@/components/product/ui/primitives";
import { cn } from "@/lib/utils";

export function FormulaInfo() {
  return (
    <Popover
      label="How the score works"
      panelClassName="w-[min(92vw,440px)]"
      trigger={
        <span className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm font-medium text-pm-link hover:bg-pm-subtle">
          <Info className="h-4 w-4" /> How the score works
        </span>
      }
    >
      <div className="space-y-3">
        <p>Each item gets four ratings from 1 to 5:</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-pm-muted">
              <th className="py-1 pr-2 font-semibold">Criterion</th>
              <th className="py-1 pr-2 font-semibold">Meaning</th>
              <th className="py-1 font-semibold">Default weight</th>
            </tr>
          </thead>
          <tbody>
            {CRITERIA.map((c) => (
              <tr key={c.key} className="border-t border-pm-border">
                <td className="py-1 pr-2 font-medium">{c.label}</td>
                <td className="py-1 pr-2">{c.meaning}</td>
                <td className="py-1 tabular-nums">{DEFAULT_WEIGHTS[c.weightKey]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <pre className="overflow-x-auto rounded-lg bg-pm-subtle p-2.5 font-mono text-[11px] leading-relaxed">
          {`weighted = (R·wR + O·wO + U·wU + E·wE) / (wR + wO + wU + wE)   → 1..5
base     = round((weighted − 1) / 4 × 100)                    → 0..100
score    = clamp(base + adjustment, 0, 100)`}
        </pre>
        <ul className="list-disc space-y-1 pl-4 text-xs text-pm-muted">
          <li>If any rating is missing, or all weights are 0, the item is &ldquo;Not scored&rdquo;.</li>
          <li>An adjustment (−20 to +20) needs a written reason.</li>
          <li>Equal scores are ordered by unlocks, then ease, then name.</li>
          <li>The ⚠ icon means an item ranks above something it depends on. It never changes the score.</li>
        </ul>
      </div>
    </Popover>
  );
}

/**
 * Four weight sliders plus presets. Dragging updates `onDraft` immediately (instant re-rank);
 * the value is saved shortly after the last change and reaches everyone through realtime.
 */
export default function WeightsPanel({ weights, onDraft }: { weights: Weights | undefined; onDraft: (w: Weights | null) => void }) {
  const { canEdit, user } = useSession();
  const toast = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState<Weights | null>(null);
  const saveTimer = useRef<number | undefined>(undefined);
  const changeCount = useRef(0);
  const shown = draft ?? weights ?? DEFAULT_WEIGHTS;

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  function change(next: Weights) {
    setDraft(next);
    onDraft(next);
    window.clearTimeout(saveTimer.current);
    const thisChange = ++changeCount.current;
    saveTimer.current = window.setTimeout(async () => {
      try {
        await updateWeights(getSupabaseBrowserClient(), next, user.email);
        await Promise.all([
          qc.invalidateQueries({ queryKey: roadmapKeys.weights }),
          qc.invalidateQueries({ queryKey: roadmapKeys.items }),
        ]);
      } catch (e) {
        toast(`Couldn't save weights: ${(e as Error).message}`, "error");
      } finally {
        // Keep the draft if the user moved a slider again while this save was in flight.
        if (thisChange === changeCount.current) {
          setDraft(null);
          onDraft(null);
        }
      }
    }, 450);
  }

  const activePreset = WEIGHT_PRESETS.find((p) => CRITERIA.every((c) => p.weights[c.weightKey] === shown[c.weightKey]));

  return (
    <section className="rounded-xl border border-pm-border bg-pm-card" aria-labelledby="weights-heading">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="weights-body"
          className={cn("flex items-center gap-2 rounded-lg py-1 text-sm font-semibold", focusRing)}
        >
          <SlidersHorizontal className="h-4 w-4 text-pm-accent" />
          <span id="weights-heading">Scoring weights</span>
          <ChevronDown className={cn("h-4 w-4 text-pm-muted transition-transform", open && "rotate-180")} />
        </button>
        <span className="text-xs text-pm-muted">
          {activePreset ? activePreset.label : "Custom"} · R {shown.w_revenue} · O {shown.w_operational} · U {shown.w_unlocks} · E {shown.w_ease}
        </span>
        <div className="ml-auto">
          <FormulaInfo />
        </div>
      </div>
      {open && (
        <div id="weights-body" className="grid gap-4 border-t border-pm-border px-4 py-3 lg:grid-cols-[1fr_auto]">
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-4">
            {CRITERIA.map((c) => (
              <label key={c.key} className="block">
                <span className="flex items-center justify-between text-xs font-semibold text-pm-muted">
                  {c.label}
                  <span className="text-sm tabular-nums text-pm-text">{shown[c.weightKey]}</span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={5}
                  step={1}
                  disabled={!canEdit}
                  value={shown[c.weightKey]}
                  onChange={(e) => change({ ...shown, [c.weightKey]: Number(e.target.value) })}
                  className="mt-1 w-full accent-[#02979D] disabled:opacity-60"
                  aria-valuetext={`${c.label} weight ${shown[c.weightKey]} of 5`}
                />
              </label>
            ))}
          </div>
          {canEdit && (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {WEIGHT_PRESETS.map((p) => (
                <Button key={p.id} size="sm" variant={activePreset?.id === p.id ? "primary" : "secondary"} aria-pressed={activePreset?.id === p.id} onClick={() => change(p.weights)}>
                  {p.label}
                </Button>
              ))}
              <Button size="sm" variant="ghost" onClick={() => change(DEFAULT_WEIGHTS)}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset to default
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
