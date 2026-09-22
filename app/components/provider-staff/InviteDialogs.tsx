"use client";

import { useState } from "react";
import {
  AlertTriangle, Check, Clock, ExternalLink, Mail, Pencil, Send, ShieldCheck, X,
} from "lucide-react";
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
const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

const BTN = "px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50";
const BTN_PRIMARY = "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold practmd-gradient text-white disabled:opacity-40 disabled:cursor-not-allowed";

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
  const [sent, setSent] = useState<Invitation | null>(null);
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
  const emailOk = editing && changed && !emailErr;

  function send() {
    const r = sendInvite(provider.id, { resend: everSent, email: changed ? email.trim() : undefined });
    setResult(r);
    onResult(r);
    if (r.ok) setSent(r.invitation);
  }

  const verb = everSent ? "Resend" : "Send";

  if (sent) {
    return (
      <Modal open={open} onClose={onClose} title={`${verb} invitation`} hideClose
        footer={<button onClick={onClose} className={BTN_PRIMARY}>Done</button>}>
        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-navy-900 text-white shadow-lg">
          <ShieldCheck className="w-[18px] h-[18px] text-brand-300 shrink-0" />
          <p className="text-sm"><strong className="font-semibold">Invitation sent to {sent.email}</strong> · Expires {fmtDate(sent.expiresAt)}, {fmtTime(sent.expiresAt)}</p>
        </div>
      </Modal>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={`${verb} invitation?`}
      footer={<>
        <button onClick={onClose} className={BTN}>Cancel</button>
        <button onClick={send} disabled={blocked || !!emailErr || (editing && !email.trim())} className={BTN_PRIMARY}>
          <Send className="w-[15px] h-[15px]" /> {changed ? "Update email & resend" : `${verb} invite`}
        </button>
      </>}>
      <div className="space-y-3.5">
        {!editing ? (
          <>
            <p className="text-sm text-slate-500 dark:text-slate-400">We&apos;ll send a new invitation link to:</p>
            <div className="flex items-center gap-2.5 pl-3.5 pr-1.5 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="flex-1 min-w-0 font-semibold text-slate-800 dark:text-slate-200 truncate">{provider.email}</span>
              <button type="button" onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 h-9 px-2.5 rounded-lg text-xs font-semibold text-brand-700 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/30">
                <Pencil className="w-3.5 h-3.5" /> Edit email
              </button>
            </div>
            {!blocked && (
              <ul className="space-y-1.5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                <li className="flex items-start gap-2"><X className="w-3.5 h-3.5 mt-0.5 shrink-0" /> The previous link stops working immediately.</li>
                <li className="flex items-start gap-2"><Clock className="w-3.5 h-3.5 mt-0.5 shrink-0" /> The new link expires in {INVITE_TTL_DAYS} days.</li>
              </ul>
            )}
          </>
        ) : (
          <div>
            <label htmlFor="resend-email" className="block mb-1.5 text-[13px] font-semibold text-slate-700 dark:text-slate-300">Provider email</label>
            <input id="resend-email" autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Provider email"
              className={cn(INPUT, emailErr && INPUT_ERR)} />
            {emailErr ? <p role="alert" className="mt-1.5 text-xs text-rose-600">{emailErr}</p>
              : emailOk ? <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-brand-700 dark:text-brand-400"><Check className="w-3 h-3" /> Available</p> : null}
            <button type="button" onClick={() => { setEditing(false); setEmail(provider.email); }} className="mt-1.5 text-xs text-slate-500 hover:underline">Keep {provider.email}</button>
            {emailOk && (
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                This also updates the email on {provider.firstName}&apos;s record — it&apos;s the address they&apos;ll sign in with. The link sent to <strong className="font-semibold text-slate-800 dark:text-slate-200">{provider.email}</strong> stops working.
              </div>
            )}
          </div>
        )}
        {everSent && !editing && !blocked && <p className="text-xs text-slate-500 dark:text-slate-400">Resending resets the {INVITE_TTL_DAYS}-day expiry and the reminder schedule. {allow.remainingToday} of {RESEND_DAILY_LIMIT} resends left today.</p>}
        {blocked && (
          <Callout tone="warn" className="flex items-start gap-2.5 !text-[13px]">
            <Clock className="w-4 h-4 shrink-0 mt-px" />
            <span>
              <strong className="font-semibold">{allow.retryAt ? `You can resend again ${new Date(allow.retryAt).getTime() - now < 3600000 ? `in ${Math.max(1, Math.round((new Date(allow.retryAt).getTime() - now) / 60000))} minutes` : `at ${new Date(allow.retryAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`}.` : allow.reason}</strong>
              <br />One resend every {10} minutes, up to {RESEND_DAILY_LIMIT} a day. Used today: {RESEND_DAILY_LIMIT - allow.remainingToday} of {RESEND_DAILY_LIMIT}.
            </span>
          </Callout>
        )}
        {result && !result.ok && <Callout tone="error" className="flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-px" /><span>{result.message}</span></Callout>}
      </div>
    </Modal>
  );
}

/* ── The email as the provider will see it ─────────────────────────────── */

export function InviteEmailPreview({ open, onClose, provider, invitation, isResend }: {
  open: boolean; onClose: () => void; provider: ProviderRecord; invitation: Invitation | undefined; isResend?: boolean;
}) {
  const clinic = CLINICS.find((c) => c.id === provider.clinicAccess[0]);
  const admin = clinic?.admins.find((a) => a.name === invitation?.sentBy) ?? clinic?.admins[0];
  const clinicName = clinic?.name ?? "Your clinic";
  const initials = clinicName.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  if (!invitation) return null;
  return (
    <Modal open={open} onClose={onClose} width="max-w-xl" title="Invitation email" description={`Sent to ${invitation.email}`}>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 p-6 flex flex-col items-center gap-4">
        <div className="w-full grid grid-cols-[64px_1fr] gap-x-3 gap-y-1.5 text-[13px] leading-relaxed rounded-xl bg-white border border-slate-200 px-4 py-3">
          <span className="font-semibold text-slate-500">From</span><span className="text-slate-700 truncate">{clinicName} &lt;no-reply@{clinicName.toLowerCase().replace(/[^a-z0-9]+/g, "")}.com&gt;</span>
          <span className="font-semibold text-slate-500">To</span><span className="text-slate-700">{invitation.email}</span>
          <span className="font-semibold text-slate-500">Subject</span><span className="font-semibold text-slate-900">{isResend ? `Your new invitation to join ${clinicName}` : `${invitation.sentBy} invited you to join ${clinicName}`}</span>
          <span className="font-semibold text-slate-500">Preview</span><span className="text-slate-500">{isResend ? "This replaces your earlier invitation — it takes about a minute to set up." : "Set up your provider account — it takes about a minute."}</span>
        </div>

        <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden text-slate-900">
          <div className="h-1.5 bg-navy-900" />
          <div className="flex items-center gap-3 px-8 py-5 border-b border-slate-100">
            <div className="w-11 h-11 rounded-[10px] bg-navy-900 text-white flex items-center justify-center text-base font-bold shrink-0">{initials || "CN"}</div>
            <span className="text-base font-bold">{clinicName}</span>
          </div>

          {isResend && (
            <div className="mx-8 mt-5 flex items-start gap-2.5 p-3 rounded-[10px] bg-amber-50 border border-amber-200 text-[13px] leading-relaxed text-amber-900">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-px text-amber-700" />
              <span><strong className="font-semibold">This is a new invitation.</strong> The link in any earlier email from us no longer works — please use this one.</span>
            </div>
          )}

          <div className="px-8 pt-8 pb-7 flex flex-col gap-4">
            <p className="text-[13px] font-semibold text-slate-500">Provider invitation</p>
            <h1 className="text-[26px] leading-tight font-bold tracking-tight">{isResend ? `Here's your new invitation to ${clinicName}` : `You're invited to join ${clinicName}`}</h1>
            <p className="text-[15px] leading-relaxed text-slate-700">Hi {provider.firstName},</p>
            <p className="text-[15px] leading-relaxed text-slate-700"><strong className="font-semibold text-slate-900">{invitation.sentBy}</strong> has {isResend ? "sent you a fresh invitation to join" : "invited you to join"} <strong className="font-semibold text-slate-900">{clinicName}</strong> as a provider.</p>
            <p className="text-[15px] leading-relaxed text-slate-700">Setting up takes about a minute — create a password and you&apos;re in.</p>
            <div>
              <a href={inviteUrl(invitation.token)} target="_blank" rel="noreferrer"
                className="inline-flex items-center gap-2 h-12 px-7 rounded-[10px] bg-navy-900 text-white font-semibold no-underline hover:opacity-90">
                Accept invitation <ExternalLink className="w-4 h-4" />
              </a>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-700"><Clock className="w-4 h-4 text-slate-500 shrink-0" /><span>This invitation expires on <strong className="font-semibold text-slate-900">{fmtDate(invitation.expiresAt)} at {fmtTime(invitation.expiresAt)} ET</strong>.</span></div>
            <p className="text-[13px] leading-relaxed text-slate-500">Button not working? Paste this link into your browser:<br /><span className="font-mono font-medium text-navy-900 break-all">{inviteUrl(invitation.token, true)}</span></p>
          </div>
          <div className="h-px bg-slate-200 mx-8" />
          <div className="px-8 pt-5 pb-7 flex flex-col gap-3.5">
            <div>
              <p className="text-sm font-semibold">Need help?</p>
              <p className="text-sm leading-relaxed text-slate-500">Contact {admin?.name ?? invitation.sentBy} at <a href={`mailto:${admin?.email ?? clinic?.email ?? ""}`} className="font-semibold text-navy-900">{admin?.email ?? clinic?.email}</a>{admin?.phone && <> or {admin.phone}</>}.</p>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-[10px] bg-slate-50 text-[13px] leading-relaxed text-slate-500">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-px text-slate-500" />
              <span>This link is personal to you and works once. {clinicName} will never ask for your password or any patient information by email.</span>
            </div>
          </div>
        </div>
        <div className="text-center text-xs leading-relaxed text-slate-500">
          <p>{clinicName}{clinic?.locations[0] && <> · {clinic.locations[0].address}, {clinic.locations[0].city}, {clinic.locations[0].state} {clinic.locations[0].zip}</>}</p>
          <p>You received this because {clinicName} added you as a provider.</p>
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
        <Callout tone="info">Each status controls what {providerDisplayName(provider)} can do in the portal — see the status list for what changes. Any status can be set from any other; there&apos;s no transition-order check yet, so double-check before saving.</Callout>
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
          className={cn("px-4 py-2 rounded-xl text-sm font-semibold text-white", deactivating ? "bg-rose-600 hover:bg-rose-700" : "bg-emerald-600 hover:bg-emerald-700")}>
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
  correction_approved: "Correction approved", correction_denied: "Correction denied",
  terms_accepted: "Accepted Provider Terms & Conditions",
};

const INVITE_EVENTS: AuditEntry["event"][] = [
  "invite_sent", "invite_resent", "invite_failed", "invite_expired", "invite_invalidated", "invite_accepted", "email_changed",
];
const HISTORY_DOT: Partial<Record<AuditEntry["event"], string>> = {
  invite_accepted: "bg-brand-600", invite_sent: "bg-navy-700", invite_resent: "bg-navy-700",
  invite_failed: "bg-rose-600", invite_expired: "bg-amber-600", invite_invalidated: "bg-slate-500", email_changed: "bg-slate-500",
};

/** The invite-specific slice of the audit trail, as a compact Event/When/Address/By table. */
export function InviteHistoryTable({ entries }: { entries: AuditEntry[] }) {
  const rows = entries.filter((a) => INVITE_EVENTS.includes(a.event));
  if (!rows.length) return null;
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="grid grid-cols-4 gap-4 px-5 py-2.5 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400">
        <span>Event</span><span>When</span><span>Address</span><span>By</span>
      </div>
      {rows.map((a) => (
        <div key={a.id} className="grid grid-cols-4 gap-4 px-5 py-3 border-t border-slate-100 dark:border-slate-800 text-[13px] text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
            <span aria-hidden className={cn("w-2 h-2 rounded-full shrink-0", HISTORY_DOT[a.event] ?? "bg-slate-400")} />
            {EVENT_LABEL[a.event]}
          </span>
          <span suppressHydrationWarning>{fmtDateTime(a.at)}</span>
          <span className="truncate">{a.email ?? "—"}</span>
          <span>{a.actor}</span>
        </div>
      ))}
    </div>
  );
}

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
