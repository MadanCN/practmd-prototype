"use client";

import { useState } from "react";
import { FolderOpen, Upload, Download, Eye, FileText, FlaskConical, Image, FileCheck, Pill, Plus, X } from "lucide-react";
import { PATIENT_DOCUMENTS, type PatientDocument } from "@/data/patient-portal";
import { cn } from "@/lib/utils";

const TYPE_CFG: Record<PatientDocument["type"], { label: string; icon: React.ElementType; cls: string }> = {
  "lab-result":       { label: "Lab Result",      icon: FlaskConical, cls: "bg-blue-100 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400" },
  "imaging":          { label: "Imaging",          icon: Image,        cls: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400" },
  "referral":         { label: "Referral",         icon: FileCheck,    cls: "bg-teal-100 text-teal-600 dark:bg-teal-950/40 dark:text-teal-400" },
  "discharge-summary":{ label: "Discharge",        icon: FileText,     cls: "bg-orange-100 text-orange-600 dark:bg-orange-950/40 dark:text-orange-400" },
  "consent":          { label: "Consent",          icon: FileCheck,    cls: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400" },
  "prescription":     { label: "Prescription",     icon: Pill,         cls: "bg-purple-100 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400" },
  "other":            { label: "Document",         icon: FileText,     cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState(PATIENT_DOCUMENTS);
  const [showUpload, setShowUpload] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<PatientDocument["type"] | "all">("all");

  const filtered = filter === "all" ? docs : docs.filter(d => d.type === filter);

  const typeFilters: Array<{ id: PatientDocument["type"] | "all"; label: string }> = [
    { id: "all", label: "All" },
    { id: "lab-result", label: "Lab Results" },
    { id: "prescription", label: "Prescriptions" },
    { id: "referral", label: "Referrals" },
    { id: "other", label: "Other" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Documents</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{docs.length} documents on file</p>
        </div>
        <button onClick={() => setShowUpload(s => !s)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <Plus className="w-4 h-4" /> Upload
        </button>
      </div>

      {/* Upload area */}
      {showUpload && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); }}
          className={cn("rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
            dragging
              ? "border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20"
              : "border-slate-300 dark:border-slate-600 hover:border-emerald-400 bg-slate-50 dark:bg-slate-800/40")}>
          <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drop files here or click to browse</p>
          <p className="text-xs text-slate-400 mt-1">PDF, JPG, PNG — max 20 MB per file</p>
          <button onClick={() => setShowUpload(false)} className="mt-3 text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1 mx-auto">
            <X className="w-3 h-3" /> Cancel
          </button>
        </div>
      )}

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {typeFilters.map(f => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={cn("px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
              filter === f.id
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-emerald-400")}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Document list */}
      <div className="space-y-3">
        {filtered.map(doc => {
          const cfg = TYPE_CFG[doc.type];
          const Icon = cfg.icon;
          return (
            <div key={doc.id} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:shadow-sm transition-all">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", cfg.cls)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{doc.name}</p>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
                  <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-semibold", cfg.cls)}>{cfg.label}</span>
                  <span>{fmtDate(doc.date)}</span>
                  {doc.provider && <span>· {doc.provider}</span>}
                  <span>· {doc.size}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 transition-colors">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-10 text-slate-400 dark:text-slate-500">
            <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents in this category</p>
          </div>
        )}
      </div>
    </div>
  );
}
