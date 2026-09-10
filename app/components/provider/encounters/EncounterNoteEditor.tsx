"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronDown, ChevronRight, Printer, Download, Send,
  ShieldCheck, CheckCircle2, Plus, X, Lock, Users, Check, AlertTriangle,
  WifiOff, Wifi, FileClock, ArrowUp, ArrowDown, Copy, PanelRightOpen, PanelRightClose,
  Undo2, MessageSquareWarning, PenLine, Receipt, History, ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DIAGNOSIS_CODES, completeEncounterForNote, pushNotification } from "@/lib/encounter-store";
import { createChargeFromNote, getChargeForNote } from "@/lib/charge-store";
import { PROVIDERS } from "@/data/providers";
import { getPatientProfile, calcAge } from "@/data/provider-patients";
import { PATIENT_ALLERGIES_BY_ID, CARE_COMMENTS_BY_ID, PATIENT_FORMS_BY_ID } from "@/data/provider-patient-clinical";
import { visitTypeDef } from "@/lib/visit-types";
import { useProviderSession } from "@/lib/provider-session";
import { signaturePaths, signatureBlockers } from "@/lib/provider-permissions";
import { useNoteTemplates, pickableTemplates, getTemplate, activeVersion, templateLabel } from "@/lib/note-templates";
import { closeTasksForNote, addRequestTask } from "@/lib/provider-tasks-store";
import {
  useEncounterNotes, getNote, getNotesForPatient, getAllNotes, setField,
  toggleDiagnosis, reorderDiagnoses, addProcedure, updateProcedure, removeProcedure,
  signNote, addCoSign, returnForRevision, addAddendum, selectTemplateForNote, copyForwardInto,
  sameDiagnoses, sameProcedures, codingDiffSummary,
  isEditable, groupsFor, FOLLOWUP_FIELDS,
  type FieldDef, type NoteType, type EncounterNoteDoc, type FieldGroup, type ProcedureRow,
} from "@/lib/encounter-notes-store";

function fmtDate(ymd: string) {
  return new Date(ymd + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/* ── main ──────────────────────────────────────────────────────────────── */

export function EncounterNoteEditor({ id }: { id: string }) {
  useEncounterNotes();
  useNoteTemplates();
  const doc = getNote(id);
  const session = useProviderSession();

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Note not found</h1>
        <Link href="/provider/encounter-notes" className="mt-4 text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline">← All clinical notes</Link>
      </div>
    );
  }

  // ── Template gate — nothing renders until a template is chosen ─────────
  if (!doc.templateId && isEditable(doc)) {
    return <TemplateGate doc={doc} />;
  }

  return <Editor doc={doc} session={session} />;
}

/* ── template gate ─────────────────────────────────────────────────────── */

function TemplateGate({ doc }: { doc: EncounterNoteDoc }) {
  const templates = pickableTemplates();
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <Link href="/provider/encounter-notes" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-3">
        <ChevronLeft className="w-4 h-4" /> Clinical notes
      </Link>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Choose a note template</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          The template sets the section structure and the default procedure code for {doc.patientName}&apos;s {doc.visitType.toLowerCase()}. Your clinic admin maintains these.
        </p>
        <div className="mt-5 space-y-2">
          {templates.map((t) => {
            const v = activeVersion(t);
            return (
              <button key={t.id}
                onClick={() => selectTemplateForNote(doc.id, t.id, v?.version ?? 1, t.baseNoteType)}
                className="w-full flex items-start gap-3 rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-3.5 text-left transition-colors hover:border-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/20">
                <div className="w-9 h-9 rounded-lg bg-brand-100 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
                  <FileClock className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.name}</p>
                    <span className="text-[10px] font-mono text-slate-400">v{v?.version ?? 1}</span>
                    <span className="text-[10px] font-medium text-slate-400">· {t.baseNoteType} · {t.defaultProcedureCode}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{t.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 mt-1" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── editor ────────────────────────────────────────────────────────────── */

function Editor({ doc, session }: { doc: EncounterNoteDoc; session: ReturnType<typeof useProviderSession> }) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dxQuery, setDxQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [signMenu, setSignMenu] = useState(false);
  const [askCoSign, setAskCoSign] = useState(false);
  const [showContext, setShowContext] = useState(true);
  const [showCopyFwd, setShowCopyFwd] = useState(false);
  const [online, setOnline] = useState(true);
  const [savedAt, setSavedAt] = useState(doc.updatedAt);

  const readOnly = !isEditable(doc);
  const patient = getPatientProfile(doc.patientId);
  const groups = groupsFor(doc.noteType);
  const tpl = doc.templateId ? getTemplate(doc.templateId) : undefined;

  const CO_SIGNERS = useMemo(() => PROVIDERS.filter((p) => p.id !== session.provider.id), [session.provider.id]);
  const [coSignPick, setCoSignPick] = useState<string>("");
  useEffect(() => { if (!coSignPick && CO_SIGNERS[0]) setCoSignPick(CO_SIGNERS[0].displayName); }, [CO_SIGNERS, coSignPick]);

  // auto-save indicator — the store persists on every keystroke; reflect it
  useEffect(() => { setSavedAt(doc.updatedAt); }, [doc.updatedAt]);

  // offline / reconnect reconciliation (simulated)
  useEffect(() => {
    const on = () => { setOnline(true); flash("Reconnected — local draft reconciled with the server. No conflicts."); };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setOnline(navigator.onLine);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 3200); }

  function toggle(sid: string) {
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(sid)) n.delete(sid); else n.add(sid);
      return n;
    });
  }

  function afterSign() {
    const signed = getNote(doc.id);
    if (!signed || signed.status !== "signed") return;
    completeEncounterForNote(signed.appointmentId);
    closeTasksForNote(signed.id);
    const charge = createChargeFromNote(signed);
    pushNotification({
      kind: "charge-created",
      message: `Bill created — ${signed.patientName} · ${signed.visitType} · $${charge.total.toFixed(2)}`,
      href: "/revenue-management/charges",
    });
  }

  const blockers = signatureBlockers(doc);
  const paths = signaturePaths(session.capabilities, session.clinicalStatus);
  const canSignAlone = paths.includes("sign");

  function doSign() {
    signNote(doc.id, { requestCoSign: false, signerName: session.provider.displayName });
    afterSign();
    setSignMenu(false);
    flash("Note signed · encounter closed · bill created.");
  }
  function doSignAndRequestCoSign(coSigner: string) {
    signNote(doc.id, { requestCoSign: true, coSignerName: coSigner, signerName: session.provider.displayName });
    pushNotification({ kind: "generic", message: `Co-signature requested from ${coSigner} — ${doc.patientName} · ${doc.visitType}`, href: `/provider/encounters/${doc.id}` });
    setAskCoSign(false);
    flash(`Signed — co-signature requested from ${coSigner}. Note is locked until they act.`);
  }

  // co-sign inbox view
  const isCoSignerHere = doc.status === "pending-cosign" && (doc.coSignerName === session.provider.displayName || session.capabilities.can_cosign);

  const filteredDx = DIAGNOSIS_CODES.filter(
    (d) => !doc.diagnoses.includes(d.code) && (d.code + d.label).toLowerCase().includes(dxQuery.toLowerCase()),
  );
  const recentDx = useMemo(() => dxFrequency(doc.patientId).filter((c) => !doc.diagnoses.includes(c)), [doc.patientId, doc.diagnoses]);

  const priorNotes = getNotesForPatient(doc.patientId).filter((n) => n.id !== doc.id && n.status === "signed");

  const sectionIndex: { id: string; label: string; groups: FieldGroup[] }[] = [
    { id: "subjective", label: doc.noteType === "SOAP" ? "Subjective" : doc.noteType === "BIRP" ? "Behavior" : doc.noteType === "DAP" ? "Data" : "Narrative", groups: groups.subjective },
    ...(groups.objective.length ? [{ id: "objective", label: doc.noteType === "BIRP" ? "Intervention" : "Objective", groups: groups.objective }] : []),
    ...(groups.assessment.length ? [{ id: "assessment", label: doc.noteType === "BIRP" ? "Response" : "Assessment", groups: groups.assessment }] : []),
    { id: "plan", label: "Plan", groups: groups.plan },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <Link href="/provider/encounter-notes" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-3">
        <ChevronLeft className="w-4 h-4" /> Clinical notes
      </Link>

      {/* returned-for-revision banner */}
      {doc.status === "returned" && doc.returnedComment && (
        <div className="mb-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <Undo2 className="w-4 h-4" /> Returned for revision by {doc.returnedBy}
          </div>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">“{doc.returnedComment}”</p>
        </div>
      )}

      {/* co-signer action panel */}
      {isCoSignerHere && (
        <CoSignPanel doc={doc} me={session.provider.displayName} onDone={flash} afterSign={afterSign} />
      )}

      <div className="grid lg:grid-cols-[180px_1fr] gap-5">
        {/* section index */}
        <aside className="hidden lg:block">
          <div className="sticky top-[76px] space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">Sections</p>
            {[
              ...sectionIndex,
              { id: "coding", label: "Coding", groups: [] as FieldGroup[] },
              { id: "followup", label: "Follow-up", groups: [] as FieldGroup[] },
              ...(isEditable(doc) ? [{ id: "sign", label: "Sign", groups: [] as FieldGroup[] }] : []),
              ...(doc.status === "signed" ? [{ id: "addenda", label: "Addenda", groups: [] as FieldGroup[] }] : []),
            ].map((s) => {
              const done = s.id === "coding" ? doc.diagnoses.length > 0 && doc.procedures.length > 0
                : s.id === "sign" ? blockers.length === 0
                : s.id === "addenda" ? doc.addenda.length > 0
                : sectionComplete(doc, s.groups);
              const rec = tpl?.recommendedSections.some((r) => s.groups.some((g) => g.id === r));
              return (
                <a key={s.id} href={`#sec-${s.id}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                  {done ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />}
                  <span className="truncate">{s.label}</span>
                  {rec && !done && <span className="ml-auto text-[9px] text-amber-500 font-bold shrink-0">REC</span>}
                </a>
              );
            })}
            <div className="pt-2 mt-2 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setShowContext((v) => !v)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 w-full">
                {showContext ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
                Chart context
              </button>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          {/* toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 mb-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <FileClock className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{templateLabel(doc.templateId, doc.templateVersion)}</span>
                <StatusPill status={doc.status} />
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 ml-1">
                {!online ? (
                  <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400"><WifiOff className="w-3.5 h-3.5" /> Offline — saved locally</span>
                ) : readOnly ? null : (
                  <span className="flex items-center gap-1"><Wifi className="w-3.5 h-3.5 text-emerald-500" /> Saved · {fmtTime(savedAt)}</span>
                )}
              </div>

              <div className="flex items-center gap-1.5 ml-auto">
                <ToolBtn icon={Download} label="Export" onClick={() => flash("Note exported as PDF.")} />
                <ToolBtn icon={Printer} label="Print" onClick={() => window.print()} />
                <ToolBtn icon={Send} label="Send summary" onClick={() => flash(`Visit summary sent to ${doc.patientName}.`)} compact />
                {!readOnly && (
                  <>
                    {priorNotes.length > 0 && (
                      <button onClick={() => setShowCopyFwd(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <Copy className="w-3.5 h-3.5" /> Copy forward
                      </button>
                    )}
                    <div className="relative">
                      <button onClick={() => setSignMenu((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white">
                        <ShieldCheck className="w-3.5 h-3.5" /> Sign <ChevronDown className="w-3 h-3" />
                      </button>
                      {signMenu && (
                        <>
                          <div className="fixed inset-0 z-30" onClick={() => setSignMenu(false)} />
                          <div className="absolute right-0 top-10 z-40 w-64 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5">
                            {blockers.length > 0 && (
                              <div className="px-2.5 py-2 mb-1 rounded-lg bg-red-50 dark:bg-red-950/30 text-[11px] text-red-600 dark:text-red-400 flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 mt-px shrink-0" />
                                <span>Add {blockers.join(" and ")} before signing.</span>
                              </div>
                            )}
                            {canSignAlone && (
                              <button
                                disabled={blockers.length > 0}
                                onClick={doSign}
                                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40">
                                <ShieldCheck className="w-4 h-4 text-brand-600" /> Sign
                              </button>
                            )}
                            <button
                              disabled={blockers.length > 0}
                              onClick={() => { setAskCoSign(true); setSignMenu(false); }}
                              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40">
                              <Users className="w-4 h-4 text-brand-600" /> Sign &amp; request co-signature
                            </button>
                            {!canSignAlone && (
                              <p className="px-2.5 pt-1.5 text-[10px] text-slate-400">Your notes require a co-signature — signing alone isn&apos;t available.</p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {askCoSign && (
              <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-brand-200 dark:border-brand-900 bg-brand-50/60 dark:bg-brand-950/20 px-3 py-2.5">
                <span className="text-sm text-brand-800 dark:text-brand-300">Request co-signature from</span>
                <select value={coSignPick} onChange={(e) => setCoSignPick(e.target.value)} className="px-2 py-1 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                  {CO_SIGNERS.map((p) => <option key={p.id}>{p.displayName}</option>)}
                </select>
                <button onClick={() => doSignAndRequestCoSign(coSignPick)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white">Sign &amp; send request</button>
                <button onClick={() => setAskCoSign(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500">Cancel</button>
              </div>
            )}

            {readOnly && doc.status !== "returned" && (
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <Lock className="w-3.5 h-3.5" />
                {doc.status === "signed"
                  ? `Signed ${doc.signedAt ? fmtDateTime(doc.signedAt) : ""} by ${doc.signedBy.join(", ")} — immutable. Corrections are addenda.`
                  : `Signed by ${doc.providerName}, locked pending co-signature from ${doc.coSignerName}.`}
              </div>
            )}
          </div>

          {/* chart context */}
          {showContext && <ChartContext doc={doc} />}

          {/* sections */}
          <div className="space-y-3">
            {sectionIndex.map((s) => (
              <SoapArea key={s.id} id={`sec-${s.id}`} title={s.label} sid={s.id} collapsed={collapsed} onToggle={toggle}>
                {s.groups.map((g) => <FieldSet key={g.id} title={g.title} fields={g.fields} doc={doc} readOnly={readOnly} />)}
              </SoapArea>
            ))}

            {/* coding */}
            <SoapArea id="sec-coding" title="Coding" sid="coding" collapsed={collapsed} onToggle={toggle}>
              {/* diagnoses */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Diagnoses <span className="text-slate-400 font-normal">· first is primary, drag / reorder</span></p>
                </div>
                {doc.diagnoses.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {doc.diagnoses.map((code, i) => {
                      const d = DIAGNOSIS_CODES.find((x) => x.code === code);
                      return (
                        <div key={code} className={cn("flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg text-xs font-medium",
                          i === 0 ? "bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>
                          {i === 0 && <span className="text-[9px] font-bold uppercase px-1 py-0.5 rounded bg-brand-600 text-white">Primary</span>}
                          <span className="font-mono">{code}</span>
                          <span className="truncate">{d?.label}</span>
                          {!readOnly && (
                            <span className="ml-auto flex items-center gap-0.5 shrink-0">
                              <button disabled={i === 0} onClick={() => reorderDiagnoses(doc.id, i, i - 1)} className="p-0.5 disabled:opacity-20 hover:text-slate-900 dark:hover:text-white"><ArrowUp className="w-3 h-3" /></button>
                              <button disabled={i === doc.diagnoses.length - 1} onClick={() => reorderDiagnoses(doc.id, i, i + 1)} className="p-0.5 disabled:opacity-20 hover:text-slate-900 dark:hover:text-white"><ArrowDown className="w-3 h-3" /></button>
                              <button onClick={() => toggleDiagnosis(doc.id, code)} className="p-0.5 hover:text-red-500"><X className="w-3 h-3" /></button>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
                {!readOnly && (
                  <>
                    {recentDx.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        <span className="text-[10px] text-slate-400 self-center">Recent:</span>
                        {recentDx.slice(0, 4).map((code) => {
                          const d = DIAGNOSIS_CODES.find((x) => x.code === code);
                          return (
                            <button key={code} onClick={() => toggleDiagnosis(doc.id, code)}
                              className="text-[11px] px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-slate-500 hover:border-brand-400 hover:text-brand-600">
                              {code} {d ? `· ${d.label}` : ""}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    <div className="relative max-w-md">
                      <input value={dxQuery} onChange={(e) => setDxQuery(e.target.value)} placeholder="Search ICD-10 by code or description…"
                        className="w-full px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                      {dxQuery && filteredDx.length > 0 && (
                        <div className="absolute left-0 right-0 top-9 z-20 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg max-h-52 overflow-y-auto">
                          {filteredDx.map((d) => (
                            <button key={d.code} onClick={() => { toggleDiagnosis(doc.id, d.code); setDxQuery(""); }}
                              className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                              <span className="font-mono font-semibold">{d.code}</span> — {d.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* procedures */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Procedures <span className="text-slate-400 font-normal">· POS follows the visit mode ({doc.mode === "telehealth" ? "10 telehealth" : "11 office"})</span></p>
                  {!readOnly && (
                    <button onClick={() => addProcedure(doc.id)} className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline">
                      <Plus className="w-3.5 h-3.5" /> Add row
                    </button>
                  )}
                </div>
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-sm min-w-[760px]">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                        {["Description", "CPT", "Qty", "Charge", "Dx ptrs", "Modifiers", "POS", ""].map((h) => (
                          <th key={h} className="px-2.5 py-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {doc.procedures.length === 0 ? (
                        <tr><td colSpan={8} className="px-3 py-4 text-center text-xs text-slate-400">No procedure rows — a note can&apos;t be signed without at least one.</td></tr>
                      ) : doc.procedures.map((r) => (
                        <tr key={r.id}>
                          {(["description", "code", "quantity", "charge", "dxPointers", "modifiers", "pos"] as const).map((k) => (
                            <td key={k} className="px-1.5 py-1">
                              <input value={r[k]} disabled={readOnly}
                                onChange={(e) => updateProcedure(doc.id, r.id, { [k]: e.target.value })}
                                className="w-full px-1.5 py-1 rounded text-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-brand-500 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-70" />
                            </td>
                          ))}
                          <td className="px-1.5 py-1 text-right">
                            {!readOnly && <button onClick={() => removeProcedure(doc.id, r.id)} className="text-slate-300 hover:text-red-500"><X className="w-3.5 h-3.5" /></button>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SoapArea>

            {/* follow-up */}
            <SoapArea id="sec-followup" title="Follow-up" sid="followup" collapsed={collapsed} onToggle={toggle}>
              <FieldSet title="" fields={FOLLOWUP_FIELDS} doc={doc} readOnly={readOnly} />
            </SoapArea>

            {/* addenda (signed notes) */}
            {doc.status === "signed" && (
              <Addenda doc={doc} me={session.provider.displayName} onDone={flash} />
            )}

            {/* ── sign at the bottom — mirror of the toolbar action, so the
                   provider can sign right where they finish writing ── */}
            {isEditable(doc) && (
              <SignAtBottom
                doc={doc}
                provider={session.provider}
                credentials={session.provider.credentials}
                blockers={blockers}
                canSignAlone={canSignAlone}
                coSigners={CO_SIGNERS}
                onSign={doSign}
                onSignAndCoSign={doSignAndRequestCoSign}
              />
            )}

            {/* ── signed → what happened ── */}
            {(doc.status === "signed" || doc.status === "pending-cosign") && (
              <SignedSummary doc={doc} />
            )}
          </div>

          {/* encounter & signature details + audit trail */}
          <EncounterDetails doc={doc} patient={patient} />
        </div>
      </div>

      {showCopyFwd && (
        <CopyForwardModal doc={doc} priorNotes={priorNotes} onClose={() => setShowCopyFwd(false)} onDone={flash} />
      )}

      {toast && (
        <div className="fixed bottom-5 right-5 z-[80] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-navy-900 text-white text-sm shadow-2xl max-w-sm">
          <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" /> {toast}
        </div>
      )}
    </div>
  );
}

/* ── chart context ─────────────────────────────────────────────────────── */

function ChartContext({ doc }: { doc: EncounterNoteDoc }) {
  const [open, setOpen] = useState(true);
  const allergies = (PATIENT_ALLERGIES_BY_ID[doc.patientId] ?? []).filter((a) => a.status === "active");
  const alerts = (CARE_COMMENTS_BY_ID[doc.patientId] ?? []).filter((c) => c.type === "alert" && !c.resolved);
  const forms = (PATIENT_FORMS_BY_ID[doc.patientId] ?? []).filter((f) => f.status === "completed" && f.score != null);
  const prior = getNotesForPatient(doc.patientId).find((n) => n.id !== doc.id && n.status === "signed");

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 mb-4">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Chart context</span>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="px-4 pb-4 grid sm:grid-cols-2 gap-3 text-sm border-t border-slate-100 dark:border-slate-800 pt-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Active allergies</p>
            {allergies.length === 0 ? <p className="text-xs text-slate-400">No known allergies on file.</p> : (
              <ul className="space-y-0.5">
                {allergies.map((a) => (
                  <li key={a.id} className="text-xs text-slate-600 dark:text-slate-300">
                    <span className={cn("font-medium", a.severity === "severe" || a.severity === "life-threatening" ? "text-red-600 dark:text-red-400" : "")}>{a.allergen}</span>
                    <span className="text-slate-400"> · {a.reaction} · {a.severity}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Alert-flagged care comments</p>
            {alerts.length === 0 ? <p className="text-xs text-slate-400">None.</p> : (
              <ul className="space-y-0.5">
                {alerts.map((c) => <li key={c.id} className="text-xs text-amber-700 dark:text-amber-400">{c.body}</li>)}
              </ul>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Form scores</p>
            {forms.length === 0 ? <p className="text-xs text-slate-400">No scored forms completed.</p> : (
              <ul className="space-y-0.5">
                {forms.map((f) => <li key={f.id} className="text-xs text-slate-600 dark:text-slate-300"><span className="font-medium">{f.name}</span>: {f.score}{f.maxScore ? ` / ${f.maxScore}` : ""}</li>)}
              </ul>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Previous note</p>
            {prior ? (
              <Link href={`/provider/encounters/${prior.id}`} className="text-xs text-brand-600 dark:text-brand-400 hover:underline">
                {fmtDate(prior.date)} · {prior.visitType} · {prior.noteType}
              </Link>
            ) : <p className="text-xs text-slate-400">No earlier signed note.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── copy forward ──────────────────────────────────────────────────────── */

function CopyForwardModal({ doc, priorNotes, onClose, onDone }: {
  doc: EncounterNoteDoc; priorNotes: EncounterNoteDoc[]; onClose: () => void; onDone: (m: string) => void;
}) {
  const [pick, setPick] = useState<string | null>(priorNotes[0]?.id ?? null);
  const src = pick ? priorNotes.find((n) => n.id === pick) : undefined;
  const fields = src ? Object.entries(src.fields).filter(([, v]) => v.trim()) : [];
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => { setSelected(new Set(fields.map(([k]) => k))); /* eslint-disable-next-line */ }, [pick]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Copy forward from a previous note</p>
          <button onClick={onClose} className="text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <select value={pick ?? ""} onChange={(e) => setPick(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
            {priorNotes.map((n) => <option key={n.id} value={n.id}>{fmtDate(n.date)} · {n.visitType}</option>)}
          </select>
          <p className="text-xs text-slate-400">Carried-forward fields are marked in the note so the record shows what was reviewed versus newly observed.</p>
          <div className="space-y-1">
            {fields.length === 0 ? <p className="text-xs text-slate-400">That note has no filled fields.</p> : fields.map(([k, v]) => (
              <label key={k} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300 py-1">
                <input type="checkbox" checked={selected.has(k)} onChange={(e) => setSelected((s) => { const n = new Set(s); if (e.target.checked) n.add(k); else n.delete(k); return n; })} className="mt-0.5 w-3.5 h-3.5 rounded accent-brand-600" />
                <span><span className="font-medium">{k}</span> — <span className="text-slate-400">{v.slice(0, 80)}</span></span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500">Cancel</button>
          <button disabled={!src || selected.size === 0}
            onClick={() => { if (src) { copyForwardInto(doc.id, src.id, [...selected]); onDone(`Carried ${selected.size} field${selected.size > 1 ? "s" : ""} forward — marked in the note.`); onClose(); } }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white disabled:opacity-40">
            Copy {selected.size} field{selected.size === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── co-sign panel ─────────────────────────────────────────────────────── */

function CoSignPanel({ doc, me, onDone, afterSign }: {
  doc: EncounterNoteDoc; me: string; onDone: (m: string) => void; afterSign: () => void;
}) {
  const [returning, setReturning] = useState(false);
  const [comment, setComment] = useState("");
  return (
    <div className="mb-4 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3.5">
      <div className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
        <Users className="w-4 h-4" /> This note is awaiting your co-signature — signed by {doc.providerName}, locked to the author.
      </div>
      {!returning ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button onClick={() => { addCoSign(doc.id, me); afterSign(); onDone("Co-signature added · encounter closed · bill created."); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white">
            <Check className="w-3.5 h-3.5" /> Co-sign
          </button>
          <button onClick={() => setReturning(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300">
            <MessageSquareWarning className="w-3.5 h-3.5" /> Return for revision
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={2} placeholder="What needs to change? (required)"
            className="w-full px-3 py-2 rounded-lg text-sm border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus:outline-none" />
          <div className="mt-2 flex gap-2">
            <button disabled={!comment.trim()} onClick={() => {
              returnForRevision(doc.id, me, comment.trim());
              pushNotification({ kind: "generic", message: `Note returned for revision — ${doc.patientName} · ${doc.visitType}. “${comment.trim()}”`, href: `/provider/encounters/${doc.id}` });
              onDone("Returned to the author with your comment.");
            }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white disabled:opacity-40">Send back</button>
            <button onClick={() => setReturning(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── sign block (bottom of the note) ───────────────────────────────────── */

function SignAtBottom({ doc, provider, credentials, blockers, canSignAlone, coSigners, onSign, onSignAndCoSign }: {
  doc: EncounterNoteDoc;
  provider: { displayName: string; firstName: string };
  credentials: string;
  blockers: string[];
  canSignAlone: boolean;
  coSigners: { id: string; displayName: string }[];
  onSign: () => void;
  onSignAndCoSign: (coSigner: string) => void;
}) {
  const [attested, setAttested] = useState(false);
  const [coSigner, setCoSigner] = useState(coSigners[0]?.displayName ?? "");
  const ready = attested && blockers.length === 0;

  return (
    <section id="sec-sign" className="scroll-mt-20 rounded-xl border-2 border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/20 overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-100 dark:border-brand-900/60 flex items-center gap-2">
        <PenLine className="w-4 h-4 text-brand-600 dark:text-brand-400" />
        <h2 className="text-sm font-bold text-navy-900 dark:text-slate-100">Sign this note</h2>
        {doc.status === "returned" && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400">re-sign after revision</span>}
      </div>
      <div className="p-4 space-y-3">
        {blockers.length > 0 && (
          <div className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 px-3 py-2 text-xs text-red-600 dark:text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
            <span>Can&apos;t sign yet — add {blockers.join(" and ")} in the Coding section above.</span>
          </div>
        )}
        <label className="flex items-start gap-2.5 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
          <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} className="mt-0.5 w-4 h-4 rounded accent-brand-600" />
          <span>
            I, <span className="font-semibold">{provider.displayName}{credentials ? `, ${credentials}` : ""}</span>, attest that I performed or supervised this encounter and that this note is accurate and complete. I understand that once signed the note is a legal record and can only be corrected by addendum, and that signing creates the associated bill.
          </span>
        </label>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {canSignAlone && (
            <button disabled={!ready} onClick={onSign}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold practmd-gradient text-white disabled:opacity-40">
              <ShieldCheck className="w-4 h-4" /> Sign &amp; close encounter
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <button disabled={!ready} onClick={() => onSignAndCoSign(coSigner)}
              className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold disabled:opacity-40",
                canSignAlone ? "border border-brand-300 dark:border-brand-800 text-brand-700 dark:text-brand-400" : "practmd-gradient text-white")}>
              <Users className="w-4 h-4" /> Sign &amp; request co-signature
            </button>
            {!ready ? null : (
              <select value={coSigner} onChange={(e) => setCoSigner(e.target.value)}
                className="px-2 py-1.5 rounded-lg text-xs border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200">
                {coSigners.map((p) => <option key={p.id}>{p.displayName}</option>)}
              </select>
            )}
          </div>
          {!canSignAlone && <span className="text-[11px] text-slate-400">Your notes require a co-signature — signing alone isn&apos;t available.</span>}
        </div>
      </div>
    </section>
  );
}

/* ── signed summary (bottom of the note) ───────────────────────────────── */

function SignedSummary({ doc }: { doc: EncounterNoteDoc }) {
  const charge = getChargeForNote(doc.id);
  return (
    <section className="rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/50 dark:bg-emerald-950/20 p-4">
      <div className="flex items-start gap-2.5">
        <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-sm text-slate-700 dark:text-slate-200 space-y-1">
          {doc.status === "signed" ? (
            <>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">
                Signed by {doc.signedBy.join(", ")}{doc.signedAt ? ` on ${fmtDateTime(doc.signedAt)}` : ""}.
              </p>
              {doc.coSignerName && <p>Co-signed by {doc.coSignerName}.</p>}
              <p className="text-slate-500 dark:text-slate-400">This note is immutable — the encounter is closed. Corrections are made by addendum below.</p>
              {charge && (
                <p className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                  <Receipt className="w-3.5 h-3.5" /> Bill created — {charge.lines.map((l) => l.code).join(", ")} · ${charge.total.toFixed(2)} ·{" "}
                  <Link href="/revenue-management/charges" className="text-brand-600 dark:text-brand-400 hover:underline">view claim</Link>
                </p>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                Signed by {doc.providerName} — awaiting co-signature from {doc.coSignerName}.
              </p>
              <p className="text-slate-500 dark:text-slate-400">The note is locked to the author and not billable until the co-signer acts.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ── encounter & signature details + audit trail ───────────────────────── */

function EncounterDetails({ doc, patient }: { doc: EncounterNoteDoc; patient: ReturnType<typeof getPatientProfile> }) {
  const [auditOpen, setAuditOpen] = useState(false);
  const AUDIT_LABEL: Record<string, string> = {
    created: "Note created", "template-selected": "Template selected", signed: "Signed",
    "cosign-requested": "Co-signature requested", cosigned: "Co-signed", returned: "Returned for revision",
    addendum: "Addendum appended", "copy-forward": "Copied forward",
  };
  return (
    <div className="mt-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-slate-400" />
        <h2 className="text-sm font-bold text-navy-900 dark:text-slate-100">Encounter &amp; signature details</h2>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 text-sm">
        <Meta label="Patient"><Link href={`/provider/patients/${doc.patientId}`} className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">{doc.patientName}</Link></Meta>
        <Meta label="Age">{patient ? `${calcAge(patient.dob)} yrs` : "—"}</Meta>
        <Meta label="Date of service">{fmtDate(doc.date)}</Meta>
        <Meta label="Provider">{doc.providerName}</Meta>
        <Meta label="Mode"><span className="capitalize">{doc.mode}</span></Meta>
        <Meta label="Resource">{doc.resource}</Meta>
        <Meta label="Visit type">{doc.visitType}</Meta>
        <Meta label="Template">{templateLabel(doc.templateId, doc.templateVersion)}</Meta>
        <Meta label="Status"><StatusPill status={doc.status} /></Meta>
        <Meta label="Created">{fmtDateTime(doc.createdAt)}</Meta>
        <Meta label="Last updated">{fmtDateTime(doc.updatedAt)}</Meta>
        <Meta label="Signed">{doc.signedAt ? fmtDateTime(doc.signedAt) : "—"}</Meta>
        <Meta label="Signed by">{doc.signedBy.length ? doc.signedBy.join(", ") : "—"}</Meta>
        <Meta label="Co-signer">{doc.coSignerName ?? "—"}</Meta>
        <Meta label="Addenda">{doc.addenda.length || "—"}</Meta>
      </div>
      <div className="border-t border-slate-100 dark:border-slate-800">
        <button onClick={() => setAuditOpen((o) => !o)} className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40">
          <span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Audit trail ({doc.audit.length})</span>
          {auditOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {auditOpen && (
          <ol className="px-4 pb-4 space-y-1.5">
            {[...doc.audit].reverse().map((e) => (
              <li key={e.id} className="flex items-start gap-2 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0 mt-1.5" />
                <span className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium">{AUDIT_LABEL[e.kind] ?? e.kind}</span>
                  {e.detail ? ` — ${e.detail}` : ""}
                  <span className="text-slate-400"> · {e.actor} · {fmtDateTime(e.at)}</span>
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}

/* ── addenda ───────────────────────────────────────────────────────────── */

function Addenda({ doc, me, onDone }: { doc: EncounterNoteDoc; me: string; onDone: (m: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [reason, setReason] = useState("");
  const [body, setBody] = useState("");
  const [amendCoding, setAmendCoding] = useState(false);

  // working copy of the coding — edited only inside the addendum flow
  const [wDx, setWDx] = useState<string[]>(doc.diagnoses);
  const [wProc, setWProc] = useState<ProcedureRow[]>(doc.procedures);
  const [dxQuery, setDxQuery] = useState("");

  function startAdding() {
    setWDx(doc.diagnoses);
    setWProc(doc.procedures);
    setAmendCoding(false);
    setReason("");
    setBody("");
    setAdding(true);
  }

  const codingChanged = amendCoding && (!sameDiagnoses(wDx, doc.diagnoses) || !sameProcedures(wProc, doc.procedures));
  const summary = codingChanged ? codingDiffSummary(doc.diagnoses, wDx, doc.procedures, wProc) : "";
  const dxOptions = DIAGNOSIS_CODES.filter((d) => !wDx.includes(d.code) && (d.code + d.label).toLowerCase().includes(dxQuery.toLowerCase()));

  function append() {
    const res = addAddendum(doc.id, {
      authorName: me,
      reason: reason.trim(),
      body: body.trim(),
      diagnoses: amendCoding ? wDx : undefined,
      procedures: amendCoding ? wProc : undefined,
    });
    if (res.codingChanged) {
      addRequestTask({
        kind: "rcm-coding-change",
        title: `Coding changed by addendum — ${doc.patientName}`,
        detail: `${doc.visitType}, DOS ${fmtDate(doc.date)}. Addendum by ${me}: ${res.summary}. Re-review the claim — a bill may already be submitted.`,
        lane: "queue",
      });
      pushNotification({
        kind: "generic",
        message: `Coding changed by addendum on ${doc.patientName}'s ${doc.visitType} (${res.summary}) — a Revenue Cycle task was raised.`,
        href: "/revenue-management/charges",
      });
    }
    setAdding(false);
    onDone(res.codingChanged ? "Addendum appended · coding amended · Revenue Cycle task raised." : "Addendum appended.");
  }

  return (
    <section id="sec-addenda" className="scroll-mt-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <h2 className="text-sm font-bold text-navy-900 dark:text-slate-100">Addenda</h2>
          {doc.addenda.length > 0 && <span className="text-xs font-bold text-slate-400">{doc.addenda.length}</span>}
        </div>
        {!adding && <button onClick={startAdding} className="text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Add addendum</button>}
      </div>
      <div className="p-4 space-y-3">
        {doc.addenda.length === 0 && !adding && (
          <p className="text-xs text-slate-400">No addenda. The signed note is immutable — corrections are appended here, timestamped and attributed, leaving the original text intact.</p>
        )}
        {doc.addenda.map((a, i) => (
          <div key={a.id} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase text-slate-400">Addendum {i + 1}</span>
              {a.affectsCoding && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400">coding change</span>}
              <span className="text-xs text-slate-400">{a.authorName} · {fmtDateTime(a.createdAt)}</span>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mt-1.5">Reason: {a.reason}</p>
            <p className="text-sm text-slate-700 dark:text-slate-200 mt-1 whitespace-pre-line">{a.body}</p>
            {a.codingSummary && (
              <p className="mt-1.5 text-xs text-purple-700 dark:text-purple-400 font-mono">{a.codingSummary} — Revenue Cycle notified</p>
            )}
          </div>
        ))}

        {adding && (
          <div className="rounded-lg border border-brand-200 dark:border-brand-900 bg-brand-50/40 dark:bg-brand-950/20 p-3 space-y-2.5">
            <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for the addendum (required)"
              className="w-full px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Addendum text — states who wrote it, when, and why"
              className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />

            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={amendCoding} onChange={(e) => setAmendCoding(e.target.checked)} className="w-3.5 h-3.5 rounded accent-brand-600" />
              This addendum changes the diagnosis or procedure coding
            </label>

            {amendCoding && (
              <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3 space-y-3">
                {/* diagnoses */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Diagnoses</p>
                  <div className="space-y-1 mb-1.5">
                    {wDx.map((code, i) => {
                      const d = DIAGNOSIS_CODES.find((x) => x.code === code);
                      return (
                        <div key={code} className={cn("flex items-center gap-2 pl-2 pr-1 py-1 rounded text-xs",
                          i === 0 ? "bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300")}>
                          {i === 0 && <span className="text-[8px] font-bold uppercase px-1 rounded bg-brand-600 text-white">1°</span>}
                          <span className="font-mono">{code}</span>
                          <span className="truncate">{d?.label}</span>
                          <span className="ml-auto flex items-center gap-0.5 shrink-0">
                            <button disabled={i === 0} onClick={() => setWDx((v) => { const n = [...v]; [n[i - 1], n[i]] = [n[i], n[i - 1]]; return n; })} className="p-0.5 disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                            <button disabled={i === wDx.length - 1} onClick={() => setWDx((v) => { const n = [...v]; [n[i + 1], n[i]] = [n[i], n[i + 1]]; return n; })} className="p-0.5 disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                            <button onClick={() => setWDx((v) => v.filter((c) => c !== code))} className="p-0.5 hover:text-red-500"><X className="w-3 h-3" /></button>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative max-w-xs">
                    <input value={dxQuery} onChange={(e) => setDxQuery(e.target.value)} placeholder="Add ICD-10…"
                      className="w-full px-2.5 py-1 rounded text-xs border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
                    {dxQuery && dxOptions.length > 0 && (
                      <div className="absolute left-0 right-0 top-8 z-20 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg max-h-40 overflow-y-auto">
                        {dxOptions.slice(0, 8).map((d) => (
                          <button key={d.code} onClick={() => { setWDx((v) => [...v, d.code]); setDxQuery(""); }}
                            className="w-full text-left px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                            <span className="font-mono font-semibold">{d.code}</span> — {d.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* procedures */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Procedures</p>
                    <button onClick={() => setWProc((v) => [...v, { id: `pc_${Math.random().toString(36).slice(2, 7)}`, description: "", code: "", quantity: "1", charge: "", dxPointers: "1", modifiers: "", pos: doc.mode === "telehealth" ? "10" : "11" }])}
                      className="flex items-center gap-1 text-[11px] font-semibold text-brand-700 dark:text-brand-400"><Plus className="w-3 h-3" /> Add row</button>
                  </div>
                  <div className="overflow-x-auto rounded border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-xs min-w-[620px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                          {["Description", "CPT", "Qty", "Charge", "Dx ptrs", "Mods", "POS", ""].map((h) => (
                            <th key={h} className="px-2 py-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {wProc.map((r) => (
                          <tr key={r.id}>
                            {(["description", "code", "quantity", "charge", "dxPointers", "modifiers", "pos"] as const).map((k) => (
                              <td key={k} className="px-1 py-0.5">
                                <input value={r[k]} onChange={(e) => setWProc((v) => v.map((x) => (x.id === r.id ? { ...x, [k]: e.target.value } : x)))}
                                  className="w-full px-1.5 py-1 rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-brand-500 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none" />
                              </td>
                            ))}
                            <td className="px-1 py-0.5 text-right">
                              <button onClick={() => setWProc((v) => v.filter((x) => x.id !== r.id))} className="text-slate-300 hover:text-red-500"><X className="w-3 h-3" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {codingChanged ? (
                  <div className="flex items-start gap-2 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 px-3 py-2 text-xs text-purple-700 dark:text-purple-400">
                    <Receipt className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>Coding will change (<span className="font-mono">{summary}</span>). Appending this raises a Revenue Cycle task to re-review the claim — a bill may already be submitted.</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400">No coding difference yet — edit the codes above.</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button disabled={!reason.trim() || !body.trim()} onClick={append}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white disabled:opacity-40">Append addendum</button>
              <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500">Cancel</button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── helpers & small pieces ────────────────────────────────────────────── */

function dxFrequency(patientId: string): string[] {
  const forPatient = getNotesForPatient(patientId).flatMap((n) => n.diagnoses);
  const all = getAllNotes().flatMap((n) => n.diagnoses);
  const seen = new Set<string>();
  return [...forPatient, ...all].filter((c) => (seen.has(c) ? false : (seen.add(c), true)));
}

function sectionComplete(doc: EncounterNoteDoc, groups: FieldGroup[]): boolean {
  const fields = groups.flatMap((g) => g.fields);
  if (fields.length === 0) return false;
  return fields.some((f) => (doc.fields[f.id] ?? "").trim().length > 0);
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="text-slate-700 dark:text-slate-200 truncate">{children}</div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cfg =
    status === "signed" ? { l: "Signed", c: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" }
    : status === "pending-cosign" ? { l: "Awaiting co-sign", c: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" }
    : status === "returned" ? { l: "Returned", c: "bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400" }
    : { l: "Draft", c: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" };
  return <span className={cn("text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0", cfg.c)}>{cfg.l}</span>;
}

function ToolBtn({ icon: Icon, label, onClick, compact }: { icon: React.ElementType; label: string; onClick: () => void; compact?: boolean }) {
  return (
    <button onClick={onClick} title={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
      <Icon className="w-3.5 h-3.5" />
      <span className={compact ? "hidden xl:inline" : "hidden sm:inline"}>{label}</span>
    </button>
  );
}

function SoapArea({ id, title, sid, collapsed, onToggle, children }: {
  id?: string; title: string; sid: string; collapsed: Set<string>; onToggle: (s: string) => void; children: React.ReactNode;
}) {
  const isCollapsed = collapsed.has(sid);
  return (
    <section id={id} className="scroll-mt-20 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <button onClick={() => onToggle(sid)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40">
        <h2 className="text-sm font-bold text-navy-900 dark:text-slate-100">{title}</h2>
        {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {!isCollapsed && <div className="px-4 pb-4 pt-1 space-y-4 border-t border-slate-100 dark:border-slate-800">{children}</div>}
    </section>
  );
}

function FieldSet({ title, fields, doc, readOnly }: { title: string; fields: FieldDef[]; doc: EncounterNoteDoc; readOnly: boolean }) {
  return (
    <div>
      {title && <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 mt-1">{title}</p>}
      <div className="grid sm:grid-cols-2 gap-x-4 gap-y-3">
        {fields.map((f) => (
          <div key={f.id} className={f.kind === "textarea" ? "sm:col-span-2" : undefined}>
            <Field field={f} doc={doc} readOnly={readOnly} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ field, doc, readOnly }: { field: FieldDef; doc: EncounterNoteDoc; readOnly: boolean }) {
  const val = doc.fields[field.id] ?? "";
  const carried = doc.carriedForwardFields?.includes(field.id);
  const cls = "w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500";
  if (readOnly) {
    return (
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{field.label}{carried && <span className="ml-1.5 text-[9px] font-bold text-amber-500 uppercase">carried forward</span>}</p>
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{val || "—"}</p>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">
        {field.label}
        {carried && <span className="ml-1.5 text-[9px] font-bold text-amber-500 uppercase">carried forward</span>}
      </label>
      {field.kind === "textarea" ? (
        <textarea rows={2} value={val} onChange={(e) => setField(doc.id, field.id, e.target.value)} className={cn(cls, "resize-y min-h-[42px]")} />
      ) : (
        <input value={val} onChange={(e) => setField(doc.id, field.id, e.target.value)} className={cls} />
      )}
    </div>
  );
}
