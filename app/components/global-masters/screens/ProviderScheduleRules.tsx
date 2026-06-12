"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Calendar, ChevronRight } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const DAY_LABELS: Record<DayKey, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

interface DayConfig {
  enabled: boolean;
  maxAppts: number;
}

interface ScheduleRule {
  id: string;
  clinic: string;
  provider: string;
  visitType: string;
  dayConfig: Record<DayKey, DayConfig>;
}

const DEFAULT_DAY_CONFIG: Record<DayKey, DayConfig> = {
  Mon: { enabled: true, maxAppts: 8 },
  Tue: { enabled: true, maxAppts: 8 },
  Wed: { enabled: true, maxAppts: 8 },
  Thu: { enabled: true, maxAppts: 8 },
  Fri: { enabled: true, maxAppts: 8 },
  Sat: { enabled: false, maxAppts: 0 },
  Sun: { enabled: false, maxAppts: 0 },
};

const SEED: ScheduleRule[] = [
  {
    id: "r1",
    clinic: "Penfield Psychiatry",
    provider: "Dr. Sarah Mitchell",
    visitType: "All Types",
    dayConfig: {
      Mon: { enabled: true, maxAppts: 8 },
      Tue: { enabled: true, maxAppts: 8 },
      Wed: { enabled: true, maxAppts: 6 },
      Thu: { enabled: true, maxAppts: 8 },
      Fri: { enabled: true, maxAppts: 4 },
      Sat: { enabled: false, maxAppts: 0 },
      Sun: { enabled: false, maxAppts: 0 },
    },
  },
  {
    id: "r2",
    clinic: "All Clinics",
    provider: "All Providers",
    visitType: "Telehealth",
    dayConfig: {
      Mon: { enabled: true, maxAppts: 10 },
      Tue: { enabled: true, maxAppts: 10 },
      Wed: { enabled: true, maxAppts: 10 },
      Thu: { enabled: true, maxAppts: 10 },
      Fri: { enabled: true, maxAppts: 10 },
      Sat: { enabled: false, maxAppts: 0 },
      Sun: { enabled: false, maxAppts: 0 },
    },
  },
];

const CLINIC_OPTIONS = ["All Clinics", "Penfield Psychiatry", "New Hartford Psychological Services"];
const PROVIDER_OPTIONS = ["All Providers", "Dr. Sarah Mitchell", "Dr. James O'Brien"];
const VISIT_TYPE_OPTIONS = ["All Types", "Initial Consultation", "Follow-Up", "Therapy Session", "Medication Check"];

type DrawerStep = 1 | 2;

function copyDayConfig(dc: Record<DayKey, DayConfig>): Record<DayKey, DayConfig> {
  const copy: Partial<Record<DayKey, DayConfig>> = {};
  for (const day of DAYS) {
    copy[day] = { ...dc[day] };
  }
  return copy as Record<DayKey, DayConfig>;
}

export default function ProviderScheduleRulesScreen() {
  const [rules, setRules] = useState<ScheduleRule[]>(SEED);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ScheduleRule | null>(null);
  const [step, setStep] = useState<DrawerStep>(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Step 1 form state
  const [clinic, setClinic] = useState(CLINIC_OPTIONS[0]);
  const [provider, setProvider] = useState(PROVIDER_OPTIONS[0]);
  const [visitType, setVisitType] = useState(VISIT_TYPE_OPTIONS[0]);

  // Step 2 form state
  const [dayConfig, setDayConfig] = useState<Record<DayKey, DayConfig>>(copyDayConfig(DEFAULT_DAY_CONFIG));

  function openAdd() {
    setEditing(null);
    setClinic(CLINIC_OPTIONS[0]);
    setProvider(PROVIDER_OPTIONS[0]);
    setVisitType(VISIT_TYPE_OPTIONS[0]);
    setDayConfig(copyDayConfig(DEFAULT_DAY_CONFIG));
    setStep(1);
    setDrawerOpen(true);
  }

  function openEdit(rule: ScheduleRule) {
    setEditing(rule);
    setClinic(rule.clinic);
    setProvider(rule.provider);
    setVisitType(rule.visitType);
    setDayConfig(copyDayConfig(rule.dayConfig));
    setStep(1);
    setDrawerOpen(true);
  }

  function handleContinue() {
    setStep(2);
  }

  function handleSave() {
    const newRule: ScheduleRule = {
      id: editing ? editing.id : crypto.randomUUID(),
      clinic,
      provider,
      visitType,
      dayConfig,
    };
    if (editing) {
      setRules((prev) => prev.map((r) => r.id === editing.id ? newRule : r));
    } else {
      setRules((prev) => [...prev, newRule]);
    }
    setDrawerOpen(false);
  }

  function handleDelete(id: string) {
    setRules((prev) => prev.filter((r) => r.id !== id));
    setDeleteId(null);
  }

  function setDayEnabled(day: DayKey, enabled: boolean) {
    setDayConfig((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled, maxAppts: enabled ? (prev[day].maxAppts || 8) : 0 },
    }));
  }

  function setDayMaxAppts(day: DayKey, maxAppts: number) {
    setDayConfig((prev) => ({
      ...prev,
      [day]: { ...prev[day], maxAppts },
    }));
  }

  function enabledDaysCount(rule: ScheduleRule) {
    return DAYS.filter((d) => rule.dayConfig[d].enabled).length;
  }

  const selectClass = cn(
    "w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700",
    "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
    "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  );

  const drawerFooter = step === 1 ? (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={() => setDrawerOpen(false)}
        className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        Cancel
      </button>
      <button
        onClick={handleContinue}
        className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
      >
        Continue
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  ) : (
    <div className="flex items-center justify-between gap-3">
      <button
        onClick={() => setStep(1)}
        className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
      >
        Back
      </button>
      <div className="flex gap-3">
        <button
          onClick={() => setDrawerOpen(false)}
          className="px-4 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
        >
          {editing ? "Save Changes" : "Create Rule"}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
            <Calendar className="w-[18px] h-[18px] text-blue-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Provider Schedule Rules</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Define per-provider, per-clinic working day schedules and max appointment limits</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Rules table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                {["#", "Clinic", "Provider", "Visit Type", "Working Days", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/60">
              {rules.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                    No schedule rules yet. Click Add Rule to create one.
                  </td>
                </tr>
              )}
              {rules.map((rule, idx) => (
                <tr key={rule.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 text-slate-400 text-xs">{idx + 1}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-800 dark:text-slate-200">{rule.clinic}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{rule.provider}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{rule.visitType}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {DAYS.map((day) => (
                        <span
                          key={day}
                          className={cn(
                            "inline-flex items-center justify-center w-7 h-6 rounded text-xs font-medium",
                            rule.dayConfig[day].enabled
                              ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600"
                          )}
                          title={`${DAY_LABELS[day]}: ${rule.dayConfig[day].enabled ? `${rule.dayConfig[day].maxAppts} max` : "off"}`}
                        >
                          {day[0]}
                        </span>
                      ))}
                      <span className="ml-2 text-xs text-slate-400">{enabledDaysCount(rule)} days</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(rule)}
                        title="Edit"
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(rule.id)}
                        title="Delete"
                        className="w-7 h-7 flex items-center justify-center rounded text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirm modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 w-80">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Delete Schedule Rule</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
              This will permanently remove the schedule rule. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-3 py-1.5 text-sm rounded-lg bg-red-600 hover:bg-red-700 text-white"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? "Edit Schedule Rule" : "Add Schedule Rule"}
        description={step === 1 ? "Step 1 of 2 — Select clinic, provider, and visit type" : "Step 2 of 2 — Configure working days and max appointments"}
        footer={drawerFooter}
        width="w-[520px]"
      >
        {step === 1 ? (
          <div className="space-y-5">
            {/* Clinic */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Clinic
              </label>
              <select
                value={clinic}
                onChange={(e) => setClinic(e.target.value)}
                className={selectClass}
              >
                {CLINIC_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Provider
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className={selectClass}
              >
                {PROVIDER_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>

            {/* Visit Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Visit Type
              </label>
              <select
                value={visitType}
                onChange={(e) => setVisitType(e.target.value)}
                className={selectClass}
              >
                {VISIT_TYPE_OPTIONS.map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Toggle each day on or off, and set the maximum number of appointments allowed per day.
            </p>

            {/* Summary strip */}
            <div className="flex flex-wrap gap-2 mb-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-500 dark:text-slate-400">
              <span className="font-medium text-slate-700 dark:text-slate-300">{clinic}</span>
              <span>·</span>
              <span>{provider}</span>
              <span>·</span>
              <span>{visitType}</span>
            </div>

            {/* Day rows */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
              {DAYS.map((day) => {
                const dc = dayConfig[day];
                return (
                  <div key={day} className="flex items-center gap-4 px-4 py-3">
                    <span className="w-24 text-sm font-medium text-slate-700 dark:text-slate-300 shrink-0">
                      {DAY_LABELS[day]}
                    </span>
                    <Toggle
                      checked={dc.enabled}
                      onChange={(v) => setDayEnabled(day, v)}
                    />
                    {dc.enabled ? (
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-slate-500 dark:text-slate-400 shrink-0">Max appts:</span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setDayMaxAppts(day, Math.max(1, dc.maxAppts - 1))}
                            className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={50}
                            value={dc.maxAppts}
                            onChange={(e) => setDayMaxAppts(day, Math.min(50, Math.max(1, Number(e.target.value))))}
                            className="w-14 px-2 py-1 text-center text-sm rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <button
                            type="button"
                            onClick={() => setDayMaxAppts(day, Math.min(50, dc.maxAppts + 1))}
                            className="w-6 h-6 flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-sm"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">Off</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
