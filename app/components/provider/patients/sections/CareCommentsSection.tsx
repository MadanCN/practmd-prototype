"use client";

import { useState } from "react";
import { StickyNote, TriangleAlert, Flag, Check } from "lucide-react";
import { CARE_COMMENTS_BY_ID, type CareComment, type CareCommentType } from "@/data/provider-patient-clinical";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";
import { timeAgo } from "./shared";

export function CareCommentsSection({ patient }: { patient: PatientProfile }) {
  const [comments, setComments] = useState<CareComment[]>(() =>
    [...(CARE_COMMENTS_BY_ID[patient.id] ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
  const [type, setType] = useState<CareCommentType>("normal");
  const [body, setBody] = useState("");
  const [flag, setFlag] = useState(false);

  function post() {
    if (!body.trim()) return;
    setComments((prev) => [{
      id: `cmt-new-${Date.now()}`,
      author: "Dr. Sarah Mitchell",
      authorRole: "Provider",
      createdAt: new Date().toISOString(),
      body: body.trim(),
      type,
      flagOnNextVisit: type === "alert" ? flag : undefined,
      resolved: false,
    }, ...prev]);
    setBody(""); setFlag(false); setType("normal");
  }

  return (
    <div>
      {/* composer */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 mb-4">
        <div className="flex items-center gap-2 mb-2.5">
          {(["normal", "alert"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors",
                type === t
                  ? t === "alert" ? "bg-red-600 text-white" : "bg-brand-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400",
              )}
            >
              {t === "alert" ? <TriangleAlert className="w-3.5 h-3.5" /> : <StickyNote className="w-3.5 h-3.5" />}
              {t}
            </button>
          ))}
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder={type === "alert" ? "Describe the alert for the care team…" : "Add a note for the care team…"}
          className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
        <div className="flex items-center justify-between mt-2.5">
          {type === "alert" ? (
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={flag} onChange={(e) => setFlag(e.target.checked)} className="w-4 h-4 rounded accent-red-600" />
              Flag when patient is next seen
            </label>
          ) : <span />}
          <button onClick={post} disabled={!body.trim()} className={cn("px-3 py-1.5 rounded-lg text-xs font-semibold", body.trim() ? "practmd-gradient text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
            Post comment
          </button>
        </div>
      </div>

      {comments.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-14 text-center">
          <StickyNote className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          <p className="text-sm text-slate-400">No care comments yet.</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {comments.map((c) => (
            <div
              key={c.id}
              className={cn(
                "rounded-xl border p-3.5",
                c.type === "alert"
                  ? "border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20"
                  : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900",
              )}
            >
              <div className="flex items-center gap-2 mb-1.5">
                {c.type === "alert"
                  ? <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400"><TriangleAlert className="w-3 h-3" /> Alert</span>
                  : <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Note</span>}
                {c.flagOnNextVisit && !c.resolved && (
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400"><Flag className="w-3 h-3" /> Flag on next visit</span>
                )}
                <span className="ml-auto text-[10px] text-slate-400">{timeAgo(c.createdAt)}</span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{c.body}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-slate-400">{c.author} · {c.authorRole}</p>
                {c.flagOnNextVisit && (
                  <button
                    onClick={() => setComments((prev) => prev.map((x) => (x.id === c.id ? { ...x, resolved: !x.resolved } : x)))}
                    className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline"
                  >
                    <Check className="w-3.5 h-3.5" /> {c.resolved ? "Reopen flag" : "Mark seen"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
