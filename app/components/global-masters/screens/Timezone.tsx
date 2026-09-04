"use client";

import { useState } from "react";
import { Globe, Save, CheckCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const TIMEZONES = [
  { group: "US & Canada", zones: [
    { label: "Eastern Time (ET)", value: "America/New_York", offset: "UTC-5/UTC-4" },
    { label: "Central Time (CT)", value: "America/Chicago", offset: "UTC-6/UTC-5" },
    { label: "Mountain Time (MT)", value: "America/Denver", offset: "UTC-7/UTC-6" },
    { label: "Pacific Time (PT)", value: "America/Los_Angeles", offset: "UTC-8/UTC-7" },
    { label: "Alaska Time (AKT)", value: "America/Anchorage", offset: "UTC-9/UTC-8" },
    { label: "Hawaii Time (HT)", value: "Pacific/Honolulu", offset: "UTC-10" },
    { label: "Atlantic Time (AT)", value: "America/Halifax", offset: "UTC-4/UTC-3" },
  ]},
  { group: "Europe", zones: [
    { label: "Greenwich Mean Time (GMT)", value: "Europe/London", offset: "UTC+0/UTC+1" },
    { label: "Central European Time (CET)", value: "Europe/Paris", offset: "UTC+1/UTC+2" },
    { label: "Eastern European Time (EET)", value: "Europe/Helsinki", offset: "UTC+2/UTC+3" },
  ]},
  { group: "Asia & Pacific", zones: [
    { label: "India Standard Time (IST)", value: "Asia/Kolkata", offset: "UTC+5:30" },
    { label: "Singapore Time (SGT)", value: "Asia/Singapore", offset: "UTC+8" },
    { label: "Japan Standard Time (JST)", value: "Asia/Tokyo", offset: "UTC+9" },
    { label: "Australia Eastern (AEST)", value: "Australia/Sydney", offset: "UTC+10/UTC+11" },
  ]},
];

const ALL_ZONES = TIMEZONES.flatMap(g => g.zones);

export default function TimezoneScreen() {
  const [selected, setSelected] = useState("America/New_York");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const filtered = query
    ? ALL_ZONES.filter(z =>
        z.label.toLowerCase().includes(query.toLowerCase()) ||
        z.value.toLowerCase().includes(query.toLowerCase()) ||
        z.offset.toLowerCase().includes(query.toLowerCase())
      )
    : null;

  const selectedZone = ALL_ZONES.find(z => z.value === selected);

  return (
    <div className="max-w-xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Timezone</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Set the organization&apos;s default timezone. This affects scheduling, notifications, and all time displays.
          </p>
        </div>
      </div>

      {/* Current selection */}
      {selectedZone && (
        <div className="flex items-center gap-3 p-4 rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30">
          <Globe className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{selectedZone.label}</p>
            <p className="text-xs text-blue-600 dark:text-blue-400">{selectedZone.value} · {selectedZone.offset}</p>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search timezones…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Zone list */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {(filtered ? [{ group: "Results", zones: filtered }] : TIMEZONES).map(group => (
          <div key={group.group}>
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              {group.group}
            </div>
            {group.zones.map(zone => (
              <button
                key={zone.value}
                onClick={() => { setSelected(zone.value); setSaved(false); }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/40",
                  selected === zone.value && "bg-blue-50 dark:bg-blue-950/20"
                )}
              >
                <div>
                  <p className={cn("text-sm font-medium", selected === zone.value ? "text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-100")}>
                    {zone.label}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{zone.value}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 dark:text-slate-500">{zone.offset}</span>
                  {selected === zone.value && (
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        ))}
        {filtered?.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400 dark:text-slate-500">No timezones found</div>
        )}
      </div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Timezone
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Timezone saved
          </div>
        )}
      </div>
    </div>
  );
}
