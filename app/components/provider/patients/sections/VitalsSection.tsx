"use client";

import { useState } from "react";
import { Plus, HeartPulse, X } from "lucide-react";
import { PATIENT_VITALS_BY_ID, type VitalsReading } from "@/data/provider-patient-clinical";
import type { PatientProfile } from "@/data/provider-patients";

function fmtWhen(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

const TILE_FIELDS: { key: keyof VitalsReading; label: string; unit: string; fmt?: (v: number) => string }[] = [
  { key: "weightLb", label: "Weight", unit: "lb" },
  { key: "heightIn", label: "Height", unit: "in" },
  { key: "bmi", label: "BMI", unit: "" },
  { key: "bmiPercentile", label: "BMI %ile", unit: "%" },
  { key: "pulse", label: "Pulse", unit: "bpm" },
  { key: "respiration", label: "Respiration", unit: "/min" },
  { key: "tempF", label: "Temperature", unit: "°F" },
  { key: "spo2", label: "SpO₂", unit: "%" },
  { key: "fio2", label: "O₂ / FiO₂", unit: "%" },
  { key: "painScore", label: "Pain score", unit: "/10" },
  { key: "waistCircumferenceIn", label: "Waist", unit: "in" },
  { key: "headCircumferenceCm", label: "Head circ.", unit: "cm" },
];

export function VitalsSection({ patient }: { patient: PatientProfile }) {
  const [readings, setReadings] = useState<VitalsReading[]>(() =>
    [...(PATIENT_VITALS_BY_ID[patient.id] ?? [])].sort((a, b) => b.recordedAt.localeCompare(a.recordedAt)),
  );
  const [adding, setAdding] = useState(false);
  const [d, setD] = useState<Record<string, string>>({});

  const latest = readings[0];

  function addReading() {
    const num = (k: string) => (d[k] ? Number(d[k]) : undefined);
    const w = num("weightLb"); const h = num("heightIn");
    setReadings((prev) => [{
      id: `v-new-${Date.now()}`,
      recordedAt: new Date().toISOString(),
      recordedBy: "Dr. Sarah Mitchell",
      weightLb: w, heightIn: h,
      bmi: w && h ? +((w / (h * h)) * 703).toFixed(1) : undefined,
      systolic: num("systolic"), diastolic: num("diastolic"),
      pulse: num("pulse"), respiration: num("respiration"), tempF: num("tempF"),
      spo2: num("spo2"), fio2: num("fio2"), painScore: num("painScore"),
      waistCircumferenceIn: num("waist"), headCircumferenceCm: num("head"),
    }, ...prev]);
    setD({});
    setAdding(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {latest ? `Latest recorded ${fmtWhen(latest.recordedAt)} by ${latest.recordedBy}` : "No vitals recorded"}
        </p>
        <button onClick={() => setAdding((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white">
          <Plus className="w-3.5 h-3.5" /> Record vitals
        </button>
      </div>

      {adding && (
        <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">New vitals reading</h3>
            <button onClick={() => setAdding(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              ["weightLb", "Weight (lb)"], ["heightIn", "Height (in)"], ["systolic", "Systolic"], ["diastolic", "Diastolic"],
              ["pulse", "Pulse"], ["respiration", "Respiration"], ["tempF", "Temp (°F)"], ["spo2", "SpO₂ (%)"],
              ["fio2", "FiO₂ (%)"], ["painScore", "Pain (0–10)"], ["waist", "Waist (in)"], ["head", "Head circ. (cm)"],
            ].map(([k, label]) => (
              <div key={k}>
                <label className="block text-[10px] font-semibold uppercase tracking-wide text-slate-400 mb-0.5">{label}</label>
                <input inputMode="decimal" value={d[k] ?? ""} onChange={(e) => setD({ ...d, [k]: e.target.value })}
                  className="w-full px-2 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Cancel</button>
            <button onClick={addReading} className="px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white">Save reading</button>
          </div>
        </div>
      )}

      {!latest ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          <HeartPulse className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400">No vitals on file for {patient.firstName}.</p>
        </div>
      ) : (
        <>
          {/* Latest reading tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 mb-3">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 col-span-2 sm:col-span-1">
              <p className="text-[11px] text-slate-400">Blood pressure</p>
              <p className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {latest.systolic ?? "—"}<span className="text-slate-400 font-normal">/</span>{latest.diastolic ?? "—"}
                <span className="text-xs font-normal text-slate-400 ml-1">mmHg</span>
              </p>
            </div>
            {TILE_FIELDS.map((f) => {
              const v = latest[f.key] as number | undefined;
              if (v === undefined) return null;
              return (
                <div key={String(f.key)} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
                  <p className="text-[11px] text-slate-400">{f.label}</p>
                  <p className="text-lg font-bold text-slate-800 dark:text-slate-200">{v}<span className="text-xs font-normal text-slate-400 ml-1">{f.unit}</span></p>
                </div>
              );
            })}
          </div>

          {/* History */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-left">
                  {["Date", "By", "Weight", "BMI", "BP", "Pulse", "Resp", "Temp", "SpO₂", "Pain"].map((h) => <th key={h} className="px-3 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400">{h}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                {readings.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2.5 whitespace-nowrap">{fmtWhen(r.recordedAt)}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-slate-400">{r.recordedBy}</td>
                    <td className="px-3 py-2.5">{r.weightLb ?? "—"} lb</td>
                    <td className="px-3 py-2.5">{r.bmi ?? "—"}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{r.systolic ?? "—"}/{r.diastolic ?? "—"}</td>
                    <td className="px-3 py-2.5">{r.pulse ?? "—"}</td>
                    <td className="px-3 py-2.5">{r.respiration ?? "—"}</td>
                    <td className="px-3 py-2.5">{r.tempF ?? "—"}</td>
                    <td className="px-3 py-2.5">{r.spo2 ?? "—"}%</td>
                    <td className="px-3 py-2.5">{r.painScore ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
