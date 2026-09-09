"use client";

import { useMemo } from "react";
import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { BarChart3, Clock, FileWarning, Activity, CalendarCheck, Users, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProviderSession } from "@/lib/provider-session";
import { useEncounterNotes, getAllNotes } from "@/lib/encounter-notes-store";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { PATIENT_FORMS_BY_ID } from "@/data/provider-patient-clinical";
import { getPanelPatientIds } from "@/lib/provider-panel";
import { visitTypeDef } from "@/lib/visit-types";

function Card({ title, subtitle, icon: Icon, primary, children }: { title: string; subtitle?: string; icon: React.ElementType; primary?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-xl border p-5", primary ? "border-brand-300 dark:border-brand-800 ring-1 ring-brand-200 dark:ring-brand-900" : "border-slate-200 dark:border-slate-800")}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
      </div>
      {subtitle && <p className="text-xs text-slate-400 mb-4">{subtitle}</p>}
      {children}
    </div>
  );
}

function Bars({ data, unit = "", max }: { data: { label: string; value: number }[]; unit?: string; max?: number }) {
  const m = max ?? Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d) => (
        <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-1.5">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{d.value}{unit}</span>
          <div className="w-full rounded-t-md bg-brand-500" style={{ height: `${Math.max(4, (d.value / m) * 100)}%` }} />
          <span className="text-[9px] text-slate-400">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

function Split({ rows }: { rows: { label: string; value: number; pct: number; color?: string }[] }) {
  return (
    <div className="space-y-3">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-700 dark:text-slate-300 font-medium">{r.label}</span>
            <span className="text-slate-400">{r.value} · {r.pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div className={cn("h-full rounded-full", r.color ?? "bg-brand-500")} style={{ width: `${r.pct}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ProviderReportsPage() {
  useEncounterNotes();
  const session = useProviderSession();
  const pid = session.provider.id;

  const data = useMemo(() => {
    const notes = getAllNotes().filter((n) => n.providerId === pid);
    const appts = CC_APPOINTMENTS.filter((a) => a.providerId === pid);
    const panel = getPanelPatientIds(pid);

    // 1. Documentation timeliness — days from date-of-service to signature
    const signed = notes.filter((n) => n.status === "signed" && n.signedAt);
    const lags = signed.map((n) => Math.max(0, (new Date(n.signedAt!).getTime() - new Date(n.date + "T12:00:00").getTime()) / 86400000));
    const avgLag = lags.length ? +(lags.reduce((a, b) => a + b, 0) / lags.length).toFixed(1) : 0;
    const sameDay = lags.filter((d) => d < 1).length;

    // 2. Unsigned notes and value
    const unsigned = notes.filter((n) => n.status !== "signed");
    const unbilled = unsigned.reduce((s, n) => s + visitTypeDef(n.visitType).typicalCharge, 0);

    // 3. Encounters by visit type and mode
    const byType = new Map<string, number>();
    const byMode = new Map<string, number>();
    for (const n of notes) {
      byType.set(n.visitType, (byType.get(n.visitType) ?? 0) + 1);
      byMode.set(n.mode, (byMode.get(n.mode) ?? 0) + 1);
    }

    // 4. Contact time — sum of note durations (from procedure/visit default)
    const totalMin = notes.reduce((s, n) => s + visitTypeDef(n.visitType).defaultDurationMin, 0);

    // 5. Appointment outcomes
    const outcome = {
      completed: appts.filter((a) => a.status === "completed").length,
      cancelled: appts.filter((a) => a.status === "cancelled").length,
      noShow: appts.filter((a) => a.status === "no-show").length,
      lwbs: 0,
    };

    // 6. Panel size & composition
    const panelPatients = CC_PATIENTS.filter((p) => panel.has(p.id));
    const withInsurance = panelPatients.filter((p) => p.insuranceStatus === "active").length;

    // 7. Form completion — completed before the visit
    let assigned = 0, completedBefore = 0;
    for (const p of panelPatients) {
      for (const f of PATIENT_FORMS_BY_ID[p.id] ?? []) {
        assigned++;
        if (f.status === "completed") completedBefore++;
      }
    }

    return { notes, signed, avgLag, sameDay, unsigned, unbilled, byType, byMode, totalMin, outcome, panelPatients, withInsurance, assigned, completedBefore };
  }, [pid]);

  const timelinessTrend = [4.1, 3.4, 2.8, 3.0, 2.2, data.avgLag].map((v, i) => ({ label: i === 5 ? "Now" : `W${i + 1}`, value: +v.toFixed(1) }));
  const unbilledTrend = [3, 5, 2, 4, 3, data.unsigned.length].map((v, i) => ({ label: i === 5 ? "Now" : `W${i + 1}`, value: v }));

  const typeRows = [...data.byType.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([label, value]) => ({
    label, value, pct: Math.round((value / Math.max(1, data.notes.length)) * 100),
  }));
  const modeRows = [...data.byMode.entries()].map(([label, value]) => ({
    label: label[0].toUpperCase() + label.slice(1), value, pct: Math.round((value / Math.max(1, data.notes.length)) * 100),
  }));
  const outcomeTotal = Math.max(1, data.outcome.completed + data.outcome.cancelled + data.outcome.noShow);
  const outcomeRows = [
    { label: "Completed", value: data.outcome.completed, pct: Math.round((data.outcome.completed / outcomeTotal) * 100), color: "bg-emerald-500" },
    { label: "Cancelled", value: data.outcome.cancelled, pct: Math.round((data.outcome.cancelled / outcomeTotal) * 100), color: "bg-slate-400" },
    { label: "No-show", value: data.outcome.noShow, pct: Math.round((data.outcome.noShow / outcomeTotal) * 100), color: "bg-rose-500" },
    { label: "Left without being seen", value: data.outcome.lwbs, pct: 0, color: "bg-amber-500" },
  ];
  const formPct = data.assigned ? Math.round((data.completedBefore / data.assigned) * 100) : 0;

  return (
    <ProviderLayout>
      <div className="p-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reports</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your own activity only — nothing comparative across colleagues.</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-5" data-tour="reports-charts">
          <Card title="Documentation timeliness" subtitle="Days from check-out to signature — the number your supervisor also sees" icon={Clock} primary>
            <div className="flex items-baseline gap-3 mb-3">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.avgLag}<span className="text-base font-medium text-slate-400"> d avg</span></p>
              <p className="text-xs text-slate-400">{data.signed.length ? Math.round((data.sameDay / data.signed.length) * 100) : 0}% signed same day</p>
            </div>
            <Bars data={timelinessTrend} unit="d" />
          </Card>

          <Card title="Unsigned notes & value" subtitle="The Today tile, over time" icon={FileWarning}>
            <div className="flex items-baseline gap-3 mb-3">
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.unsigned.length}</p>
              <p className="text-xs text-amber-600 dark:text-amber-400">${data.unbilled.toLocaleString()} unbilled</p>
            </div>
            <Bars data={unbilledTrend} />
          </Card>

          <Card title="Encounters by visit type" subtitle={`${data.notes.length} documented encounters`} icon={Activity}>
            <Split rows={typeRows} />
          </Card>

          <Card title="Encounters by mode" subtitle="In-person vs virtual" icon={Activity}>
            <Split rows={modeRows} />
          </Card>

          <Card title="Contact time delivered" subtitle="Total and average, from session durations" icon={Clock}>
            <div className="flex items-baseline gap-6">
              <div><p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{Math.round(data.totalMin / 60)}<span className="text-base font-medium text-slate-400"> hrs</span></p><p className="text-xs text-slate-400">total</p></div>
              <div><p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.notes.length ? Math.round(data.totalMin / data.notes.length) : 0}<span className="text-base font-medium text-slate-400"> min</span></p><p className="text-xs text-slate-400">average / encounter</p></div>
            </div>
          </Card>

          <Card title="Appointment outcomes" subtitle="Completed, cancelled, no-show, left without being seen" icon={CalendarCheck}>
            <Split rows={outcomeRows} />
          </Card>

          <Card title="Panel size & composition" subtitle="How many patients, and how recently seen" icon={Users}>
            <div className="flex items-baseline gap-6">
              <div><p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.panelPatients.length}</p><p className="text-xs text-slate-400">patients in panel</p></div>
              <div><p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{data.withInsurance}</p><p className="text-xs text-slate-400">with active coverage</p></div>
            </div>
          </Card>

          <Card title="Form completion" subtitle="How often assigned forms arrive completed before the visit" icon={ClipboardCheck}>
            <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-2">{formPct}%</p>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${formPct}%` }} />
            </div>
            <p className="text-xs text-slate-400 mt-1.5">{data.completedBefore} of {data.assigned} assigned forms completed</p>
          </Card>
        </div>
      </div>
    </ProviderLayout>
  );
}
