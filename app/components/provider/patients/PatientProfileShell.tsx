"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, Pencil, Ban, KeyRound, CalendarPlus, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getPatientProfile, calcAge, getLastVisit, getNextVisit,
  type PatientProfile,
} from "@/data/provider-patients";
import { SECTIONS, getSection, DEFAULT_SECTION } from "./sections/registry";
import { OverviewSection } from "./sections/OverviewSection";
import { PlaceholderSection } from "./sections/PlaceholderSection";
import { AppointmentsSection } from "./sections/AppointmentsSection";
import { MessagesSection } from "./sections/MessagesSection";
import { TasksSection } from "./sections/TasksSection";
import { AllergiesSection } from "./sections/AllergiesSection";
import { VitalsSection } from "./sections/VitalsSection";
import { CareCommentsSection } from "./sections/CareCommentsSection";
import { FormsSection } from "./sections/FormsSection";
import { DocumentsSection } from "./sections/DocumentsSection";
import { EncountersSection } from "./sections/EncountersSection";
import { PhrProfileSection } from "./sections/PhrProfileSection";
import { TimelineSection } from "./sections/TimelineSection";
import { EmailsSection } from "./sections/EmailsSection";

const HIGHLIGHT_BAR_H = 88; // px — keep in sync with the bar's rendered height

function initials(p: PatientProfile) {
  return `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();
}

function fmtVisit(v: { date: string; startTime: string; visitType: string } | null) {
  if (!v) return null;
  const d = new Date(v.date + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  const [h, m] = v.startTime.split(":").map(Number);
  const t = `${(h % 12) || 12}:${m.toString().padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  return `${d} · ${t}`;
}

export function PatientProfileShell({ id }: { id: string }) {
  const router = useRouter();
  const seed = getPatientProfile(id);

  const [profile, setProfile] = useState<PatientProfile | undefined>(seed);
  const [sectionId, setSectionId] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_SECTION;
    const s = new URLSearchParams(window.location.search).get("section");
    return SECTIONS.some((x) => x.id === s) ? (s as string) : DEFAULT_SECTION;
  });
  const [editing, setEditing] = useState(false);
  const [confirm, setConfirm] = useState<null | "deactivate" | "reset">(null);
  const [toast, setToast] = useState<string | null>(null);

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Patient not found</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No patient matches <code className="font-mono">{id}</code>.</p>
        <Link href="/provider/patients" className="mt-5 text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline">
          ← Back to My Patients
        </Link>
      </div>
    );
  }

  const p = profile;
  const section = getSection(sectionId);
  const lastVisit = getLastVisit(p.id);
  const nextVisit = getNextVisit(p.id);

  function selectSection(sid: string) {
    setSectionId(sid);
    setEditing(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("section", sid);
      window.history.replaceState(null, "", url);
    }
  }

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  }

  function runConfirm() {
    if (confirm === "deactivate") {
      setProfile({ ...p, status: "inactive" });
      flash(`${p.displayName} has been deactivated.`);
    } else if (confirm === "reset") {
      flash(`Password reset email sent to ${p.email}.`);
    }
    setConfirm(null);
  }

  return (
    <div className="min-h-full">
      {/* ── Sticky highlight bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-3">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="w-10 h-10 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300 text-sm font-bold shrink-0">
            {initials(p)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate">{p.displayName}</h1>
              {p.status === "inactive" && (
                <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400">Inactive</span>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono">{p.mrn}</p>
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <BarButton onClick={() => router.push("/provider/patients")} icon={ChevronLeft} label="Back" />
            <BarButton onClick={() => { selectSection("overview"); setEditing(true); }} icon={Pencil} label="Edit" />
            <BarButton onClick={() => setConfirm("deactivate")} icon={Ban} label="Deactivate" disabled={p.status === "inactive"} />
            <BarButton onClick={() => setConfirm("reset")} icon={KeyRound} label="Send password reset email" compact />
            <Link
              href="/care-coordinator/appointments/calendar"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white"
            >
              <CalendarPlus className="w-3.5 h-3.5" /> New Appointment
            </Link>
          </div>
        </div>

        <div className="mt-2 flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          <span><b className="font-semibold text-slate-700 dark:text-slate-300">{p.gender}</b> · {calcAge(p.dob)} yrs</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>DOB {p.dob}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>{p.phone}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span className="truncate max-w-[220px]">{p.email}</span>
          <span className="text-slate-300 dark:text-slate-600">|</span>
          <span>Last visit: {fmtVisit(lastVisit) ?? "none"}</span>
          {nextVisit && (
            <>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="text-brand-700 dark:text-brand-400 font-medium">Next: {fmtVisit(nextVisit)}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Section rail + outlet ────────────────────────────────────────── */}
      <div className="flex items-start">
        <aside
          className="w-52 shrink-0 border-r border-slate-200 dark:border-slate-800 py-3 px-2 self-start sticky overflow-y-auto hidden md:block"
          style={{ top: HIGHLIGHT_BAR_H, height: `calc(100vh - 60px - ${HIGHLIGHT_BAR_H}px)` }}
        >
          {SECTIONS.map((s) => {
            const Icon = s.icon;
            const active = s.id === sectionId;
            return (
              <button
                key={s.id}
                onClick={() => selectSection(s.id)}
                className={cn(
                  "w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors text-left",
                  active
                    ? "bg-brand-50 dark:bg-brand-950/40 text-navy-900 dark:text-white font-semibold shadow-[inset_3px_0_0_#05a99a] [&>svg]:text-brand-600 dark:[&>svg]:text-brand-300"
                    : "text-slate-500 dark:text-navy-200/70 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8 [&>svg]:text-slate-400",
                )}
              >
                <Icon className="w-[17px] h-[17px] shrink-0" />
                <span className="flex-1 truncate">{s.label}</span>
                {s.soon && (
                  <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide px-1 py-0.5 rounded bg-slate-100 dark:bg-white/10 text-slate-400">Soon</span>
                )}
              </button>
            );
          })}
        </aside>

        <main className="flex-1 min-w-0 p-4 sm:p-6">
          {/* mobile section selector */}
          <select
            value={sectionId}
            onChange={(e) => selectSection(e.target.value)}
            className="md:hidden mb-4 w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
          >
            {SECTIONS.map((s) => <option key={s.id} value={s.id}>{s.label}{s.soon ? " (soon)" : ""}</option>)}
          </select>

          {section.id === "overview" ? (
            <OverviewSection
              profile={p}
              editing={editing}
              onSave={(next) => { setProfile(next); setEditing(false); flash("Patient overview updated."); }}
              onCancel={() => setEditing(false)}
            />
          ) : section.id === "appointments" ? (
            <AppointmentsSection patient={p} />
          ) : section.id === "messages" ? (
            <MessagesSection patient={p} />
          ) : section.id === "tasks" ? (
            <TasksSection patient={p} />
          ) : section.id === "allergies" ? (
            <AllergiesSection patient={p} />
          ) : section.id === "vitals" ? (
            <VitalsSection patient={p} />
          ) : section.id === "care-comments" ? (
            <CareCommentsSection patient={p} />
          ) : section.id === "forms" ? (
            <FormsSection patient={p} />
          ) : section.id === "documents" ? (
            <DocumentsSection patient={p} />
          ) : section.id === "encounters" ? (
            <EncountersSection patient={p} />
          ) : section.id === "phr-profile" ? (
            <PhrProfileSection patient={p} />
          ) : section.id === "timeline" ? (
            <TimelineSection patient={p} />
          ) : section.id === "emails" ? (
            <EmailsSection patient={p} />
          ) : (
            <PlaceholderSection def={section} />
          )}
        </main>
      </div>

      {/* ── Confirm dialog ──────────────────────────────────────────────── */}
      {confirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
              {confirm === "deactivate" ? "Deactivate patient?" : "Send password reset email?"}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
              {confirm === "deactivate"
                ? `${p.displayName} will be marked inactive. You can reactivate them later.`
                : `A reset link will be emailed to ${p.email}.`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                Cancel
              </button>
              <button
                onClick={runConfirm}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold text-white",
                  confirm === "deactivate" ? "bg-red-600 hover:bg-red-700" : "practmd-gradient",
                )}
              >
                {confirm === "deactivate" ? "Deactivate" : "Send email"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ──────────────────────────────────────────────────────── */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-[80] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-navy-900 text-white text-sm shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
          {toast}
        </div>
      )}
    </div>
  );
}

function BarButton({
  onClick, icon: Icon, label, disabled, compact,
}: {
  onClick: () => void; icon: React.ElementType; label: string; disabled?: boolean; compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
        disabled
          ? "border-slate-100 dark:border-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed"
          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
      )}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className={compact ? "hidden xl:inline" : "hidden lg:inline"}>{label}</span>
    </button>
  );
}
