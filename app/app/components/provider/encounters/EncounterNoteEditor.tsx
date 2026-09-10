"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, ChevronDown, ChevronRight, Printer, Download, Send, Save,
  ShieldCheck, CheckCircle2, Plus, X, Lock, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DIAGNOSIS_CODES, completeEncounterForNote, pushNotification } from "@/lib/encounter-store";
import { createChargeFromNote } from "@/lib/charge-store";
import { PROVIDERS } from "@/data/providers";
import { getPatientProfile, calcAge } from "@/data/provider-patients";
import {
  useEncounterNotes, getNote, setField, setMeta, toggleDiagnosis, addProcedure,
  updateProcedure, removeProcedure, signNote, addCoSign,
  groupsFor, FOLLOWUP_FIELDS, NOTE_TYPES, ENCOUNTER_MODES,
  type FieldDef, type NoteType, type EncounterNoteDoc,
} from "@/lib/encounter-notes-store";

const CO_SIGNERS = PROVIDERS.filter((p) => p.kind === "provider" && p.id !== "p1");

function fmtDate(ymd: string) {
  return new Date(ymd + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function EncounterNoteEditor({ id }: { id: string }) {
  useEncounterNotes();
  const doc = getNote(id);

  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dxQuery, setDxQuery] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [signMenu, setSignMenu] = useState(false);
  const [coSignPick, setCoSignPick] = useState<string>(CO_SIGNERS[0]?.displayName ?? "");
  const [askCoSign, setAskCoSign] = useState(false);

  if (!doc) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Note not found</h1>
        <Link href="/provider/encounter-notes" className="mt-4 text-sm font-semibold text-brand-700 dark:text-brand-400 hover:underline">← All encounter notes</Link>
      </div>
    );
  }

  const readOnly = doc.status !== "draft";
  const patient = getPatientProfile(doc.patientId);
  const groups = groupsFor(doc.noteType);

  function flash(m: string) { setToast(m); setTimeout(() => setToast(null), 2600); }

  /** After a note is signed: close the linked encounter and drop a charge
   *  into the Revenue Management worklist. */
  function afterSign() {
    const signed = getNote(id);
    if (!signed || signed.status !== "signed") return;
    completeEncounterForNote(signed.appointmentId);
    const charge = createChargeFromNote(signed);
    pushNotification({
      kind: "charge-created",
      message: `Charge sent to billing — ${signed.patientName} · ${signed.visitType} · $${charge.total.toFixed(2)}`,
      href: "/revenue-management/charges",
    });
  }
  function toggle(sid: string) {
    setCollapsed((prev) => {
      const n = new Set(prev);
      if (n.has(sid)) n.delete(sid); else n.add(sid);
      return n;
    });
  }

  const filteredDx = DIAGNOSIS_CODES.filter(
    (d) => !doc.diagnoses.includes(d.code) && (d.code + d.label).toLowerCase().includes(dxQuery.toLowerCase()),
  );

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      {/* Back */}
      <Link href="/provider/encounter-notes" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-3">
        <ChevronLeft className="w-4 h-4" /> Encounter notes
      </Link>

      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Template</span>
            <select
              value={doc.noteType}
              disabled={readOnly}
              onChange={(e) => setMeta(doc.id, { noteType: e.target.value as NoteType })}
              className="px-2.5 py-1.5 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 disabled:opacity-70"
            >
              {NOTE_TYPES.map((n) => <option key={n} value={n}>{n} note</option>)}
            </select>
            <StatusPill doc={doc} />
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            <ToolBtn icon={Download} label="Export" onClick={() => flash("Note exported as PDF.")} />
            <ToolBtn icon={Printer} label="Print" onClick={() => window.print()} />
            <ToolBtn icon={Send} label="Send summary to patient" onClick={() => flash(`Visit summary sent to ${doc.patientName}.`)} compact />

            {!readOnly && (
              <>
                <button onClick={() => flash("Draft saved.")} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                  <Save className="w-3.5 h-3.5" /> Save draft
                </button>
                <div className="relative">
                  <button onClick={() => setSignMenu((o) => !o)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white">
                    <ShieldCheck className="w-3.5 h-3.5" /> Sign <ChevronDown className="w-3 h-3" />
                  </button>
                  {signMenu && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setSignMenu(false)} />
                      <div className="absolute right-0 top-10 z-40 w-56 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl p-1.5">
                        <button onClick={() => { signNote(doc.id, { requestCoSign: false }); afterSign(); setSignMenu(false); flash("Note signed · charge sent to billing."); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                          <ShieldCheck className="w-4 h-4 text-brand-600" /> Sign
                        </button>
                        <button onClick={() => { setAskCoSign(true); setSignMenu(false); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
                          <Users className="w-4 h-4 text-brand-600" /> Sign & request co-sign
                        </button>
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
            <button onClick={() => { signNote(doc.id, { requestCoSign: true, coSignerName: coSignPick }); setAskCoSign(false); flash(`Signed — co-signature requested from ${coSignPick}.`); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white">
              Sign & send request
            </button>
            <button onClick={() => setAskCoSign(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500">Cancel</button>
          </div>
        )}

        {readOnly && (
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            {doc.status === "signed"
              ? `Signed ${doc.signedAt ? fmtDateTime(doc.signedAt) : ""} — this note is locked.`
              : `Signed and awaiting co-signature from ${doc.coSignerName}.`}
            {doc.status === "pending-cosign" && (
              <button onClick={() => { addCoSign(doc.id, doc.coSignerName ?? "Co-signer"); afterSign(); flash("Co-signature added · charge sent to billing."); }} className="ml-2 font-semibold text-brand-700 dark:text-brand-400 hover:underline">
                Add co-signature (demo)
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Patient info bar ────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 mb-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-4 gap-y-2.5 text-sm">
        <Meta label="Patient">
          <Link href={`/provider/patients/${doc.patientId}`} className="font-semibold text-brand-700 dark:text-brand-400 hover:underline">{doc.patientName}</Link>
        </Meta>
        <Meta label="Date">{fmtDate(doc.date)}</Meta>
        <Meta label="Provider">{doc.providerName}</Meta>
        <Meta label="Age">{patient ? `${calcAge(patient.dob)} yrs` : "—"}</Meta>
        <Meta label="Mode">
          {readOnly ? <span className="capitalize">{doc.mode}</span> : (
            <select value={doc.mode} onChange={(e) => setMeta(doc.id, { mode: e.target.value as (typeof ENCOUNTER_MODES)[number] })} className={metaSel}>
              {ENCOUNTER_MODES.map((m) => <option key={m} value={m} className="capitalize">{m}</option>)}
            </select>
          )}
        </Meta>
        <Meta label="Visit type">
          {readOnly ? doc.visitType : (
            <input value={doc.visitType} onChange={(e) => setMeta(doc.id, { visitType: e.target.value })} className={metaSel} />
          )}
        </Meta>
        <Meta label="Resource">{doc.resource}</Meta>
        <Meta label="Note type">{doc.noteType}</Meta>
        <Meta label="Signed by">{doc.signedBy.length ? doc.signedBy.join(", ") : "—"}</Meta>
      </div>

      {/* ── Sections ────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <SoapArea title="Subjective" sid="subjective" collapsed={collapsed} onToggle={toggle}>
          {groups.subjective.map((g) => (
            <FieldSet key={g.id} title={g.title} fields={g.fields} doc={doc} readOnly={readOnly} />
          ))}
        </SoapArea>

        {groups.objective.length > 0 && (
          <SoapArea title="Objective" sid="objective" collapsed={collapsed} onToggle={toggle}>
            <div className="rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 mb-3 text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="font-medium text-slate-600 dark:text-slate-300">Health vitals</span>
              <Link href={`/provider/patients/${doc.patientId}?section=vitals`} className="text-brand-700 dark:text-brand-400 hover:underline flex items-center gap-0.5">
                View / record vitals <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {groups.objective.map((g) => (
              <FieldSet key={g.id} title={g.title} fields={g.fields} doc={doc} readOnly={readOnly} />
            ))}
          </SoapArea>
        )}

        <SoapArea title="Assessment" sid="assessment" collapsed={collapsed} onToggle={toggle}>
          {groups.assessment.map((g) => (
            <FieldSet key={g.id} title={g.title} fields={g.fields} doc={doc} readOnly={readOnly} />
          ))}
          {/* Diagnoses */}
          <div className="mt-1">
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5">Diagnoses</p>
            {doc.diagnoses.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {doc.diagnoses.map((code) => {
                  const d = DIAGNOSIS_CODES.find((x) => x.code === code);
                  return (
                    <span key={code} className="inline-flex items-center gap-1.5 pl-2 pr-1 py-1 rounded-lg text-xs font-medium bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400">
                      {code}{d ? ` — ${d.label}` : ""}
                      {!readOnly && <button onClick={() => toggleDiagnosis(doc.id, code)} className="hover:text-brand-900 dark:hover:text-brand-200"><X className="w-3 h-3" /></button>}
                    </span>
                  );
                })}
              </div>
            )}
            {!readOnly && (
              <div className="relative max-w-sm">
                <input value={dxQuery} onChange={(e) => setDxQuery(e.target.value)} placeholder="Search ICD-10 code or condition…" className="w-full px-3 py-1.5 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500" />
                {dxQuery && filteredDx.length > 0 && (
                  <div className="absolute left-0 right-0 top-9 z-20 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-lg max-h-52 overflow-y-auto">
                    {filteredDx.map((d) => (
                      <button key={d.code} onClick={() => { toggleDiagnosis(doc.id, d.code); setDxQuery(""); }} className="w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                        <span className="font-mono font-semibold">{d.code}</span> — {d.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </SoapArea>

        <SoapArea title="Plan" sid="plan" collapsed={collapsed} onToggle={toggle}>
          {groups.plan.map((g) => (
            <FieldSet key={g.id} title={g.title} fields={g.fields} doc={doc} readOnly={readOnly} />
          ))}
        </SoapArea>

        {/* Billing */}
        <SoapArea title="Billing" sid="billing" collapsed={collapsed} onToggle={toggle}>
          <Field field={{ id: "bill.notes", label: "Billing notes", kind: "textarea" }} doc={doc} readOnly={readOnly} />
          <div className="mt-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Procedure codes</p>
              {!readOnly && (
                <button onClick={() => addProcedure(doc.id)} className="flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Add code
                </button>
              )}
            </div>
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm min-w-[760px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-left">
                    {["Description", "Code", "Qty", "Charge", "Dx pointers", "Modifiers", "POS", ""].map((h) => (
                      <th key={h} className="px-2.5 py-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {doc.procedures.length === 0 ? (
                    <tr><td colSpan={8} className="px-3 py-4 text-center text-xs text-slate-400">No procedure codes added.</td></tr>
                  ) : doc.procedures.map((r) => (
                    <tr key={r.id}>
                      {(["description", "code", "quantity", "charge", "dxPointers", "modifiers", "pos"] as const).map((k) => (
                        <td key={k} className="px-1.5 py-1">
                          <input
                            value={r[k]}
                            disabled={readOnly}
                            onChange={(e) => updateProcedure(doc.id, r.id, { [k]: e.target.value })}
                            className="w-full px-1.5 py-1 rounded text-xs border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-brand-500 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-70"
                          />
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

        {/* Follow-up */}
        <SoapArea title="Follow-up" sid="followup" collapsed={collapsed} onToggle={toggle}>
          <FieldSet title="" fields={FOLLOWUP_FIELDS} doc={doc} readOnly={readOnly} />
        </SoapArea>
      </div>

      {toast && (
        <div className="fixed bottom-5 right-5 z-[80] flex items-center gap-2.5 px-4 py-3 rounded-xl bg-navy-900 text-white text-sm shadow-2xl">
          <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" /> {toast}
        </div>
      )}
    </div>
  );
}

/* ── pieces ────────────────────────────────────────────────────────────── */

const metaSel = "w-full px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:ring-1 focus:ring-brand-500";

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="text-slate-700 dark:text-slate-200 truncate">{children}</div>
    </div>
  );
}

function StatusPill({ doc }: { doc: { status: string } }) {
  const cfg =
    doc.status === "signed" ? { l: "Signed", c: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" }
    : doc.status === "pending-cosign" ? { l: "Awaiting co-sign", c: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" }
    : { l: "Draft", c: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400" };
  return <span className={cn("text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded", cfg.c)}>{cfg.l}</span>;
}

function ToolBtn({ icon: Icon, label, onClick, compact }: { icon: React.ElementType; label: string; onClick: () => void; compact?: boolean }) {
  return (
    <button onClick={onClick} title={label} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
      <Icon className="w-3.5 h-3.5" />
      <span className={compact ? "hidden xl:inline" : "hidden sm:inline"}>{label}</span>
    </button>
  );
}

function SoapArea({
  title, sid, collapsed, onToggle, children,
}: {
  title: string; sid: string; collapsed: Set<string>; onToggle: (s: string) => void; children: React.ReactNode;
}) {
  const isCollapsed = collapsed.has(sid);
  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
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
  const cls = "w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500";
  if (readOnly) {
    return (
      <div>
        <p className="text-xs text-slate-400 mb-0.5">{field.label}</p>
        <p className="text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line">{val || "—"}</p>
      </div>
    );
  }
  return (
    <div>
      <label className="block text-xs text-slate-400 mb-1">{field.label}</label>
      {field.kind === "textarea" ? (
        <textarea rows={2} value={val} onChange={(e) => setField(doc.id, field.id, e.target.value)} className={cn(cls, "resize-y min-h-[42px]")} />
      ) : (
        <input value={val} onChange={(e) => setField(doc.id, field.id, e.target.value)} className={cls} />
      )}
    </div>
  );
}
