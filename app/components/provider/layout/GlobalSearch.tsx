"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, CornerDownLeft } from "lucide-react";
import { useProviderSession } from "@/lib/provider-session";
import { searchProvider, type SearchGroup, type SearchResult } from "@/lib/provider-search";
import { addRecent } from "@/lib/provider-recents";
import { cn } from "@/lib/utils";

const GROUP_ORDER: SearchGroup[] = ["Patients", "Appointments", "Notes", "Tasks", "Messages"];

export function GlobalSearch() {
  const router = useRouter();
  const { provider, capabilities } = useProviderSession();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => (q.trim().length >= 2 ? searchProvider(q, { providerId: provider.id, canViewAll: capabilities.can_view_all_patients }) : []),
    [q, provider.id, capabilities.can_view_all_patients],
  );

  const flat = results;
  const grouped = useMemo(() => {
    const m = new Map<SearchGroup, SearchResult[]>();
    for (const r of results) {
      if (!m.has(r.group)) m.set(r.group, []);
      m.get(r.group)!.push(r);
    }
    return GROUP_ORDER.filter((g) => m.has(g)).map((g) => [g, m.get(g)!] as const);
  }, [results]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
        setTimeout(() => inputRef.current?.focus(), 10);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => setActive(0), [q]);

  function go(r: SearchResult) {
    addRecent({ kind: r.group === "Patients" ? "patient" : r.group === "Notes" ? "note" : r.group === "Appointments" ? "appointment" : "thread", refId: r.id, title: r.title, href: r.href });
    setOpen(false);
    setQ("");
    router.push(r.href);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(true);
          setTimeout(() => inputRef.current?.focus(), 10);
        }}
        className="flex items-center gap-2 w-44 lg:w-56 shrink-0 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-1.5 border border-slate-200 dark:border-slate-700 hover:border-brand-400 transition-colors text-left"
      >
        <Search className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="flex-1 text-sm text-slate-400 truncate">Search…</span>
        <kbd className="hidden lg:inline text-[10px] font-sans font-medium text-slate-400 border border-slate-200 dark:border-slate-600 rounded px-1">⌘K</kbd>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/20 dark:bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed left-1/2 -translate-x-1/2 top-20 z-50 w-[92vw] max-w-xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 border-b border-slate-100 dark:border-slate-800">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, flat.length - 1)); }
                  if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
                  if (e.key === "Enter" && flat[active]) go(flat[active]);
                }}
                placeholder="Search your patients, appointments, notes, tasks, messages…"
                className="flex-1 bg-transparent py-3.5 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 outline-none"
              />
            </div>
            <div className="max-h-[60vh] overflow-y-auto py-2">
              {q.trim().length < 2 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-400">Type at least two characters to search.</p>
              ) : flat.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-slate-400">Nothing in your workspace matches “{q}”.</p>
              ) : (
                grouped.map(([group, items]) => (
                  <div key={group} className="mb-1">
                    <p className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{group}</p>
                    {items.map((r) => {
                      const idx = flat.indexOf(r);
                      return (
                        <button
                          key={r.id}
                          onMouseEnter={() => setActive(idx)}
                          onClick={() => go(r)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2 text-left",
                            idx === active ? "bg-brand-50 dark:bg-brand-950/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{r.title}</p>
                            <p className="text-xs text-slate-400 truncate">{r.subtitle}</p>
                          </div>
                          {idx === active && <CornerDownLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
