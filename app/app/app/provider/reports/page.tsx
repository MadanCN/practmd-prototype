"use client";

import ProviderLayout from "@/components/provider/layout/ProviderLayout";
import { BarChart3, Users, Clock, XCircle, Smile } from "lucide-react";
import { cn } from "@/lib/utils";

const VISITS_PER_WEEK = [
  { label: "Wk 1", value: 24 }, { label: "Wk 2", value: 27 }, { label: "Wk 3", value: 22 },
  { label: "Wk 4", value: 29 }, { label: "Wk 5", value: 31 }, { label: "Wk 6", value: 26 },
  { label: "Wk 7", value: 30 }, { label: "Wk 8 (current)", value: 21 },
];

const VISIT_TYPE_MIX = [
  { label: "Follow-Up", value: 42, color: "bg-emerald-500" },
  { label: "Medication Check", value: 31, color: "bg-brand-500" },
  { label: "Initial Consultation", value: 27, color: "bg-sky-500" },
];

const NO_SHOW_TREND = [
  { label: "Mar", rate: 8 }, { label: "Apr", rate: 6 }, { label: "May", rate: 9 },
  { label: "Jun", rate: 5 }, { label: "Jul", rate: 4 }, { label: "Aug", rate: 6 },
];

const OUTCOME_TREND = [
  { label: "Visit 1", phq9: 16, gad7: 14 }, { label: "Visit 2", phq9: 14, gad7: 13 },
  { label: "Visit 3", phq9: 12, gad7: 11 }, { label: "Visit 4", phq9: 10, gad7: 9 },
  { label: "Visit 5", phq9: 8, gad7: 7 }, { label: "Visit 6", phq9: 7, gad7: 6 },
];

const REFERRAL_SOURCES = [
  { label: "Primary care referral", value: 38 },
  { label: "Existing patient referral", value: 24 },
  { label: "Self-scheduled (portal)", value: 21 },
  { label: "Insurance directory", value: 11 },
  { label: "Other", value: 6 },
];

function Sparkline({ series, colorA, colorB, max }: { series: { label: string; a: number; b: number }[]; colorA: string; colorB: string; max: number }) {
  const w = 460, h = 140, pad = 20;
  const stepX = (w - pad * 2) / (series.length - 1);
  const toY = (v: number) => h - pad - (v / max) * (h - pad * 2);
  const lineA = series.map((s, i) => `${pad + i * stepX},${toY(s.a)}`).join(" ");
  const lineB = series.map((s, i) => `${pad + i * stepX},${toY(s.b)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36">
      <polyline points={lineA} fill="none" stroke={colorA} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      <polyline points={lineB} fill="none" stroke={colorB} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {series.map((s, i) => (
        <g key={s.label}>
          <circle cx={pad + i * stepX} cy={toY(s.a)} r={3} fill={colorA} />
          <circle cx={pad + i * stepX} cy={toY(s.b)} r={3} fill={colorB} />
          <text x={pad + i * stepX} y={h - 2} textAnchor="middle" className="fill-slate-400" fontSize="9">{s.label.replace("Visit ", "V")}</text>
        </g>
      ))}
    </svg>
  );
}

function Card({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
      <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{title}</h2>
      {subtitle && <p className="text-xs text-slate-400 mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

export default function ProviderReportsPage() {
  const maxVisits = Math.max(...VISITS_PER_WEEK.map((v) => v.value));

  return (
    <ProviderLayout>
      <div className="p-6 max-w-5xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Reports</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Your practice activity and patient outcomes, at a glance</p>
          </div>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6" data-tour="reports-kpis">
          {[
            { label: "Visits this month", value: "112", icon: Users, cls: "bg-brand-50 dark:bg-brand-950/30 text-brand-600 dark:text-brand-400" },
            { label: "No-Show Rate", value: "6%", icon: XCircle, cls: "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400" },
            { label: "Avg. Session Length", value: "42 min", icon: Clock, cls: "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400" },
            { label: "Patient Satisfaction", value: "4.8 / 5", icon: Smile, cls: "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400" },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-3", s.cls)}><Icon className="w-4 h-4" /></div>
                <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{s.value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-5 mb-5" data-tour="reports-charts">
          {/* Visits per week */}
          <Card title="Visits per Week" subtitle="Last 8 weeks">
            <div className="flex items-end gap-2 h-36">
              {VISITS_PER_WEEK.map((v) => (
                <div key={v.label} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{v.value}</span>
                  <div className="w-full rounded-t-md bg-brand-500" style={{ height: `${(v.value / maxVisits) * 100}%` }} />
                  <span className="text-[9px] text-slate-400 -rotate-0">{v.label.replace(" (current)", "")}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Visit type mix */}
          <Card title="Visit Type Mix" subtitle="Share of appointments, trailing 90 days">
            <div className="space-y-3.5">
              {VISIT_TYPE_MIX.map((v) => (
                <div key={v.label}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-700 dark:text-slate-300 font-medium">{v.label}</span>
                    <span className="text-slate-400">{v.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={cn("h-full rounded-full", v.color)} style={{ width: `${v.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* No-show trend */}
          <Card title="No-Show & Cancellation Rate" subtitle="Monthly, last 6 months">
            <div className="flex items-end gap-3 h-36">
              {NO_SHOW_TREND.map((v) => (
                <div key={v.label} className="flex-1 flex flex-col items-center justify-end gap-1.5">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">{v.rate}%</span>
                  <div className="w-full rounded-t-md bg-amber-400" style={{ height: `${(v.rate / 10) * 100}%` }} />
                  <span className="text-[9px] text-slate-400">{v.label}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Outcome measures */}
          <Card title="Outcome Measures" subtitle="Average PHQ-9 / GAD-7 across active patients, by visit number">
            <Sparkline series={OUTCOME_TREND.map((o) => ({ label: o.label, a: o.phq9, b: o.gad7 }))} colorA="#05a99a" colorB="#002b61" max={20} />
            <div className="flex items-center gap-4 mt-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-brand-500" /> PHQ-9 avg</span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> GAD-7 avg</span>
            </div>
          </Card>
        </div>

        {/* Referral sources */}
        <Card title="New Patient Referral Sources" subtitle="Trailing 90 days">
          <div className="space-y-3">
            {REFERRAL_SOURCES.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="text-xs text-slate-600 dark:text-slate-400 w-44 shrink-0">{r.label}</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${r.value}%` }} />
                </div>
                <span className="text-xs text-slate-400 w-8 text-right shrink-0">{r.value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </ProviderLayout>
  );
}
