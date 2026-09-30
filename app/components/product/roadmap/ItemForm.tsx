"use client";

import { useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { X } from "lucide-react";
import { zodResolver } from "@/lib/product/zod-resolver";
import { roadmapItemSchema, type RoadmapItemInput, type RoadmapItemValues } from "@/lib/product/schemas";
import { CRITERIA, HORIZONS } from "@/lib/product/constants";
import { dateToMonth, monthToFrom, monthToTo } from "@/lib/product/dates";
import { finalScore, type Weights } from "@/lib/product/score";
import type { RoadmapItem, Workstream } from "@/lib/product/data/roadmap";
import { Button, Field, inputClass } from "@/components/product/ui/primitives";
import { ScoreBar } from "./bits";
import { cn } from "@/lib/utils";

const selectClass = cn(inputClass, "pr-8");

export function itemToInput(i: RoadmapItem): RoadmapItemInput {
  return {
    code: i.code,
    name: i.name,
    workstream: i.workstream,
    description: i.description,
    outcome: i.outcome,
    horizon: i.horizon,
    revenue_impact: i.revenue_impact,
    operational_efficiency: i.operational_efficiency,
    unlocks: i.unlocks,
    ease: i.ease,
    score_adjustment: i.score_adjustment,
    adjustment_reason: i.adjustment_reason,
    start_date: i.start_date,
    end_date: i.end_date,
    depends_on_codes: i.depends_on_codes,
    is_mvp: i.is_mvp,
    owner: i.owner,
  };
}

/** Code suggestion: the workstream's usual letter plus the next free number (e.g. r7). */
export function suggestCode(workstream: string, items: RoadmapItem[]): string {
  const inWs = items.filter((i) => i.workstream === workstream);
  const counts = new Map<string, number>();
  for (const i of inWs) {
    const p = /^([a-z]+)\d+$/i.exec(i.code)?.[1].toLowerCase();
    if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  const prefix = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? workstream.charAt(0).toLowerCase();
  const used = new Set(items.map((i) => i.code.toLowerCase()));
  let n = Math.max(0, ...items.map((i) => Number(new RegExp(`^${prefix}(\\d+)$`, "i").exec(i.code)?.[1] ?? 0))) + 1;
  while (used.has(`${prefix}${n}`)) n++;
  return `${prefix}${n}`;
}

function DependsOnPicker({
  value,
  onChange,
  items,
  selfCode,
  disabled,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  items: RoadmapItem[];
  selfCode: string;
  disabled?: boolean;
}) {
  const [q, setQ] = useState("");
  const byCode = new Map(items.map((i) => [i.code, i]));
  const options = items
    .filter((i) => !i.archived_at && i.code !== selfCode && !value.includes(i.code))
    .filter((i) => !q || `${i.code} ${i.name}`.toLowerCase().includes(q.toLowerCase()))
    .slice(0, 40);
  return (
    <div className="space-y-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {value.map((code) => (
            <li key={code} className="inline-flex items-center gap-1 rounded-full border border-pm-border bg-pm-subtle px-2 py-0.5 text-xs">
              <span className="font-mono text-pm-muted">{code}</span> {byCode.get(code)?.name ?? "(unknown)"}
              {!disabled && (
                <button type="button" aria-label={`Remove dependency ${code}`} onClick={() => onChange(value.filter((v) => v !== code))} className="text-pm-muted hover:text-pm-text">
                  <X className="h-3 w-3" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {!disabled && (
        <>
          <input className={inputClass} placeholder="Search items to add…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search items to depend on" />
          {q && (
            <ul className="max-h-40 overflow-y-auto rounded-lg border border-pm-border bg-pm-card">
              {options.length === 0 && <li className="px-3 py-2 text-sm text-pm-muted">No matching items</li>}
              {options.map((i) => (
                <li key={i.code}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange([...value, i.code]);
                      setQ("");
                    }}
                    className="flex w-full gap-2 px-3 py-1.5 text-left text-sm hover:bg-pm-subtle"
                  >
                    <span className="w-8 font-mono text-pm-muted">{i.code}</span>
                    {i.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function ItemForm({
  defaultValues,
  items,
  workstreams,
  weights,
  readOnly,
  isNew,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  defaultValues: RoadmapItemInput;
  items: RoadmapItem[];
  workstreams: Workstream[];
  weights: Weights | undefined;
  readOnly?: boolean;
  isNew?: boolean;
  submitLabel: string;
  onSubmit: (values: RoadmapItemValues) => Promise<unknown>;
  onCancel?: () => void;
}) {
  const otherCodes = useMemo(
    () => new Set(items.filter((i) => i.code !== defaultValues.code).map((i) => i.code.toLowerCase())),
    [items, defaultValues.code],
  );
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<RoadmapItemInput, unknown, RoadmapItemValues>({ resolver: zodResolver(roadmapItemSchema), defaultValues });

  const v = watch();
  const preview = weights ? finalScore(v, weights, Number(v.score_adjustment) || 0) : null;
  const numberOrNull = (x: unknown) => (x === "" || x === null || x === undefined ? null : Number(x));

  const submit = handleSubmit(async (values) => {
    if (otherCodes.has(values.code.toLowerCase())) {
      setError("code", { message: "That code is already used" });
      return;
    }
    try {
      await onSubmit(values);
    } catch {
      // The mutation already rolled back and showed a toast; keep the form open for another try.
    }
  });

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      <fieldset disabled={readOnly} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-[1fr_140px]">
          <Field label="Name *" htmlFor="item-name" error={errors.name?.message}>
            <input id="item-name" data-autofocus className={inputClass} {...register("name")} />
          </Field>
          <Field label="Code *" htmlFor="item-code" error={errors.code?.message} hint={isNew ? "Suggested from the workstream" : undefined}>
            <input id="item-code" className={cn(inputClass, "font-mono")} {...register("code")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Workstream *" htmlFor="item-ws" error={errors.workstream?.message} className="sm:col-span-2">
            <select
              id="item-ws"
              className={selectClass}
              {...register("workstream", {
                onChange: (e: React.ChangeEvent<HTMLSelectElement>) => {
                  if (isNew && !dirtyFields.code) setValue("code", suggestCode(e.target.value, items));
                },
              })}
            >
              <option value="">Choose…</option>
              {workstreams.map((w) => (
                <option key={w.code} value={w.code}>
                  {w.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Horizon" htmlFor="item-horizon">
            <select id="item-horizon" className={selectClass} {...register("horizon")}>
              {HORIZONS.map((h) => (
                <option key={h.value} value={h.value}>
                  {h.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description" htmlFor="item-desc">
          <textarea id="item-desc" rows={2} className={inputClass} {...register("description")} />
        </Field>
        <Field label="Outcome (what it unlocks for the business)" htmlFor="item-outcome">
          <textarea id="item-outcome" rows={2} className={inputClass} {...register("outcome")} />
        </Field>

        <div className="rounded-xl border border-pm-border bg-pm-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">Scores</p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-pm-muted">Score</span>
              <ScoreBar score={preview} adjustment={Number(v.score_adjustment) || 0} reason={v.adjustment_reason ?? null} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CRITERIA.map((c) => (
              <Field key={c.key} label={c.label} htmlFor={`item-${c.key}`} hint={c.meaning}>
                <select id={`item-${c.key}`} className={selectClass} {...register(c.key, { setValueAs: numberOrNull })}>
                  <option value="">—</option>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-[140px_1fr]">
            <Field label="Adjustment (−20 to +20)" htmlFor="item-adj" error={errors.score_adjustment?.message}>
              <input id="item-adj" type="number" min={-20} max={20} step={1} className={inputClass} {...register("score_adjustment", { setValueAs: (x) => (x === "" ? 0 : Number(x)) })} />
            </Field>
            <Field label="Reason for the adjustment" htmlFor="item-adj-reason" error={errors.adjustment_reason?.message} hint="Required when the adjustment isn't 0 (at least 5 characters)">
              <input id="item-adj-reason" className={inputClass} {...register("adjustment_reason")} placeholder="e.g. contractual commitment" />
            </Field>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="From" htmlFor="item-from">
            <Controller
              control={control}
              name="start_date"
              render={({ field }) => (
                <input id="item-from" type="month" className={inputClass} value={dateToMonth(field.value)} onChange={(e) => field.onChange(e.target.value ? monthToFrom(e.target.value) : null)} />
              )}
            />
          </Field>
          <Field label="To" htmlFor="item-to" error={errors.end_date?.message}>
            <Controller
              control={control}
              name="end_date"
              render={({ field }) => (
                <input id="item-to" type="month" className={inputClass} value={dateToMonth(field.value)} onChange={(e) => field.onChange(e.target.value ? monthToTo(e.target.value) : null)} />
              )}
            />
          </Field>
          <Field label="Owner" htmlFor="item-owner">
            <input id="item-owner" className={inputClass} {...register("owner")} />
          </Field>
        </div>

        <Field label="Depends on" error={errors.depends_on_codes?.message}>
          <Controller
            control={control}
            name="depends_on_codes"
            render={({ field }) => <DependsOnPicker value={field.value} onChange={field.onChange} items={items} selfCode={v.code} disabled={readOnly} />}
          />
        </Field>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-[#02979D]" {...register("is_mvp")} />
          Part of the MVP
        </label>
      </fieldset>

      {!readOnly && (
        <div className="flex justify-end gap-2 border-t border-pm-border pt-4">
          {onCancel && (
            <Button onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          )}
          <Button type="submit" variant="primary" disabled={isSubmitting || (!isNew && !isDirty)}>
            {isSubmitting ? "Saving…" : submitLabel}
          </Button>
        </div>
      )}
    </form>
  );
}
