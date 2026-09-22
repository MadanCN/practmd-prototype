"use client";

import { useState } from "react";
import { AlertTriangle, ExternalLink, Mail, Pencil, ShieldCheck } from "lucide-react";
import { CLINICS } from "@/data/clinics";
import { CLINICAL_STATUS_ORDER, STATUS_META, type ClinicalStatus } from "@/data/provider-credentialing";
import { CURRENT_ADMIN, providerDisplayName, type ProviderRecord } from "@/data/provider-record";
import {
  INVITE_TTL_DAYS, RESEND_DAILY_LIMIT, changeStatus, emailConflictMessage, findEmailConflict, inviteUrl,
  resendAllowance, sendInvite, setProviderActive, type AuditEntry, type Invitation, type InviteResult, useProviderStore,
} from "@/lib/provider-store";
import { isValidEmail } from "@/lib/provider-validation";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { Callout, INPUT, INPUT_ERR } from "./form/fields";

export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
export const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const BTN = "px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50";
const BTN_PRIMARY = "px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed";

/* ── Resend / send invitation ─────────────────────────────────────────── */

interface ResendProps {
  open: boolean;
  onClose: () => void;
  provider: ProviderRecord;
  /** false → this is the first send (Add was saved without an invite), so no rate limit / "resend" wording */
  everSent: boolean;
  onResult: (r: InviteResult) => void;
}

/** Mounts the stateful body only while open, so every opening starts fresh. */
export function ResendInviteDialog(props: ResendProps) {
  return props.open ? <ResendInviteBody {...props} /> : null;
}

function ResendInviteBody({ open, onClose, provider, everSent, onResult }: ResendProps) {
  const store = useProviderStore();
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(provider.email);
  const [result, setResult] = useState<InviteResult | null>(null);
  const [now] = useState(() => Date.now());

  const allow = resendAllowance(store, provider.id, now);
  const blocked = everSent && !allow.allowed;
  const changed = editing && email.trim().toLowerCase() !== provider.email.toLowerCase();
  const emailErr = editing
    ? !email.trim() ? "Enter an email address"
      : !isValidEmail(email) ? "Enter a valid email address"
      : changed ? (() => { const c = findEmailConflict(store, email, provider.id); return c ? emailConflictMessage(c) : ""; })()
      : ""
    : "";

  function send() {
    const r = sendInvite(provider.id, { resend: everSent, email: changed ? email.trim() : undefined });
    setResult(r);
    if (r.ok) { onResult(r); onClose(); }
    else if (r.reason !== "delivery_failed") return;
    else onResult(r);
  }

  const verb = everSent ? "Resend" : "Send";
  return (
    <Modal open={open} onClose={onClose} title={`${verb} invitation`}
      description={everSent ? "This replaces the previous link — only one link is live at a time." : `Sends ${provider.firstName} a single-use link, valid for ${INVITE_TTL_DAYS} days.`}
      footer={<>
        <button onClick={onClose} className={BTN}>Cancel</button>
        <button onClick={send} disabled={blocked || !!emailErr || (editing && !email.trim())} className={BTN_PRIMARY}>
          {changed ? "Update email & send" : `${verb} invitation`}
        </button>
      </>}>
      <div className="space-y-3">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">It will be sent to</p>
          {!editing ? (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{provider.email}</span>
              <button type="button" onClick={() => setEditing(true)} className="ml-auto inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline shrink-0">
                <Pencil className="w-3 h-3" /> Edit email
              </button>
            </div>
          ) : (
            <div>
              <input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Provider email"
                className={cn(INPUT, emailErr && INPUT_ERR)} />
              {emailErr ? <p role="alert" className="mt-1 text-xs text-rose-600">{emailErr}</p>
                : changed ? <p className="mt-1 text-xs text-slate-500">This also updates the email on {provider.firstName}&apos;s record — it becomes their login.</p> : null}
              <button type="button" onClick={() => { setEditing(false); setEmail(provider.email); }} className="mt-1 text-xs text-slate-500 hover:underline">Keep {provider.email}</button>
            </div>
          )}
        </div>
        {everSent && <p className="text-xs text-slate-500 dark:text-slate-400">Resending resets the {INVITE_TTL_DAYS}-day expiry and the reminder schedule. {allow.allowed && `${allow.remainingToday} of ${RESEND_DAILY_LIMIT} resends left today.`}</p>}
        {blocked && <Callout tone="warn">{allow.reason}{allow.retryAt && <> Try again at {new Date(allow.retryAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.</>}</Callout>}
        {result && !result.ok && <Callout tone="error" className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-px" /><span>{result.message}</span></Callout>}
      </div>
    </Modal>
  );
}

/* ── The email as the provider will see it ─────────────────────────────── */

export function InviteEmailPreview({ open, onClose, provider, invitation }: {
  open: boolean; onClose: () => void; provider: ProviderRecord; invitation: Invitation | undefined;
}) {
  const clinic = CLINICS.find((c) => c.id === provider.clinicAccess[0]);
  if (!invitation) return null;
  return (
    <Modal open={open} onClose={onClose} width="max-w-xl" title="Invitation email" description={`Sent to ${invitation.email}`}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white text-slate-800">
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <span className="text-3xl">{clinic?.logoEmoji ?? "🏥"}</span>
          <span className="text-lg font-semibold">{clinic?.name ?? "Your clinic"}</span>
        </div>
        <div className="px-6 py-6 space-y-4 text-sm leading-relaxed">
          <p>Hi {provider.firstName},</p>
          <p><strong>{invitation.sentBy}</strong> has invited you to join <strong>{clinic?.name ?? "the clinic"}</strong> as a provider.</p>
          <p>It takes about a minute to set up — you&apos;ll create a password and you&apos;re in.</p>
          <div className="py-1">
            <a href={inviteUrl(invitation.token)} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1a5c9e] text-white font-semibold no-underline hover:opacity-90">
              Accept invitation <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-slate-600">This link can be used once and expires on <strong>{fmtDate(invitation.expiresAt)}</strong>. If it has expired, ask your clinic administrator to send a new one.</p>
          <p className="text-slate-600">Questions? Contact {clinic?.name ?? "your clinic"} at <span className="underline">{clinic?.email ?? "your clinic administrator"}</span>{clinic?.phone ? ` or ${clinic.phone}` : ""}.</p>
        </div>
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-[11px] text-slate-500 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> This email never contains a password, patient information or credential details.
        </div>
      </div>
      <p className="mt-3 text-xs text-slate-500">Prototype: the &ldquo;Accept invitation&rdquo; button opens the real invitation screen in a new tab.</p>
    </Modal>
  );
}

/* ── Change status / Deactivate ────────────────────────────────────────── */

interface StatusProps { open: boolean; onClose: () => void; provider: ProviderRecord; onDone: () => void }

export function ChangeStatusDialog(props: StatusProps) {
  return props.open ? <ChangeStatusBody {...props} /> : null;
}

function ChangeStatusBody({ open, onClose, provider, onDone }: StatusProps) {
  const [status, setStatus] = useState<ClinicalStatus>(provider.status);
  const [note, setNote] = useState("");
  return (
    <Modal open={open} onClose={onClose} title="Change status" description={`${providerDisplayName(provider)} is currently ${STATUS_META[provider.status].label}.`}
      footer={<>
        <button onClick={onClose} className={BTN}>Cancel</button>
        <button disabled={status === provider.status} onClick={() => { changeStatus(provider.id, status, note.trim() || undefined); onDone(); onClose(); }} className={BTN_PRIMARY}>Change status</button>
      </>}>
      <div className="space-y-3">
        <select value={status} onChange={(e) => setStatus(e.target.value as ClinicalStatus)} className={INPUT} aria-label="New status">
          {CLINICAL_STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="Reason (optional — recorded in the audit log)" className={cn(INPUT, "resize-none")} />
        <Callout tone="info">Status-based permissions and transition rules arrive with the status-lifecycle work — for now any status can be set and it is logged.</Callout>
      </div>
    </Modal>
  );
}

export function ActiveToggleDialog({ open, onClose, provider, onDone }: { open: boolean; onClose: () => void; provider: ProviderRecord; onDone: () => void }) {
  const deactivating = provider.isActive;
  return (
    <Modal open={open} onClose={onClose} title={deactivating ? `Deactivate ${provider.firstName}?` : `Reactivate ${provider.firstName}?`}
      footer={<>
        <button onClick={onClose} className={BTN}>Cancel</button>
        <button onClick={() => { setProviderActive(provider.id, !provider.isActive); onDone(); onClose(); }}
          className={cn("px-4 py-2 rounded-lg text-sm font-semibold text-white", deactivating ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700")}>
          {deactivating ? "Deactivate" : "Reactivate"}
        </button>
      </>}>
      {deactivating
        ? <p>{provider.firstName} won&apos;t be able to sign in and will be hidden from active lists and scheduling. If they haven&apos;t accepted their invitation yet, the link keeps working so they can set a password — but they&apos;ll see &ldquo;Your account is not active&rdquo; when they try to sign in.</p>
        : <p>{provider.firstName} will be able to sign in again and will appear in active lists.</p>}
      <p className="mt-2 text-xs text-slate-500">Recorded as {CURRENT_ADMIN.name} · {CURRENT_ADMIN.role}.</p>
    </Modal>
  );
}

/* ── Audit trail ───────────────────────────────────────────────────────── */

const EVENT_LABEL: Record<AuditEntry["event"], string> = {
  provider_created: "Provider added", provider_updated: "Record updated", status_changed: "Status changed",
  deactivated: "Deactivated", reactivated: "Reactivated", invite_sent: "Invitation sent", invite_resent: "Invitation resent",
  invite_failed: "Invitation delivery failed", invite_expired: "Invitation expired", invite_invalidated: "Invitation link invalidated",
  invite_accepted: "Invitation accepted", email_changed: "Email changed", email_reverification_sent: "Email re-verification sent",
  verification_bypassed: "Verification bypassed", correction_submitted: "Provider corrected a pre-filled field",
};

export function AuditList({ entries }: { entries: AuditEntry[] }) {
  if (!entries.length) return <p className="text-sm text-slate-400">Nothing logged yet.</p>;
  return (
    <ol className="space-y-3">
      {entries.map((a) => (
        <li key={a.id} className="flex gap-3 text-sm">
          <span className={cn("mt-1.5 w-2 h-2 rounded-full shrink-0",
            a.event === "invite_failed" ? "bg-rose-500" : a.event === "invite_expired" || a.event === "invite_invalidated" ? "bg-amber-500" : a.event === "invite_accepted" ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600")} />
          <div className="min-w-0">
            <p className="text-slate-800 dark:text-slate-200"><span className="font-medium">{EVENT_LABEL[a.event]}</span>{a.email && <span className="text-slate-500"> · {a.email}</span>}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400"><span suppressHydrationWarning>{fmtDateTime(a.at)}</span> · {a.actor}{a.note && <> · {a.note}</>}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

