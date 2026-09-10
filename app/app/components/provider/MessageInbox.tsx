"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Send, X, AlertTriangle, User, Users, Pill, FlaskConical } from "lucide-react";
import { CC_APPOINTMENTS } from "@/data/cc-appointments";
import { CC_PATIENTS } from "@/data/cc-patients";
import { STAFF } from "@/data/providers";
import {
  PROVIDER_MESSAGE_THREADS, threadPreview, threadLastActivity,
  type ProviderMessageThread, type MessageChannel, type MessageFromRole, type ThreadMessage,
} from "@/data/provider-today";
import { cn } from "@/lib/utils";

const CURRENT_PROVIDER_ID = "p1";
const ME = "Dr. Sarah Mitchell";

const ROLE_CFG: Record<MessageFromRole, { label: string; icon: React.ElementType; cls: string }> = {
  patient: { label: "Patient", icon: User, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  staff: { label: "Staff", icon: Users, cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  pharmacy: { label: "Pharmacy", icon: Pill, cls: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-400" },
  lab: { label: "Lab", icon: FlaskConical, cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
};

function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

export default function MessageInbox({ channel }: { channel: MessageChannel }) {
  const [threads, setThreads] = useState<ProviderMessageThread[]>(() => PROVIDER_MESSAGE_THREADS.filter((t) => t.channel === channel));
  // Deep-link support: ?thread=<id> selects that thread on load.
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("thread");
  });
  const [query, setQuery] = useState("");
  const [reply, setReply] = useState("");
  const [composerOpen, setComposerOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");

  const myPatients = useMemo(() => {
    const ids = new Set(CC_APPOINTMENTS.filter((a) => a.providerId === CURRENT_PROVIDER_ID).map((a) => a.patientId));
    return CC_PATIENTS.filter((p) => ids.has(p.id));
  }, []);
  const recipients = channel === "patient" ? myPatients.map((p) => ({ id: p.id, name: p.displayName })) : STAFF.filter((s) => s.isActive).map((s) => ({ id: s.id, name: `${s.displayName} — ${s.role}` }));

  const sorted = useMemo(
    () => [...threads]
      .filter((t) => !query.trim() || t.participantName.toLowerCase().includes(query.toLowerCase()) || t.subject.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => (threadLastActivity(a) < threadLastActivity(b) ? 1 : -1)),
    [threads, query]
  );

  const selected = threads.find((t) => t.id === selectedId) ?? null;

  function openThread(tid: string) {
    setSelectedId(tid);
    setThreads((prev) => prev.map((t) => (t.id === tid ? { ...t, unread: false } : t)));
  }

  function sendReply() {
    if (!selected || !reply.trim()) return;
    const msg: ThreadMessage = { id: id("m"), fromMe: true, senderName: ME, body: reply.trim(), timestamp: new Date().toISOString() };
    setThreads((prev) => prev.map((t) => (t.id === selected.id ? { ...t, messages: [...t.messages, msg] } : t)));
    setReply("");
  }

  function sendNewMessage() {
    if (!composeTo || !composeSubject.trim() || !composeBody.trim()) return;
    const recipient = recipients.find((r) => r.id === composeTo);
    const newThread: ProviderMessageThread = {
      id: id("thread"),
      channel,
      patientId: channel === "patient" ? composeTo : undefined,
      participantName: recipient?.name.split(" — ")[0] ?? "Unknown",
      participantRole: channel === "patient" ? "patient" : "staff",
      subject: composeSubject.trim(),
      unread: false,
      messages: [{ id: id("m"), fromMe: true, senderName: ME, body: composeBody.trim(), timestamp: new Date().toISOString() }],
    };
    setThreads((prev) => [newThread, ...prev]);
    setSelectedId(newThread.id);
    setComposerOpen(false);
    setComposeTo(""); setComposeSubject(""); setComposeBody("");
  }

  return (
    <div className="flex h-[calc(100vh-60px)]">
      {/* Thread list */}
      <div className="w-[340px] shrink-0 border-r border-slate-200 dark:border-slate-800 flex flex-col bg-white dark:bg-slate-900" data-tour="msg-list">
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 space-y-2 shrink-0">
          <button onClick={() => setComposerOpen(true)} data-tour="msg-new"
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg practmd-gradient text-white text-xs font-semibold transition-colors">
            <Plus className="w-3.5 h-3.5" /> New Message
          </button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search threads…"
              className="w-full pl-7 pr-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/60">
          {sorted.length === 0 && <p className="text-center text-xs text-slate-400 py-8">No threads yet.</p>}
          {sorted.map((t) => {
            const cfg = ROLE_CFG[t.participantRole];
            const Icon = cfg.icon;
            const active = t.id === selectedId;
            return (
              <button key={t.id} onClick={() => openThread(t.id)}
                className={cn("w-full text-left px-3 py-3 transition-colors", active ? "bg-brand-50 dark:bg-brand-950/30" : "hover:bg-slate-50 dark:hover:bg-slate-800/40")}>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className={cn("w-6 h-6 rounded-md flex items-center justify-center shrink-0", cfg.cls)}><Icon className="w-3 h-3" /></div>
                  {t.unread && <span className="w-1.5 h-1.5 rounded-full bg-brand-600 shrink-0" />}
                  <p className={cn("text-xs truncate flex-1", t.unread ? "font-bold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300")}>{t.participantName}</p>
                  {t.urgent && <AlertTriangle className="w-3 h-3 text-red-500 shrink-0" />}
                </div>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-400 truncate">{t.subject}</p>
                <p className="text-[11px] text-slate-400 truncate">{threadPreview(t)}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{timeAgo(threadLastActivity(t))}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thread content */}
      <div className="flex-1 flex flex-col min-w-0">
        {!selected ? (
          <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Select a thread to view the conversation.</div>
        ) : (
          <>
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{selected.participantName}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{selected.subject}</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {selected.messages.map((m) => (
                <div key={m.id} className={cn("max-w-[70%] flex flex-col", m.fromMe ? "ml-auto items-end" : "items-start")}>
                  <div className={cn("px-3.5 py-2.5 rounded-2xl text-sm", m.fromMe ? "bg-brand-600 text-white rounded-br-sm" : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-sm")}>
                    {m.body}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">{m.senderName} · {timeAgo(m.timestamp)}</p>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
              <div className="flex items-end gap-2">
                <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={2} placeholder="Type a reply…"
                  className="flex-1 px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
                <button onClick={sendReply} disabled={!reply.trim()}
                  className={cn("flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors shrink-0",
                    reply.trim() ? "practmd-gradient text-white" : "bg-brand-100 dark:bg-brand-950/40 text-brand-300 dark:text-brand-800 cursor-not-allowed")}>
                  <Send className="w-4 h-4" /> Send
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New message composer */}
      {composerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setComposerOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-[440px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">New Message — {channel === "patient" ? "Patient" : "Internal"}</h2>
              <button onClick={() => setComposerOpen(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">To</label>
                <select value={composeTo} onChange={(e) => setComposeTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100">
                  <option value="">Select a recipient…</option>
                  {recipients.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
                <input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject"
                  className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Content</label>
                <textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} rows={4} placeholder="Write your message…"
                  className="w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none" />
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-200 dark:border-slate-800">
              <button onClick={() => setComposerOpen(false)} className="px-4 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
              <button onClick={sendNewMessage} disabled={!composeTo || !composeSubject.trim() || !composeBody.trim()}
                className={cn("px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
                  composeTo && composeSubject.trim() && composeBody.trim() ? "practmd-gradient text-white" : "bg-brand-100 dark:bg-brand-950/40 text-brand-300 dark:text-brand-800 cursor-not-allowed")}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
