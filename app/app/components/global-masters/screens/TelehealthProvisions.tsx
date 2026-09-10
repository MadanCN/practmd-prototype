"use client";

import { useState } from "react";
import { Video, Search } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface Provider {
  id: string;
  name: string;
  type: string;
  npi: string;
  telehealthEnabled: boolean;
  platform: string;
  licenseState: string;
}

const SEED: Provider[] = [
  { id: "1", name: "Dr. Sarah Mitchell", type: "Psychiatrist", npi: "1234567890", telehealthEnabled: true, platform: "Integrated (PractMD)", licenseState: "NY, CT" },
  { id: "2", name: "Dr. James O'Brien", type: "Psychologist", npi: "2345678901", telehealthEnabled: true, platform: "Integrated (PractMD)", licenseState: "NY" },
  { id: "3", name: "Lisa Nguyen, LCSW", type: "Therapist", npi: "3456789012", telehealthEnabled: true, platform: "Integrated (PractMD)", licenseState: "NY, NJ" },
  { id: "4", name: "Dr. Marcus Reid", type: "Psychiatrist", npi: "4567890123", telehealthEnabled: false, platform: "—", licenseState: "NY" },
  { id: "5", name: "Amara Johnson, LPC", type: "Counselor", npi: "5678901234", telehealthEnabled: true, platform: "Zoom (External)", licenseState: "NY" },
  { id: "6", name: "Dr. Chen Wei", type: "Psychologist", npi: "6789012345", telehealthEnabled: false, platform: "—", licenseState: "NY, MA" },
];

const PLATFORMS = ["Integrated (PractMD)", "Zoom (External)", "Doxy.me (External)", "Teams (External)"];

export default function TelehealthProvisionsScreen() {
  const [providers, setProviders] = useState<Provider[]>(SEED);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [platformEdit, setPlatformEdit] = useState("");

  const filtered = !query ? providers : providers.filter(p =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    p.type.toLowerCase().includes(query.toLowerCase())
  );

  function toggleProvider(id: string) {
    setProviders(p => p.map(pr => pr.id === id ? { ...pr, telehealthEnabled: !pr.telehealthEnabled, platform: !pr.telehealthEnabled ? "Integrated (PractMD)" : "—" } : pr));
  }

  function savePlatform(id: string) {
    setProviders(p => p.map(pr => pr.id === id ? { ...pr, platform: platformEdit } : pr));
    setEditingId(null);
  }

  const enabledCount = providers.filter(p => p.telehealthEnabled).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 flex items-center justify-center flex-shrink-0">
          <Video className="w-5 h-5 text-teal-600 dark:text-teal-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Telehealth Provisions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Manage which providers are enabled for telehealth and their virtual visit platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{providers.length}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total Providers</p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{enabledCount}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">Telehealth Enabled</p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{providers.length - enabledCount}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">In-Person Only</p>
        </div>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search providers…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500" />
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Provider</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-28">NPI</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-24">License States</th>
              <th className="text-left py-3 px-4 font-medium text-slate-600 dark:text-slate-400">Platform</th>
              <th className="text-center py-3 px-4 font-medium text-slate-600 dark:text-slate-400 w-28">Telehealth</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-3 px-4">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{p.name}</p>
                  <p className="text-xs text-slate-400">{p.type}</p>
                </td>
                <td className="py-3 px-4 font-mono text-xs text-slate-500 dark:text-slate-400">{p.npi}</td>
                <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400">{p.licenseState}</td>
                <td className="py-3 px-4">
                  {editingId === p.id ? (
                    <div className="flex gap-2">
                      <select value={platformEdit} onChange={e => setPlatformEdit(e.target.value)}
                        className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-500">
                        {PLATFORMS.map(pl => <option key={pl} value={pl}>{pl}</option>)}
                      </select>
                      <button onClick={() => savePlatform(p.id)} className="text-xs px-2 py-1 rounded bg-teal-600 text-white">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400">Cancel</button>
                    </div>
                  ) : (
                    <button onClick={() => { if (p.telehealthEnabled) { setEditingId(p.id); setPlatformEdit(p.platform); } }}
                      className={cn("text-xs", p.telehealthEnabled ? "text-teal-600 dark:text-teal-400 hover:underline cursor-pointer" : "text-slate-400 cursor-default")}>
                      {p.platform}
                    </button>
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  <Toggle checked={p.telehealthEnabled} onChange={() => toggleProvider(p.id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
