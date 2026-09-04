"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { PROVIDERS } from "@/data/providers";
import { createNote, NOTE_TYPES, ENCOUNTER_MODES, VISIT_TYPES } from "@/lib/encounter-notes-store";
import { cn } from "@/lib/utils";

const CLINIC_PROVIDERS = PROVIDERS.filter((p) => p.kind === "provider");

export function NewEncounterModal({
  patientId, patientName, onClose,
}: {
  patientId: string;
  patientName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [providerId, setProviderId] = useState("p1");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [visitType, setVisitType] = useState(VISIT_TYPES[1]);
  const [mode, setMode] = useState<(typeof ENCOUNTER_MODES)[number]>("in-person");
  const [noteType, setNoteType] = useState(NOTE_TYPES[0]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);

  function create() {
    const id = createNote({ patientId, providerId, date, visitType, mode, noteType });
    router.push(`/provider/encounters/${id}`);
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-4 bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">New encounter</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{patientName}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          <Fld label="Provider">
            <select value={providerId} onChange={(e) => setProviderId(e.target.value)} className={sel}>
              {CLINIC_PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.displayName} — {p.providerType}</option>)}
            </select>
          </Fld>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="Date"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={sel} /></Fld>
            <Fld label="Encounter mode">
              <select value={mode} onChange={(e) => setMode(e.target.value as (typeof ENCOUNTER_MODES)[number])} className={cn(sel, "capitalize")}>
                {ENCOUNTER_MODES.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
              </select>
            </Fld>
          </div>
          <Fld label="Visit type">
            <select value={visitType} onChange={(e) => setVisitType(e.target.value)} className={sel}>
              {VISIT_TYPES.map((v) => <option key={v}>{v}</option>)}
            </select>
          </Fld>
          <Fld label="Note type (template)">
            <div className="grid grid-cols-4 gap-1.5">
              {NOTE_TYPES.map((n) => (
                <button key={n} onClick={() => setNoteType(n)} className={cn("px-2 py-1.5 rounded-lg text-xs font-semibold border transition-colors", noteType === n ? "border-brand-500 bg-brand-50/60 text-brand-800 dark:bg-brand-950/20 dark:text-brand-300 dark:border-brand-600" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-brand-300")}>
                  {n}
                </button>
              ))}
            </div>
          </Fld>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
          <button onClick={create} className="px-4 py-2 rounded-lg text-sm font-semibold practmd-gradient text-white">Create</button>
        </div>
      </div>
    </div>
  );
}

const sel = "w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500";

function Fld({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}
