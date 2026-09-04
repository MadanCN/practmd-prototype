"use client";

import { useState } from "react";
import { CalendarDays, Link, Unlink, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";

interface CalendarAccount {
  id: string;
  providerName: string;
  email: string;
  calendarName: string;
  syncDirection: "push" | "pull" | "both";
  conflictHandling: "block" | "warn";
  connected: boolean;
  lastSync: string | null;
}

const SEED: CalendarAccount[] = [
  { id: "1", providerName: "Dr. Sarah Mitchell", email: "sarah.mitchell@penfield.com", calendarName: "PractMD Appointments", syncDirection: "both", conflictHandling: "block", connected: true, lastSync: "2025-06-10T09:32:00" },
  { id: "2", providerName: "Dr. James O'Brien", email: "james.obrien@penfield.com", calendarName: "Work Calendar", syncDirection: "push", conflictHandling: "warn", connected: true, lastSync: "2025-06-10T08:15:00" },
  { id: "3", providerName: "Lisa Nguyen, LCSW", email: "lisa.nguyen@gmail.com", calendarName: "My Calendar", syncDirection: "both", conflictHandling: "block", connected: false, lastSync: null },
  { id: "4", providerName: "Dr. Marcus Reid", email: "—", calendarName: "—", syncDirection: "both", conflictHandling: "warn", connected: false, lastSync: null },
];

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

export default function GoogleCalendarScreen() {
  const [accounts, setAccounts] = useState<CalendarAccount[]>(SEED);
  const [syncing, setSyncing] = useState<string | null>(null);

  function disconnect(id: string) {
    setAccounts(p => p.map(a => a.id === id ? { ...a, connected: false, lastSync: null, email: "—", calendarName: "—" } : a));
  }

  function simulateSync(id: string) {
    setSyncing(id);
    setTimeout(() => {
      setAccounts(p => p.map(a => a.id === id ? { ...a, lastSync: new Date().toISOString() } : a));
      setSyncing(null);
    }, 1500);
  }

  function updateField<K extends keyof CalendarAccount>(id: string, key: K, value: CalendarAccount[K]) {
    setAccounts(p => p.map(a => a.id === id ? { ...a, [key]: value } : a));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <CalendarDays className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Google Calendar Integration</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Connect provider Google accounts to synchronize appointments bi-directionally.</p>
        </div>
      </div>

      {/* Provider list */}
      <div className="space-y-3">
        {accounts.map(a => (
          <div key={a.id} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {a.providerName.split(" ").map(w => w[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{a.providerName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{a.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {a.connected ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Connected
                    </div>
                    <button onClick={() => simulateSync(a.id)} disabled={syncing === a.id}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50">
                      <RefreshCw className={cn("w-3 h-3", syncing === a.id && "animate-spin")} />
                      Sync
                    </button>
                    <button onClick={() => disconnect(a.id)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30">
                      <Unlink className="w-3 h-3" />
                      Disconnect
                    </button>
                  </>
                ) : (
                  <button className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs">
                    <Link className="w-3 h-3" />
                    Connect Google Account
                  </button>
                )}
              </div>
            </div>

            {/* Config */}
            {a.connected && (
              <div className="px-4 py-3 grid grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Calendar</label>
                  <p className="text-slate-800 dark:text-slate-200">{a.calendarName}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Sync Direction</label>
                  <div className="flex gap-1">
                    {(["push", "pull", "both"] as const).map(d => (
                      <button key={d} onClick={() => updateField(a.id, "syncDirection", d)}
                        className={cn("px-2 py-0.5 rounded text-xs border transition-colors",
                          a.syncDirection === d ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-400")}>
                        {d === "push" ? "→ Google" : d === "pull" ? "← Google" : "↔ Both"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Conflict Handling</label>
                  <div className="flex gap-1">
                    {(["block", "warn"] as const).map(d => (
                      <button key={d} onClick={() => updateField(a.id, "conflictHandling", d)}
                        className={cn("px-2 py-0.5 rounded text-xs border transition-colors capitalize",
                          a.conflictHandling === d ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-400")}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                {a.lastSync && (
                  <div className="col-span-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400 dark:text-slate-500">Last synced {relativeTime(a.lastSync)}</p>
                  </div>
                )}
              </div>
            )}
            {!a.connected && (
              <div className="px-4 py-3 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
                <AlertCircle className="w-3.5 h-3.5" />
                Not connected — click &quot;Connect Google Account&quot; to authorize
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
