"use client";

import { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, MessageSquare, X,
  Send, Clock, ChevronDown, ChevronUp, CheckCircle2, Save,
  FileText, Stethoscope, ClipboardList, Pill, AlertTriangle,
} from "lucide-react";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { cn } from "@/lib/utils";

const PATIENT_MAP = Object.fromEntries(CC_PATIENTS.map(p => [p.id, p]));

interface EncounterNote {
  chiefComplaint: string;
  subjective: string;
  assessment: string;
  plan: string;
  followUpWeeks: string;
  medicationsChanged: boolean;
  medicationNotes: string;
  billCode: string;
  duration: string;
}

const BLANK_NOTE: EncounterNote = {
  chiefComplaint: "",
  subjective: "",
  assessment: "",
  plan: "",
  followUpWeeks: "4",
  medicationsChanged: false,
  medicationNotes: "",
  billCode: "90834",
  duration: "45",
};

const BILL_CODES = [
  { code: "90791", label: "Psychiatric Eval (initial)" },
  { code: "90792", label: "Psychiatric Eval w/ medical (initial)" },
  { code: "90832", label: "Psychotherapy 30 min" },
  { code: "90834", label: "Psychotherapy 45 min" },
  { code: "90837", label: "Psychotherapy 60 min" },
  { code: "99213", label: "E&M — Established, Low complexity" },
  { code: "99214", label: "E&M — Established, Moderate complexity" },
];

const TEXTAREA = "w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none";
const INPUT = "w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-violet-500";

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
  const appt = CC_APPOINTMENTS.find(a => a.id === id);
  const patient = appt ? PATIENT_MAP[appt.patientId] : null;

  const [muted, setMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [notesOpen, setNotesOpen] = useState(true);
  const [notesSaved, setNotesSaved] = useState(false);
  const [note, setNote] = useState<EncounterNote>({ ...BLANK_NOTE });
  const [chatMsg, setChatMsg] = useState("");
  const [chatMsgs, setChatMsgs] = useState([
    { id: "1", from: "system", text: `${patient?.displayName ?? "Patient"} has joined the call.`, ts: new Date().toISOString() },
  ]);
  const [ended, setEnded] = useState(false);
  const [noteSectionOpen, setNoteSectionOpen] = useState<Record<string, boolean>>({
    complaint: true, subjective: false, assessment: true, plan: true, billing: false,
  });
  const duration = useCallTimer();
  const chatEnd = useRef<HTMLDivElement>(null);

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

  function endCall() { setEnded(true); }

  function toggleSection(k: string) { setNoteSectionOpen(p => ({ ...p, [k]: !p[k] })); }

  if (ended) {
    return <EndedView patient={patient?.displayName ?? "Patient"} duration={duration} note={note} onBack={() => router.push("/provider/waiting-room")} />;
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
            <div className={cn("w-40 h-40 rounded-full flex items-center justify-center text-white text-5xl font-bold transition-all", camOff ? "bg-slate-700" : "bg-violet-800")}>
              {patientInitials}
            </div>
            <p className="absolute bottom-24 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/40 px-3 py-1 rounded-full">
              {patient?.displayName ?? "Patient"}
            </p>
          </div>

          {/* Provider self-view */}
          <div className="absolute bottom-20 right-4 w-32 h-24 rounded-xl overflow-hidden border-2 border-slate-700 bg-slate-800 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white text-sm font-bold">{providerInitials}</div>
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
              className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", chatOpen ? "bg-violet-600" : "bg-slate-700 hover:bg-slate-600")}>
              <MessageSquare className="w-5 h-5 text-white" />
            </button>
            <button onClick={() => { setNotesOpen(n => !n); setChatOpen(false); }}
              className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", notesOpen ? "bg-violet-600" : "bg-slate-700 hover:bg-slate-600")}>
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
                    <div className={cn("max-w-[85%] rounded-xl px-3 py-2", m.from === "provider" ? "bg-violet-600 text-white ml-auto" : "bg-slate-700 text-slate-200")}>
                      {m.text}
                    </div>
                  )}
                </div>
              ))}
              <div ref={chatEnd} />
            </div>
            <div className="px-3 py-3 border-t border-slate-800 shrink-0 flex gap-2">
              <input className="flex-1 px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                placeholder="Type a message…" value={chatMsg} onChange={e => setChatMsg(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") sendChat(); }} />
              <button onClick={sendChat} className="p-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white">
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
                <FileText className="w-4 h-4 text-violet-600" />
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Encounter Notes</p>
              </div>
              <div className="flex items-center gap-2">
                {notesSaved && (
                  <span className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Saved
                  </span>
                )}
                <button onClick={saveNote} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium">
                  <Save className="w-3 h-3" /> Save
                </button>
                <button onClick={() => setNotesOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {/* Patient info strip */}
              {patient && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30">
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">{patientInitials}</div>
                  <div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{patient.displayName}</p>
                    <p className="text-[10px] text-slate-500">{patient.mrn} · {appt?.visitType}</p>
                  </div>
                </div>
              )}

              {/* Chief Complaint */}
              <NoteSection icon={Stethoscope} title="Chief Complaint" open={noteSectionOpen.complaint} onToggle={() => toggleSection("complaint")}>
                <textarea rows={2} className={TEXTAREA} value={note.chiefComplaint}
                  onChange={e => setNote(n => ({ ...n, chiefComplaint: e.target.value }))}
                  placeholder="Reason for today's visit…" />
              </NoteSection>

              {/* Subjective */}
              <NoteSection icon={MessageSquare} title="Subjective / HPI" open={noteSectionOpen.subjective} onToggle={() => toggleSection("subjective")}>
                <textarea rows={3} className={TEXTAREA} value={note.subjective}
                  onChange={e => setNote(n => ({ ...n, subjective: e.target.value }))}
                  placeholder="Patient's report, history of present illness…" />
              </NoteSection>

              {/* Assessment */}
              <NoteSection icon={ClipboardList} title="Assessment" open={noteSectionOpen.assessment} onToggle={() => toggleSection("assessment")}>
                <textarea rows={3} className={TEXTAREA} value={note.assessment}
                  onChange={e => setNote(n => ({ ...n, assessment: e.target.value }))}
                  placeholder="Clinical impressions, diagnosis updates…" />
              </NoteSection>

              {/* Plan */}
              <NoteSection icon={FileText} title="Plan" open={noteSectionOpen.plan} onToggle={() => toggleSection("plan")}>
                <textarea rows={3} className={TEXTAREA} value={note.plan}
                  onChange={e => setNote(n => ({ ...n, plan: e.target.value }))}
                  placeholder="Treatment plan, orders, referrals…" />
                <div className="mt-2 flex items-center gap-3">
                  <label className="text-xs text-slate-500">Follow-up in</label>
                  <select className={cn(INPUT, "w-28")} value={note.followUpWeeks} onChange={e => setNote(n => ({ ...n, followUpWeeks: e.target.value }))}>
                    {["1", "2", "3", "4", "6", "8", "12"].map(w => <option key={w} value={w}>{w} week{w !== "1" ? "s" : ""}</option>)}
                  </select>
                </div>
              </NoteSection>

              {/* Medications */}
              <NoteSection icon={Pill} title="Medications" open={noteSectionOpen.meds ?? false} onToggle={() => toggleSection("meds")}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div onClick={() => setNote(n => ({ ...n, medicationsChanged: !n.medicationsChanged }))}
                    className={cn("w-8 h-4.5 rounded-full relative transition-colors cursor-pointer", note.medicationsChanged ? "bg-violet-500" : "bg-slate-300 dark:bg-slate-600")} style={{ height: "18px" }}>
                    <span className={cn("absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform", note.medicationsChanged ? "left-4" : "left-0.5")} />
                  </div>
                  <span className="text-xs text-slate-600 dark:text-slate-400">Medications changed this visit</span>
                </label>
                {note.medicationsChanged && (
                  <textarea rows={2} className={cn(TEXTAREA, "mt-2")} value={note.medicationNotes}
                    onChange={e => setNote(n => ({ ...n, medicationNotes: e.target.value }))}
                    placeholder="List medication changes…" />
                )}
              </NoteSection>

              {/* Billing */}
              <NoteSection icon={AlertTriangle} title="Billing Code" open={noteSectionOpen.billing} onToggle={() => toggleSection("billing")}>
                <select className={INPUT} value={note.billCode} onChange={e => setNote(n => ({ ...n, billCode: e.target.value }))}>
                  {BILL_CODES.map(bc => <option key={bc.code} value={bc.code}>{bc.code} — {bc.label}</option>)}
                </select>
                <div className="flex items-center gap-3 mt-2">
                  <label className="text-xs text-slate-500 shrink-0">Session duration</label>
                  <select className={cn(INPUT, "w-28")} value={note.duration} onChange={e => setNote(n => ({ ...n, duration: e.target.value }))}>
                    {["15", "30", "45", "60", "75", "90"].map(d => <option key={d} value={d}>{d} min</option>)}
                  </select>
                </div>
              </NoteSection>
            </div>

            {/* Save at bottom */}
            <div className="shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-800">
              <button onClick={saveNote}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold flex items-center justify-center gap-2">
                <Save className="w-4 h-4" /> Save Encounter Note
              </button>
            </div>
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
        <Icon className="w-3.5 h-3.5 text-violet-600 shrink-0" />
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex-1 text-left">{title}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
      </button>
      {open && <div className="px-3 py-3 bg-white dark:bg-slate-900">{children}</div>}
    </div>
  );
}

function EndedView({ patient, duration, note, onBack }: {
  patient: string; duration: string; note: EncounterNote; onBack: () => void;
}) {
  const [finalSaved, setFinalSaved] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center border-b border-slate-200 dark:border-slate-800">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Call Ended</h2>
          <p className="text-sm text-slate-500 mt-1">Session with {patient} · Duration {duration}</p>
        </div>

        {!finalSaved ? (
          <div className="p-6 space-y-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Review & Save Encounter Note</p>
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              {note.chiefComplaint && <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Chief Complaint</span><span className="flex-1">{note.chiefComplaint}</span></div>}
              {note.assessment && <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Assessment</span><span className="flex-1">{note.assessment}</span></div>}
              {note.plan && <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Plan</span><span className="flex-1">{note.plan}</span></div>}
              <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Billing Code</span><span>{note.billCode} · {note.duration} min</span></div>
              <div className="flex gap-2"><span className="text-slate-400 w-28 shrink-0">Follow-up</span><span>{note.followUpWeeks} week(s)</span></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setFinalSaved(true)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold">
                <Save className="w-4 h-4" /> Sign & Save Note
              </button>
              <button onClick={onBack} className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                Skip
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center space-y-4">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Encounter note signed and saved to patient chart.</p>
            <button onClick={onBack} className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold">
              Back to Waiting Room
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
