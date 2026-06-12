"use client";

import { useState } from "react";
import { MessageCircle, Send, Paperclip, ChevronLeft, UserCircle, Stethoscope, Receipt, Clock } from "lucide-react";
import { MESSAGE_THREADS, type MessageThread, type ThreadMessage } from "@/data/patient-portal";
import { cn } from "@/lib/utils";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yest = new Date(today); yest.setDate(today.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const ROLE_CFG = {
  provider: { icon: Stethoscope, cls: "bg-violet-600" },
  staff:    { icon: UserCircle,  cls: "bg-teal-600" },
  billing:  { icon: Receipt,     cls: "bg-blue-600" },
};

function NewThreadModal({ onClose, onSend }: { onClose: () => void; onSend: (subject: string, body: string) => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">New Message</p>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">To</label>
            <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option>Dr. Sarah Mitchell</option>
              <option>Care Coordinator</option>
              <option>Billing Department</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Subject</label>
            <input className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Message</label>
            <textarea rows={5} className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              value={body} onChange={e => setBody(e.target.value)} placeholder="Type your message…" />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
          <button onClick={() => { if (subject.trim() && body.trim()) { onSend(subject, body); onClose(); } }}
            disabled={!subject.trim() || !body.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold">
            <Send className="w-3.5 h-3.5" /> Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MessagesPage() {
  const [threads, setThreads] = useState(MESSAGE_THREADS);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [showNew, setShowNew] = useState(false);

  const active = threads.find(t => t.id === activeId);

  function openThread(id: string) {
    setActiveId(id);
    setThreads(prev => prev.map(t => t.id === id
      ? { ...t, unreadCount: 0, messages: t.messages.map(m => ({ ...m, read: true })) }
      : t));
  }

  function sendReply() {
    if (!reply.trim() || !activeId) return;
    const msg: ThreadMessage = {
      id: crypto.randomUUID(), fromPatient: true, senderName: "James Holloway",
      body: reply, timestamp: new Date().toISOString(), read: true,
    };
    setThreads(prev => prev.map(t => t.id === activeId
      ? { ...t, lastMessage: reply, lastMessageAt: new Date().toISOString(), messages: [...t.messages, msg] }
      : t));
    setReply("");
  }

  function newThread(subject: string, body: string) {
    const msg: ThreadMessage = { id: crypto.randomUUID(), fromPatient: true, senderName: "James Holloway", body, timestamp: new Date().toISOString(), read: true };
    const thread: MessageThread = {
      id: crypto.randomUUID(), subject, participantName: "Dr. Sarah Mitchell", participantRole: "provider",
      participantAvatar: "SM", lastMessage: body, lastMessageAt: new Date().toISOString(), unreadCount: 0, messages: [msg],
    };
    setThreads(prev => [thread, ...prev]);
    setActiveId(thread.id);
  }

  const totalUnread = threads.reduce((s, t) => s + t.unreadCount, 0);

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      {showNew && <NewThreadModal onClose={() => setShowNew(false)} onSend={newThread} />}

      <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Messages</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {totalUnread > 0 ? `${totalUnread} unread message${totalUnread > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-colors">
          <MessageCircle className="w-4 h-4" /> New Message
        </button>
      </div>

      <div className="flex flex-1 min-h-0 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/40">
        {/* Thread list */}
        <div className={cn("flex flex-col border-r border-slate-200 dark:border-slate-800 shrink-0",
          active ? "hidden md:flex w-72" : "flex w-full md:w-72")}>
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-1">Conversations</p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {threads.map(t => {
              const roleCfg = ROLE_CFG[t.participantRole];
              return (
                <button key={t.id} onClick={() => openThread(t.id)}
                  className={cn("w-full text-left px-4 py-4 border-b border-slate-100 dark:border-slate-800 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50",
                    activeId === t.id && "bg-emerald-50/60 dark:bg-emerald-950/10 border-l-2 border-l-emerald-500")}>
                  <div className="flex items-start gap-3">
                    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", roleCfg.cls)}>
                      {t.participantAvatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className={cn("text-sm truncate", t.unreadCount > 0 ? "font-bold text-slate-900 dark:text-slate-100" : "font-medium text-slate-700 dark:text-slate-300")}>
                          {t.participantName}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(t.lastMessageAt)}</span>
                      </div>
                      <p className={cn("text-xs truncate", t.unreadCount > 0 ? "font-semibold text-slate-600 dark:text-slate-400" : "text-slate-500")}>{t.subject}</p>
                      <p className="text-xs truncate text-slate-400 dark:text-slate-500 mt-0.5">{t.lastMessage}</p>
                    </div>
                    {t.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Conversation panel */}
        <div className={cn("flex flex-col flex-1 min-w-0", !active && "hidden md:flex")}>
          {active ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
                <button onClick={() => setActiveId(null)} className="md:hidden p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0", ROLE_CFG[active.participantRole].cls)}>
                  {active.participantAvatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{active.participantName}</p>
                  <p className="text-xs text-slate-500">{active.subject}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
                {(() => {
                  let lastDate = "";
                  return active.messages.map(msg => {
                    const dateStr = fmtDate(msg.timestamp);
                    const showDate = dateStr !== lastDate;
                    lastDate = dateStr;
                    return (
                      <div key={msg.id}>
                        {showDate && (
                          <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{dateStr}</span>
                            <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                          </div>
                        )}
                        <div className={cn("flex gap-3", msg.fromPatient ? "flex-row-reverse" : "flex-row")}>
                          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 mt-1",
                            msg.fromPatient ? "bg-emerald-600" : ROLE_CFG[active.participantRole].cls)}>
                            {msg.fromPatient ? "JH" : active.participantAvatar}
                          </div>
                          <div className={cn("max-w-[70%] space-y-1", msg.fromPatient && "items-end flex flex-col")}>
                            <div className={cn("px-4 py-3 rounded-2xl text-sm",
                              msg.fromPatient
                                ? "bg-emerald-600 text-white rounded-tr-sm"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-sm")}>
                              {msg.body}
                            </div>
                            <div className={cn("flex items-center gap-1.5 text-[10px] text-slate-400", msg.fromPatient && "flex-row-reverse")}>
                              <Clock className="w-3 h-3" />
                              {fmtTime(msg.timestamp)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Reply box */}
              <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <div className="flex items-end gap-3">
                  <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
                    <textarea rows={2}
                      className="w-full px-4 py-3 text-sm text-slate-900 dark:text-slate-100 resize-none bg-transparent focus:outline-none placeholder:text-slate-400"
                      placeholder="Type your reply…"
                      value={reply}
                      onChange={e => setReply(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendReply(); } }}
                    />
                    <div className="flex items-center px-3 py-2 border-t border-slate-100 dark:border-slate-800">
                      <button className="text-slate-400 hover:text-slate-600">
                        <Paperclip className="w-4 h-4" />
                      </button>
                      <p className="text-xs text-slate-400 ml-2">Press Enter to send, Shift+Enter for new line</p>
                    </div>
                  </div>
                  <button onClick={sendReply} disabled={!reply.trim()}
                    className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-colors">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <MessageCircle className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-500">Select a conversation to read</p>
                <p className="text-xs text-slate-400 mt-1">Or start a new message with your care team</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
