"use client";

import { AlertTriangle, CalendarClock, Coffee, Copy, Lock, Plus, X } from "lucide-react";
import { CLINICS, DAYS, findLocation, type DayName } from "@/data/clinics";
import type { WorkingHour, WorkingHourSegment } from "@/data/providers";
import { CONSULT_MODES, type ConsultMode } from "@/data/provider-record";
import { defaultHoursFromClinics, segmentIssues } from "@/lib/provider-form";
import { todayIso } from "@/lib/provider-validation";
import { WorkingHoursReadOnly } from "@/components/ui/WorkingHoursEditor";
import { cn } from "@/lib/utils";
import BlockerList from "./BlockerList";
import { Callout, Field, INPUT, INPUT_ERR, SectionCard } from "./fields";
import type { SectionProps } from "./types";

const mins = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const TIME = "px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60";

/** Default break inside a segment: 12:00–13:00 if it fits, otherwise 30 min around the middle. */
function defaultBreak(s: WorkingHourSegment): [string, string] | null {
  const a = mins(s.startTime), b = mins(s.endTime);
  if (b - a < 45) return null;
  if (a <= 12 * 60 - 15 && b >= 13 * 60 + 15) return ["12:00", "13:00"];
  const mid = Math.round((a + b) / 2 / 15) * 15;
  return [hhmm(mid - 15), hhmm(mid + 15)];
}

export default function ScheduleSection(p: SectionProps) {
  const { form, update, err, v, mode, original } = p;
  const locked = v.pendingLock;

  const clinicsSelected = CLINICS.filter((c) => form.clinicAccess.includes(c.id));
  const allowedIds = clinicsSelected.flatMap((c) => c.locations.map((l) => l.id));
  const clinicDefault = defaultHoursFromClinics(form.clinicAccess);

  const dayOf = (day: DayName): WorkingHour => form.workingHours.find((h) => h.day === day) ?? { day, isWorking: false, segments: [] };
  const setDay = (day: DayName, next: WorkingHour) =>
    update((f) => ({ ...f, workingHours: DAYS.map((d) => (d === day ? next : f.workingHours.find((h) => h.day === d) ?? { day: d, isWorking: false, segments: [] })) }));

  function toggleDay(day: DayName, on: boolean) {
    const h = dayOf(day);
    const seed = clinicDefault.find((d) => d.day === day);
    const segments = on
      ? h.segments.length ? h.segments
        : seed && seed.segments.length ? seed.segments
        : [{ locationId: allowedIds[0] ?? "", startTime: "09:00", endTime: "17:00" }]
      : [];
    setDay(day, { day, isWorking: on, segments });
  }
  const patchSeg = (day: DayName, i: number, c: Partial<WorkingHourSegment>) => {
    const h = dayOf(day);
    setDay(day, { ...h, segments: h.segments.map((s, j) => (j === i ? { ...s, ...c } : s)) });
  };
  function addHours(day: DayName) {
    const h = dayOf(day);
    const last = h.segments[h.segments.length - 1];
    const start = last ? mins(last.endTime) : 9 * 60;
    const end = Math.min(start + 120, 23 * 60 + 30);
    setDay(day, { ...h, segments: [...h.segments, { locationId: last?.locationId ?? allowedIds[0] ?? "", startTime: hhmm(start), endTime: hhmm(Math.max(end, start + 15)) }] });
  }
  function addBreak(day: DayName, i: number) {
    const h = dayOf(day);
    const s = h.segments[i];
    const br = defaultBreak(s);
    if (!br) return;
    setDay(day, { ...h, segments: [...h.segments.slice(0, i), { ...s, endTime: br[0] }, { ...s, startTime: br[1] }, ...h.segments.slice(i + 1)] });
  }
  function removeBreak(day: DayName, i: number) {
    const h = dayOf(day);
    const a = h.segments[i], b = h.segments[i + 1];
    setDay(day, { ...h, segments: [...h.segments.slice(0, i), { ...a, endTime: b.endTime }, ...h.segments.slice(i + 2)] });
  }
  function removeSeg(day: DayName, i: number) {
    const h = dayOf(day);
    setDay(day, { ...h, segments: h.segments.filter((_, j) => j !== i) });
  }
  function copyToAll(day: DayName) {
    const src = dayOf(day);
    update((f) => ({
      ...f,
      workingHours: DAYS.map((d) => {
        const cur = f.workingHours.find((h) => h.day === d) ?? { day: d, isWorking: false, segments: [] };
        return d !== day && cur.isWorking ? { ...cur, segments: src.segments.map((s) => ({ ...s })) } : cur;
      }),
    }));
  }

  function toggleMode(m: ConsultMode) {
    update((f) => ({ ...f, availableFor: f.availableFor.includes(m) ? f.availableFor.filter((x) => x !== m) : [...f.availableFor, m] }));
  }

  const otherCheckedDays = (day: DayName) => form.workingHours.some((h) => h.isWorking && h.day !== day);
  const locationName = (id: string) => { const l = findLocation(id); return l ? `${l.name}` : id; };
  const banner = v.advisories.videoNoLicense;

  return (
    <SectionCard id="schedule" title="Schedule" subtitle="How this provider can be booked, and when.">
      <div className="space-y-6">
        <Field label="Provider available for">
          <div className="flex flex-wrap gap-2">
            {CONSULT_MODES.map((m) => (
              <label key={m.key} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer text-sm",
                form.availableFor.includes(m.key) ? "border-blue-300 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 text-slate-800 dark:text-slate-200" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400")}>
                <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={form.availableFor.includes(m.key)} onChange={() => toggleMode(m.key)} />
                {m.label}
              </label>
            ))}
          </div>
          {banner && (
            <Callout tone="warn" className="mt-2 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-px" /><span>{banner.msg}</span></Callout>
          )}
        </Field>

        <div>
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Working hours</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {mode === "add" ? "Pre-filled from the clinic's working hours at its primary location — adjust as needed." : "Each day can span locations and have breaks."}
              </p>
            </div>
          </div>

          {locked && original?.pendingWorkingHours && (
            <div className="mb-3 space-y-3">
              <Callout tone="info" className="flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-px" />
                <span><strong>A working-hours change is scheduled from {original.pendingWorkingHours.effectiveFrom}</strong> (set by {original.pendingWorkingHours.scheduledBy}). Hours can&apos;t be changed again until it takes effect.</span>
              </Callout>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                  <p className="text-xs font-semibold text-slate-500 mb-2">Current hours</p>
                  <WorkingHoursReadOnly hours={original.workingHours} locations={CLINICS.flatMap((c) => c.locations)} />
                </div>
                <div className="rounded-xl border border-blue-200 dark:border-blue-900 p-4 bg-blue-50/30 dark:bg-blue-950/10">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">From {original.pendingWorkingHours.effectiveFrom}</p>
                  <WorkingHoursReadOnly hours={original.pendingWorkingHours.hours} locations={CLINICS.flatMap((c) => c.locations)} />
                </div>
              </div>
            </div>
          )}

          {!locked && (
            !form.clinicAccess.length ? (
              <Callout tone="warn">Select at least one clinic under <strong>Access &amp; Services → Clinic access</strong> — working hours are set per location.</Callout>
            ) : (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {DAYS.map((day) => {
                  const h = dayOf(day);
                  const issues = h.isWorking ? segmentIssues(h, allowedIds) : {};
                  const dayErr = err(`hours.${day}`);
                  return (
                    <div key={day} className="px-4 py-3 flex gap-4 items-start">
                      <label className="w-28 shrink-0 flex items-center gap-2 pt-1.5 cursor-pointer">
                        <input type="checkbox" className="accent-blue-600 w-4 h-4" checked={h.isWorking} onChange={(e) => toggleDay(day, e.target.checked)} aria-label={`Works ${day}`} />
                        <span className={cn("text-sm font-medium", h.isWorking ? "text-slate-800 dark:text-slate-200" : "text-slate-400")}>{day}</span>
                      </label>
                      {h.isWorking ? (
                        <div className="flex-1 min-w-0 space-y-1.5">
                          {h.segments.map((s, i) => {
                            const next = h.segments[i + 1];
                            const sameLoc = next && next.locationId === s.locationId && mins(next.startTime) > mins(s.endTime);
                            const issue = issues[i];
                            const inList = allowedIds.includes(s.locationId);
                            return (
                              <div key={i}>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <select aria-label="Location" value={s.locationId} onChange={(e) => patchSeg(day, i, { locationId: e.target.value })}
                                    className={cn(TIME, "min-w-[150px]", !inList && "border-rose-300 dark:border-rose-800")}>
                                    {!inList && <option value={s.locationId}>{locationName(s.locationId)} — clinic removed</option>}
                                    {clinicsSelected.map((c) => (
                                      <optgroup key={c.id} label={c.name}>
                                        {c.locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                                      </optgroup>
                                    ))}
                                  </select>
                                  <input aria-label="From time" type="time" value={s.startTime} onChange={(e) => patchSeg(day, i, { startTime: e.target.value })} className={cn(TIME, issue && "border-rose-300 dark:border-rose-800")} />
                                  <span className="text-slate-400 text-sm">to</span>
                                  <input aria-label="To time" type="time" value={s.endTime} onChange={(e) => patchSeg(day, i, { endTime: e.target.value })} className={cn(TIME, issue && "border-rose-300 dark:border-rose-800")} />
                                  {defaultBreak(s) && (
                                    <button type="button" onClick={() => addBreak(day, i)} title="Split this block around a break" className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                                      <Coffee className="w-3.5 h-3.5" /> Add break
                                    </button>
                                  )}
                                  {h.segments.length > 1 && (
                                    <button type="button" aria-label="Remove hours" onClick={() => removeSeg(day, i)} className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"><X className="w-3.5 h-3.5" /></button>
                                  )}
                                </div>
                                {issue && <p role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400">{issue}</p>}
                                {sameLoc && (
                                  <div className="ml-1 my-1 inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
                                    <Coffee className="w-3 h-3" /> Break
                                    <input aria-label="Break start" type="time" value={s.endTime} onChange={(e) => patchSeg(day, i, { endTime: e.target.value })} className="bg-transparent border-b border-amber-300 dark:border-amber-800 text-xs w-[88px] focus:outline-none" />
                                    –
                                    <input aria-label="Break end" type="time" value={next.startTime} onChange={(e) => patchSeg(day, i + 1, { startTime: e.target.value })} className="bg-transparent border-b border-amber-300 dark:border-amber-800 text-xs w-[88px] focus:outline-none" />
                                    <button type="button" aria-label="Remove break" onClick={() => removeBreak(day, i)} className="text-amber-600 hover:text-rose-600"><X className="w-3 h-3" /></button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div className="flex items-center gap-4 pt-0.5">
                            <button type="button" onClick={() => addHours(day)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"><Plus className="w-3 h-3" /> Add hours</button>
                            <button type="button" disabled={!otherCheckedDays(day)} onClick={() => copyToAll(day)} title="Copy this day's hours to every other ticked day"
                              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-40 disabled:no-underline disabled:cursor-not-allowed"><Copy className="w-3 h-3" /> Copy to all days</button>
                          </div>
                          {dayErr && <p role="alert" className="text-xs text-rose-600">{dayErr}</p>}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 pt-2">Not working</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
          {err("hours") && !locked && form.clinicAccess.length > 0 && <p role="alert" className="mt-2 text-xs text-rose-600">{err("hours")}</p>}

          {/* Edit-only: when do the changed hours take effect? */}
          {mode === "edit" && v.hoursChanged && !locked && (
            <div className="mt-4 space-y-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 p-4">
              <div className="flex items-start gap-3">
                <CalendarClock className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">You changed the working hours</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Choose the date they take effect. Only one scheduled change can exist per provider — no further hour changes until this one is live.</p>
                </div>
              </div>
              <Field label="Apply from" required htmlFor="applyFrom" error={err("hours.apply")} className="max-w-xs">
                <input id="applyFrom" type="date" min={todayIso()} value={form.applyFrom} onChange={(e) => p.set("applyFrom", e.target.value)}
                  onBlur={() => p.touch("hours.apply")} className={cn(INPUT, err("hours.apply") && INPUT_ERR)} />
              </Field>
              <BlockerList title={`${v.hoursStranded.length} confirmed appointment${v.hoursStranded.length === 1 ? "" : "s"} fall outside the new hours — tap to see them`} appointments={v.hoursStranded} />
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
