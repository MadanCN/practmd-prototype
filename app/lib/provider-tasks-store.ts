"use client";

// The provider's personal task queue (PRD "Tasks"): tasks are assigned to
// them individually, never pulled from a shared pool. My tasks / Queues /
// Rejections. SLA is shown as time remaining, not time elapsed. Completing
// the underlying action auto-closes the task.

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";
import { PROVIDER_TASKS } from "@/data/provider-today";

export type ProviderTaskKind =
  | "sign-note" | "cosign-note" | "note-returned" | "unsigned-escalation"
  | "results-review" | "refill-request" | "coordinator-query" | "credential-expiring"
  | "follow-up-booking" | "prior-auth" | "callback" | "admin";

export const TASK_KIND_LABEL: Record<ProviderTaskKind, string> = {
  "sign-note": "Sign note",
  "cosign-note": "Co-sign note",
  "note-returned": "Note returned for revision",
  "unsigned-escalation": "Unsigned note escalation",
  "results-review": "Results to review",
  "refill-request": "Refill request",
  "coordinator-query": "Coordinator query",
  "credential-expiring": "Credential expiring",
  "follow-up-booking": "Follow-up recommendation",
  "prior-auth": "Prior authorization",
  callback: "Callback",
  admin: "Administrative",
};

export interface ProviderTaskItem {
  id: string;
  kind: ProviderTaskKind;
  title: string;
  detail: string;
  patientId?: string;
  patientName?: string;
  /** ISO deadline — SLA is rendered as remaining time against this */
  dueAt: string;
  createdAt: string;
  status: "open" | "done" | "rejected";
  /** where the task lives: personal list vs a queue it was distributed from */
  lane: "mine" | "queue";
  actionHref?: string;
  rejectionReason?: string;
  /** the object completing which auto-closes this task */
  autoCloseRef?: { type: "note"; id: string };
}

function hoursFromNow(h: number) {
  return new Date(Date.now() + h * 3600000).toISOString();
}

const KIND_MAP: Record<string, ProviderTaskKind> = {
  "chart-review": "cosign-note", "prior-auth": "prior-auth", callback: "callback",
  "lab-followup": "results-review", admin: "admin",
};

function seed(): ProviderTaskItem[] {
  const fromLegacy = PROVIDER_TASKS.filter((t) => t.status === "open").map((t, i) => ({
    id: t.id,
    kind: KIND_MAP[t.type] ?? "admin",
    title: t.title,
    detail: t.description,
    patientId: t.patientId,
    patientName: t.patientName,
    dueAt: t.overdue ? hoursFromNow(-18) : t.dueLabel.includes("today") ? hoursFromNow(6) : hoursFromNow(24 + i * 12),
    createdAt: t.createdAt,
    status: "open" as const,
    lane: "mine" as const,
  }));
  return [
    ...fromLegacy,
    {
      id: "tk_esc1", kind: "unsigned-escalation", title: "Unsigned note escalation — Carmen Rivera",
      detail: "Discharge summary is 6 days past the signature SLA. $240 unbilled. Escalated to the clinic admin.",
      patientId: "pt14", patientName: "Carmen Rivera",
      dueAt: hoursFromNow(-4), createdAt: hoursFromNow(-30), status: "open", lane: "mine",
      actionHref: "/provider/encounter-notes",
    },
    {
      id: "tk_cred1", kind: "credential-expiring", title: "DEA registration expires in 52 days",
      detail: "Informational — the action sits with Credentialing. Renew before expiry to avoid an auto-suspend.",
      dueAt: hoursFromNow(52 * 24), createdAt: hoursFromNow(-48), status: "open", lane: "mine",
    },
    {
      id: "tk_q1", kind: "coordinator-query", title: "Coordinator question — Marcus Webb",
      detail: "Jordan Lee: “Patient is asking whether the Vyvanse dose change is still planned for next visit — can you confirm?”",
      patientId: "pt03", patientName: "Marcus Webb",
      dueAt: hoursFromNow(20), createdAt: hoursFromNow(-3), status: "open", lane: "queue",
      actionHref: "/provider/messages/internal",
    },
    {
      id: "tk_rej1", kind: "prior-auth", title: "Prior auth documentation — returned",
      detail: "Sent back by Revenue Cycle: the clinical rationale needs a specific failed-therapy history. Please revise and resubmit.",
      patientId: "pt03", patientName: "Marcus Webb",
      dueAt: hoursFromNow(12), createdAt: hoursFromNow(-26), status: "rejected", lane: "mine",
      rejectionReason: "Missing failed-therapy history",
    },
  ];
}

interface TasksState {
  tasks: ProviderTaskItem[];
}

const store = createPersistedStore<TasksState>({
  key: "provider-tasks",
  initial: { tasks: seed() },
  revive: (raw, initial) => {
    const saved = (raw as TasksState)?.tasks;
    return saved && saved.length ? { tasks: saved } : initial;
  },
});

export function useProviderTasks() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function getTasks(): ProviderTaskItem[] {
  return store.get().tasks;
}

export function openTaskCount(): number {
  return store.get().tasks.filter((t) => t.status === "open").length;
}

export function completeTask(id: string) {
  store.set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "done" } : t)) }));
}

export function reopenTask(id: string) {
  store.set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, status: "open" } : t)) }));
}

/** Called when a note is signed — auto-closes any sign/escalation task for it. */
export function closeTasksForNote(noteId: string) {
  store.set((s) => ({
    tasks: s.tasks.map((t) => (t.autoCloseRef?.type === "note" && t.autoCloseRef.id === noteId && t.status === "open" ? { ...t, status: "done" } : t)),
  }));
}

export function addFollowUpTask(input: { patientId: string; patientName: string; recommendation: string; interval: string }) {
  const task: ProviderTaskItem = {
    id: `tk_${Math.random().toString(36).slice(2, 9)}`,
    kind: "follow-up-booking",
    title: `Book follow-up — ${input.patientName}`,
    detail: `${input.recommendation} · suggested interval: ${input.interval}. Raised to the coordinator for scheduling.`,
    patientId: input.patientId,
    patientName: input.patientName,
    dueAt: hoursFromNow(48),
    createdAt: new Date().toISOString(),
    status: "open",
    lane: "queue",
  };
  store.set((s) => ({ tasks: [task, ...s.tasks] }));
  return task;
}

/** Generic task the provider raises for someone else (e.g. a credentialing
 *  change request from Settings / Profile). */
export function addRequestTask(input: { kind: ProviderTaskKind; title: string; detail: string; lane?: "mine" | "queue" }) {
  const task: ProviderTaskItem = {
    id: `tk_${Math.random().toString(36).slice(2, 9)}`,
    kind: input.kind,
    title: input.title,
    detail: input.detail,
    dueAt: hoursFromNow(72),
    createdAt: new Date().toISOString(),
    status: "open",
    lane: input.lane ?? "queue",
  };
  store.set((s) => ({ tasks: [task, ...s.tasks] }));
  return task;
}

/** "3h left" / "overdue by 2h" — time remaining, never elapsed. */
export function slaRemaining(dueAt: string): { label: string; overdue: boolean } {
  const diffMs = new Date(dueAt).getTime() - Date.now();
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);
  const h = Math.round(abs / 3600000);
  const label = h < 1 ? "<1h" : h < 48 ? `${h}h` : `${Math.round(h / 24)}d`;
  return { label: overdue ? `overdue by ${label}` : `${label} left`, overdue };
}
