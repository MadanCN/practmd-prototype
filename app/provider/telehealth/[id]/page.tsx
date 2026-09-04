"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, X,
  Send, Clock, ChevronDown, ChevronUp, CheckCircle2, Save,
  FileText, Stethoscope, ClipboardList,
} from "lucide-react";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import Link from "next/link";
import {
  useEncounterStore, startSession, checkOutPatient, updateNoteDraft, toggleDiagnosisCode,
  selectTemplate, getNoteIdForAppointment, NOTE_TEMPLATES, DIAGNOSIS_CODES, PROCEDURE_CODES,
} from "@/lib/encounter-store";
import NoteTemplatePicker from "@/components/provider/NoteTemplatePicker";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";

const PATIENT_MAP = Object.fromEntries(CC_PATIENTS.map(p => [p.id, p]));

const TEXTAREA = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none";
const INPUT = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500";

function useCallTimer() {
  const [secs, setSecs] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setSecs(s => s + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ProviderTelehealthPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const store = useEncounterStore();
  const appt = CC_APPOINTMENTS.find(a => a.id === id);
  const patient = appt ? PATIENT_MAP[appt.patientId] : null;

  // Ensure the encounter exists as soon as the call is joined — idempotent,
  // so it doesn't matter how the provider got here (Waiting Room, a deep
  // link, Today's dashboard).
  useEffect(() => {
    if (appt) startSession(appt);
  }, [appt]);

  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(true);
  const [notesSaved, setNotesSaved] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [chatMsgs, setChatMsgs] = useState([
    { id: "1", from: "system", text: `${patient?.displayName ?? "Patient"} has joined the call.`, ts: new Date().toISOString() },
  ]);
  const [ended, setEnded] = useState(false);
  const [noteSectionOpen, setNoteSectionOpen] = useState<Record<string, boolean>>({
    complaint: true, subjective: false, assessment: true, plan: true, diagnosis: false, billing: false,
  });
  const duration = useCallTimer();
  const chatEnd = useRef<HTMLDivElement>(null);

  const encounter = appt ? store.encounters[appt.id] : undefined;
  const note = encounter?.note;
  const template = NOTE_TEMPLATES.find((t) => t.id === encounter?.templateId);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMsgs]);

  function sendChat() {
    if (!chatMsg.trim()) return;
    setChatMsgs(prev => [...prev, { id: crypto.randomUUID(), from: "provider", text: chatMsg, ts: new Date().toISOString() }]);
    setChatMsg("");
    setTimeout(() => {
      setChatMsgs(prev => [...prev, { id: crypto.randomUUID(), from: "patient", text: "Thank you, doctor.", ts: new Date().toISOString() }]);
    }, 2500);
  }

  function saveNote() {
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 3000);
  }

  function endCall() {
    if (appt) checkOutPatient(appt.id);
    setEnded(true);
  }

  function toggleSection(k: string) { setNoteSectionOpen(p => ({ ...p, [k]: !p[k] })); }

  if (!appt || !patient || !note) {
    return null;
  }

  if (ended) {
    const noteId = getNoteIdForAppointment(appt.id);
    return (
      <EndedView
        patient={patient.displayName}
        duration={duration}
        onOpenNote={() => noteId && router.push(`/provider/encounters/${noteId}`)}
        onBack={() => router.push("/provider/waiting-room")}
      />
    );
  }

  const patientInitials = (patient?.displayName ?? "PT").split(" ").map(n => n[0]).join("").slice(0, 2);
  const providerInitials = "SM";

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-white text-sm font-semibold">Live Telehealth</span>
          <span className="text-slate-400 text-xs">{patient?.displayName ?? "Patient"}</span>
          {appt && <span className="text-slate-500 text-xs">· {appt.visitType}</span>}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-400 text-sm">
            <Clock className="w-3.5 h-3.5" /> {duration}
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 min-h-0">
        {/* Video area */}
        <div className="flex-1 relative bg-slate-900">
          {/* Patient "video" */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={cn("w-40 h-40 rounded-full flex items-center justify-center text-white text-5xl font-bold transition-all", camOff ? "bg-slate-700" : "bg-brand-800")}>
              {patientInitials}
            </div>
            <p className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
              {patient?.displayName ?? "Patient"}
            </p>
          </div>

          {/* Provider self-view */}
          <div className="absolute bottom-20 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-brand-600 flex items-center justify-center text-white text-sm font-bold">{providerInitials}</div>
            <p className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-white/70">You</p>
            {(muted || camOff) && (
              <div className="absolute top-1 right-1 flex gap-0.5">
                {muted && <div className="w-4 h-4 rounded-full bg-red-500/90 flex items-center justify-center"><MicOff className="w-2.5 h-2.5 text-white" /></div>}
                {camOff && <div className="w-4 h-4 rounded-full bg-slate-600/90 flex items-center justify-center"><VideoOff className="w-2.5 h-2.5 text-white" /></div>}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
            <button onClick={() => setMuted(m => !m)}
              className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", muted ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600")}>
              {muted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
            </button>
            <button onClick={() => setCamOff(c => !c)}
              className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", camOff ? "bg-red-600 hover:bg-red-700" : "bg-slate-700 hover:bg-slate-600")}>
              {camOff ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
            </button>
            <button onClick={() => { setChatOpen(c => !c); setNotesOpen(false); }}
              className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", chatOpen ? "bg-brand-600" : "bg-slate-700 hover:bg-slate-600")}>
              <MessageSquare className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => { setNotesOpen(n => !n); setChatOpen(false); }}
              className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", notesOpen ? "bg-brand-600" : "bg-slate-700 hover:bg-slate-600")}>
              <ClipboardList className="w-5 h-5 text-white" />
            </button>
            <button onClick={endCall}
              className="w-14 h-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors">
              <PhoneOff className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Chat panel */}
        {chatOpen && (
          <div className="w-80 flex flex-col bg-slate-900 border-l border-slate-800">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
              <p className="text-sm font-semibold text-white">Chat</p>
              <button onClick={() => setChatOpen(false)} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
              {chatMsgs.map(m => (
                <div key={m.id} className={cn("text-sm", m.from === "system" && "text-center text-xs text-slate-500 italic")}>
                  {m.from === "system" ? m.text : (
                    <div className={cn("max-w-[85%] rounded-xl px-3 py-2", m.from === "provider" ? "bg-brand-600 text-white ml-auto" : "bg-slate-700 text-slate-200")}>
                      {m.text}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEnd} />
            </div>
            <div className="px-3 py-3 border-t border-slate-800 shrink-0 flex gap-2">
              <input className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Type a message…" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendChat(); }} />
              <button onClick={sendChat} className="p-2 rounded-lg practmd-gradient text-white">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Encounter notes panel */}
        {notesOpen && (
          <div className="w-96 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-600" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Quick notes</p>
              </div>
              <div className="flex items-center gap-2">
                {notesSaved && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Saved
                  </span>
                )}
                {getNoteIdForAppointment(appt.id) && (
                  <Link href={`/provider/encounters/${getNoteIdForAppointment(appt.id)}`} target="_blank"
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800">
                    <ExternalLink className="w-3 h-3" /> Full note
                  </Link>
                )}
                <button onClick={saveNote} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg practmd-gradient text-white text-xs font-medium">
                  <Save className="w-3 h-3" /> Save
                </button>
                <button onClick={() => setNotesOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Patient info strip */}
              {patient && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-100 dark:border-brand-900/30">
                  <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{patientInitials}</div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{patient.displayName}</p>
                    <p className="text-[10px] text-slate-500">{patient.mrn} · {appt?.visitType}</p>
                  </div>
                </div>
              )}

              {!encounter?.templateId ? (
                <NoteTemplatePicker compact onSelect={(tplId) => selectTemplate(appt.id, tplId)} />
              ) : (
                <>
                  {/* Chief Complaint */}
                  <NoteSection icon={Stethoscope} title="Chief Complaint" open={noteSectionOpen.complaint} onToggle={() => toggleSection("complaint")}>
                    <textarea rows={2} className={TEXTAREA} value={note.chiefComplaint}
                      onChange={e => updateNoteDraft(appt.id, { chiefComplaint: e.target.value })}
                      placeholder={template?.placeholders.chiefComplaint ?? "Reason for today's visit…"} />
                  </NoteSection>

                  {/* Subjective */}
                  <NoteSection icon={MessageSquare} title="Subjective / HPI" open={noteSectionOpen.subjective} onToggle={() => toggleSection("subjective")}>
                    <textarea rows={3} className={TEXTAREA} value={note.subjective}
                      onChange={e => updateNoteDraft(appt.id, { subjective: e.target.value })}
                      placeholder={template?.placeholders.subjective ?? "Patient's report, history of present illness…"} />
                  </NoteSection>

                  {/* Assessment */}
                  <NoteSection icon={ClipboardList} title="Assessment" open={noteSectionOpen.assessment} onToggle={() => toggleSection("assessment")}>
                    <textarea rows={3} className={TEXTAREA} value={note.assessment}
                      onChange={e => updateNoteDraft(appt.id, { assessment: e.target.value })}
                      placeholder={template?.placeholders.assessment ?? "Clinical impressions, diagnosis updates…"} />
                  </NoteSection>

                  {/* Plan */}
                  <NoteSection icon={FileText} title="Plan" open={noteSectionOpen.plan} onToggle={() => toggleSection("plan")}>
                    <textarea rows={3} className={TEXTAREA} value={note.plan}
                      onChange={e => updateNoteDraft(appt.id, { plan: e.target.value })}
                      placeholder={template?.placeholders.plan ?? "Treatment plan, orders, referrals…"} />
                  </NoteSection>

                  {/* Diagnosis Codes */}
                  <NoteSection icon={ClipboardList} title="Diagnosis Codes (ICD-10)" open={noteSectionOpen.diagnosis} onToggle={() => toggleSection("diagnosis")}>
                    {note.diagnosisCodes.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {note.diagnosisCodes.map(code => (
                          <span key={code} className="flex items-center gap-1 text-[11px] font-medium pl-2 pr-1 py-0.5 rounded-full bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-400">
                            {code}
                            <button onClick={() => toggleDiagnosisCode(appt.id, code)} className="hover:text-brand-900 dark:hover:text-brand-200"><X className="w-2.5 h-2.5" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                    <select className={INPUT} value="" onChange={e => e.target.value && toggleDiagnosisCode(appt.id, e.target.value)}>
                      <option value="">+ Add a diagnosis code…</option>
                      {DIAGNOSIS_CODES.filter(d => !note.diagnosisCodes.includes(d.code)).map(d => (
                        <option key={d.code} value={d.code}>{d.code} — {d.label}</option>
                      ))}
                    </select>
                  </NoteSection>

                  {/* Billing */}
                  <NoteSection icon={FileText} title="Billing Code" open={noteSectionOpen.billing} onToggle={() => toggleSection("billing")}>
                    <select className={INPUT} value={note.procedureCode} onChange={e => updateNoteDraft(appt.id, { procedureCode: e.target.value })}>
                      {PROCEDURE_CODES.map(bc => <option key={bc.code} value={bc.code}>{bc.code} — {bc.label}</option>)}
                    </select>
                    <div className="flex items-center gap-3 mt-2">
                      <label className="text-xs text-slate-500 shrink-0">Session duration</label>
                      <select className={cn(INPUT, "w-28")} value={note.durationMin} onChange={e => updateNoteDraft(appt.id, { durationMin: e.target.value })}>
                        {["15", "30", "45", "60", "75", "90"].map(d => <option key={d} value={d}>{d} min</option>)}
                      </select>
                    </div>
                  </NoteSection>
                </>
              )}
            </div>

            {/* Save at bottom */}
            {encounter?.templateId && (
              <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
                <button onClick={saveNote}
                  className="w-full py-2.5 rounded-xl practmd-gradient text-white text-sm font-semibold flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Save Encounter Note
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function NoteSection({ icon: Icon, title, open, onToggle, children }: {
  icon: React.ElementType; title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <Icon className="w-3.5 h-3.5 text-brand-600 shrink-0" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 text-left">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>
      {open && <div className="px-3 py-3 bg-white dark:bg-slate-900">{children}</div>}
    </div>
  );
}

function EndedView({ patient, duration, onOpenNote, onBack }: {
  patient: string; duration: string; onOpenNote: () => void; onBack: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center border-b border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Call Ended</h2>
          <p className="text-sm text-slate-500 mt-1">Session with {patient} · Duration {duration}</p>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600 dark:text-slate-400">The encounter note is now pending your signature. Open it to document the visit and send the charge to billing.</p>
          <button onClick={onOpenNote} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl practmd-gradient text-white text-sm font-semibold">
            <FileText className="w-4 h-4" /> Open encounter note
          </button>
          <button onClick={onBack} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
            Complete later
          </button>
        </div>
      </div>
    </div>
  );
}
