"use client";

import { useMemo, useState } from "react";
import { MessageSquare, ChevronDown, ChevronRight, Building2, UserRound, AlertTriangle } from "lucide-react";
import { PROVIDER_MESSAGE_THREADS } from "@/data/provider-today";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";
import { timeAgo } from "./shared";

export function MessagesSection({ patient }: { patient: PatientProfile }) {
  const threads = useMemo(
    () => PROVIDER_MESSAGE_THREADS
      .filter((t) => t.patientId === patient.id)
      .map((t) => ({ ...t, last: t.messages[t.messages.length - 1] }))
      .sort((a, b) => (b.last?.timestamp ?? "").localeCompare(a.last?.timestamp ?? "")),
    [patient.id],
  );

  const [open, setOpen] = useState<string | null>(threads[0]?.id ?? null);

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-14 text-center">
        <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
        <p className="text-sm text-slate-400">No message threads involve {patient.firstName} yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {threads.map((t) => {
        const expanded = open === t.id;
        const ChannelIcon = t.channel === "internal" ? Building2 : UserRound;
        return (
          <div key={t.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              onClick={() => setOpen(expanded ? null : t.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                <ChannelIcon className="w-4 h-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{t.subject}</p>
                  {t.urgent && <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />}
                  {t.unread && <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {t.participantName} · {t.channel === "internal" ? "Internal" : "Patient"} · {t.messages.length} message{t.messages.length !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="text-[10px] text-slate-400 shrink-0">{t.last ? timeAgo(t.last.timestamp) : ""}</span>
              {expanded ? <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0" />}
            </button>

            {expanded && (
              <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-4 space-y-3 bg-slate-50/60 dark:bg-slate-800/20">
                {t.messages.map((m) => (
                  <div key={m.id} className={cn("flex flex-col max-w-[85%]", m.fromMe ? "ml-auto items-end" : "items-start")}>
                    <div className={cn(
                      "px-3.5 py-2 rounded-2xl text-sm",
                      m.fromMe
                        ? "bg-brand-600 text-white rounded-br-sm"
                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-sm",
                    )}>
                      {m.body}
                    </div>
                    <span className="mt-1 text-[10px] text-slate-400">{m.senderName} · {timeAgo(m.timestamp)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
