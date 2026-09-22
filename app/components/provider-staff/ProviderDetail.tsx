"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle, ArrowLeft, CheckCircle2, Circle, Clock, Copy, Eye, Lock, Mail, MailWarning, Pencil, Phone, Power, RefreshCw, Send, UserCog,
} from "lucide-react";
import { CLINICS } from "@/data/clinics";
import { STATUS_META } from "@/data/provider-credentialing";
import {
  ACCESS_CAPABILITY_META, CAPABILITY_ORDER, CONSULT_MODES, providerDisplayName, providerInitials, qualifierLabel,
  TELEHEALTH_LICENSES_PURCHASED, NPI_QUALIFIER, type ProviderRecord,
} from "@/data/provider-record";
import { PROVIDER_COLORS } from "@/data/providers";
import {
  auditFor, correctionsFor, inviteStateOf, inviteUrl, invitationsFor, isInviteAccepted, pendingCorrectionsFor, selectRecord,
  sweepExpiries, telehealthLicensesUsed, useProviderStore, REMINDER_DAYS,
} from "@/lib/provider-store";
import { expiryState, formatEin, formatFax } from "@/lib/provider-validation";
import { WorkingHoursReadOnly } from "@/components/ui/WorkingHoursEditor";
import { cn } from "@/lib/utils";
import { Callout } from "./form/fields";
import { StatusBadge } from "./StatusBadge";
import { CorrectionsPanel, ResolvedCorrectionsList } from "./CorrectionsPanel";
import {
  ActiveToggleDialog, AuditList, ChangeStatusDialog, InviteEmailPreview, InviteHistoryTable, ResendInviteDialog, fmtDate, fmtDateTime,
} from "./InviteDialogs";

const TABS = [
  { id: "identity", label: "Identity & Credentials" },
  { id: "access", label: "Access & Services" },
  { id: "schedule", label: "Schedule" },
  { id: "profile", label: "Profile & Bio" },
] as const;
type TabId = (typeof TABS)[number]["id"];

interface Flash { created?: boolean; saved?: boolean; reverify?: boolean; invited?: boolean }

function Field({ label, value, mono, className }: { label: string; value?: string | null; mono?: boolean; className?: string }) {
  return (
    <div className={className}>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{label}</p>
      <p className={cn("text-sm font-medium text-slate-800 dark:text-slate-200 break-words", mono && "font-mono")}>{value || <span className="text-slate-400 italic font-normal">Not specified</span>}</p>
    </div>
  );
}

function Chip({ label, tone = "default" }: { label: string; tone?: "blue" | "emerald" | "violet" | "default" }) {
  const cls = {
    blue: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900",
    emerald: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900",
    violet: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 border-violet-100 dark:border-violet-900",
    default: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
  }[tone];
  return <span className={cn("px-2.5 py-1 rounded-lg border text-xs font-medium", cls)}>{label}</span>;
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-4">{children}</h2>;
}

export default function ProviderDetailScreen({ id, flash = {} }: { id: string; flash?: Flash }) {
  const store = useProviderStore();
  const provider = selectRecord(store, id);
  const [tab, setTab] = useState<TabId>("identity");
  const [resendOpen, setResendOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [activeOpen, setActiveOpen] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error" | "info"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { sweepExpiries(); }, []);

  // One-off banner after landing here from Add / Edit (an action's own note replaces it)
  const flashNote = ((): { tone: "ok" | "error" | "info"; text: string } | null => {
    if (!provider) return null;
    if (flash.created) {
      const inv = invitationsFor(store, provider.id)[0];
      const s = inv ? inviteStateOf(inv) : null;
      if (s === "failed") return { tone: "error", text: `${providerDisplayName(provider)} was added, but the invitation to ${inv?.email} couldn't be delivered. Fix the address and resend.` };
      if (inv && s === "live") return { tone: "ok", text: `${providerDisplayName(provider)} was added and an invitation was sent to ${inv.email}. The link expires on ${fmtDate(inv.expiresAt)}.` };
      if (provider.verificationBypass) return { tone: "info", text: `${providerDisplayName(provider)} was added as Clinically Active with no login yet — they can't open encounters or sign notes until invited.` };
      return { tone: "info", text: `${providerDisplayName(provider)} was added. No invitation has been sent yet.` };
    }
    if (flash.saved) return { tone: "ok", text: flash.reverify ? "Changes saved. A verification email was sent to the new address — it must be re-verified before it works as a login." : flash.invited ? "Changes saved and a new invitation was sent." : "Changes saved." };
    return null;
  })();
  const shownNote = note ?? flashNote;

  if (!provider) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 dark:text-slate-400 mb-3">Provider not found</p>
        <Link href="/provider-staff" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to Providers</Link>
      </div>
    );
  }

  const p: ProviderRecord = provider;
  const invs = invitationsFor(store, p.id);
  const latest = invs[0];
  const accepted = isInviteAccepted(store, p);
  const st = latest ? inviteStateOf(latest) : null;
  const clinics = p.clinicAccess.map((cid) => CLINICS.find((c) => c.id === cid)).filter((c): c is NonNullable<typeof c> => !!c);
  const color = PROVIDER_COLORS.find((c) => c.value === p.color);
  const locations = CLINICS.flatMap((c) => c.locations);
  const profileOn = p.capabilities.include_for_self_scheduling;
  const used = telehealthLicensesUsed(store);
  const corrections = correctionsFor(store, p.id);
  const pendingCorrections = pendingCorrectionsFor(store, p.id);

  async function copyLink() {
    if (!latest) return;
    try { await navigator.clipboard.writeText(inviteUrl(latest.token, true)); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { /* clipboard blocked */ }
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
        <Link href="/" className="hover:text-slate-600">Home</Link><span>/</span>
        <Link href="/provider-staff" className="hover:text-slate-600">Provider &amp; Staff</Link><span>/</span>
        <span className="text-slate-500">{providerDisplayName(p)}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-4 min-w-0">
          {p.photo
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={p.photo} alt="" className="w-16 h-16 rounded-2xl object-cover shrink-0" />
            : <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white shrink-0" style={{ backgroundColor: p.color || "#94a3b8" }}>{providerInitials(p)}</div>}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{providerDisplayName(p)}</h1>
              <StatusBadge status={p.status} />
              {!p.isActive && <StatusBadge status={p.status} deactivated />}
              {!p.emailVerified && <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">Email unverified</span>}
            </div>
            <div className="flex items-center gap-x-4 gap-y-1 mt-1 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
              <span>{p.providerType || "No provider type"}</span>
              {color && <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: color.value }} />{color.label}</span>}
              <span className="inline-flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" />{p.email}</span>
              {p.phone && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" />{p.phone}</span>}
            </div>
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {clinics.map((c) => <span key={c.id} className="px-2 py-0.5 rounded-md text-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-900">{c.logoEmoji} {c.name}</span>)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href={`/provider-staff/${p.id}/edit`} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl practmd-gradient text-white text-sm font-semibold"><Pencil className="w-4 h-4" /> Edit</Link>
          {!accepted && (
            <button onClick={() => setResendOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
              <Send className="w-4 h-4" /> {latest ? "Resend invite" : "Send invite"}
            </button>
          )}
          <button onClick={() => setStatusOpen(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"><UserCog className="w-4 h-4" /> Change status</button>
          <button onClick={() => setActiveOpen(true)}
            className={cn("flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-sm font-medium", p.isActive ? "border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30" : "border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30")}>
            <Power className="w-4 h-4" /> {p.isActive ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </div>

      {shownNote && <Callout tone={shownNote.tone} className="mb-4 flex items-start gap-2">{shownNote.tone === "ok" ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-px" /> : shownNote.tone === "error" ? <MailWarning className="w-4 h-4 shrink-0 mt-px" /> : <Clock className="w-4 h-4 shrink-0 mt-px" />}<span>{shownNote.text}</span></Callout>}

      <CorrectionsPanel providerName={providerDisplayName(p)} editHref={`/provider-staff/${p.id}/edit`} corrections={pendingCorrections} />

      {/* Invitation status */}
      {!accepted && (
        <div className={cn("mb-5 rounded-2xl border p-4 flex items-center gap-3.5 flex-wrap",
          st === "live" ? "border-navy-200 dark:border-navy-800 bg-white dark:bg-slate-900"
            : st === "failed" ? "border-rose-200 dark:border-rose-900 bg-rose-50/60 dark:bg-rose-950/20"
            : st === "invalidated" ? "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40"
            : "border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-950/20")}>
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center shrink-0",
            st === "live" ? "bg-navy-50 dark:bg-navy-950 text-navy-700 dark:text-navy-300"
              : st === "failed" ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400"
              : st === "invalidated" ? "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300"
              : "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400")}>
            {st === "failed" ? <MailWarning className="w-[18px] h-[18px]" /> : st === "invalidated" ? <Pencil className="w-[18px] h-[18px]" /> : st === "live" ? <Mail className="w-[18px] h-[18px]" /> : <Clock className="w-[18px] h-[18px]" />}
          </div>
          <div className="flex-1 min-w-[260px] text-sm">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              {!latest ? "No invitation has been sent"
                : st === "live" ? "Invitation sent · Delivered"
                : st === "expired" ? `Invitation expired on ${fmtDate(latest.expiresAt)}`
                : st === "failed" ? "Email bounced — check the address"
                : "Email changed — invitation not sent"}
            </p>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 mt-0.5">
              {!latest && `${p.firstName} can't sign in until they're invited.${p.verificationBypass ? " They are bookable, but can't open encounters or sign notes." : ""}`}
              {latest && st === "live" && <>Sent <span suppressHydrationWarning>{fmtDateTime(latest.sentAt)}</span> by {latest.sentBy} · Expires {fmtDate(latest.expiresAt)} · reminders on day {REMINDER_DAYS.join(" and ")}.</>}
              {latest && st === "expired" && <>{p.firstName} didn&apos;t set up their account in time.</>}
              {latest && st === "failed" && <>{latest.email} couldn&apos;t receive the message.</>}
              {latest && st === "invalidated" && <>The link sent to {latest.email} no longer works.</>}
              {!p.isActive && <> {p.firstName} is deactivated: they can still set a password from the link, but will see &ldquo;Your account is not active&rdquo; when signing in.</>}
            </p>
            {latest && st === "live" && (
              <div className="flex items-center gap-4 mt-2 text-xs">
                <button onClick={() => setEmailOpen(true)} className="inline-flex items-center gap-1 font-medium text-brand-700 dark:text-brand-400 hover:underline"><Eye className="w-3.5 h-3.5" /> View email</button>
                <button onClick={copyLink} className="inline-flex items-center gap-1 font-medium text-brand-700 dark:text-brand-400 hover:underline"><Copy className="w-3.5 h-3.5" /> {copied ? "Copied" : "Copy invite link"}</button>
                <a href={inviteUrl(latest.token)} target="_blank" rel="noreferrer" className="font-medium text-brand-700 dark:text-brand-400 hover:underline">Open invite link</a>
              </div>
            )}
            {latest && st !== "live" && (
              <div className="flex items-center gap-4 mt-2 text-xs">
                {latest.delivery === "delivered" && <button onClick={() => setEmailOpen(true)} className="inline-flex items-center gap-1 font-medium text-brand-700 dark:text-brand-400 hover:underline"><Eye className="w-3.5 h-3.5" /> View last email</button>}
                <a href={inviteUrl(latest.token)} target="_blank" rel="noreferrer" className="font-medium text-brand-700 dark:text-brand-400 hover:underline">Open old link (see what the provider sees)</a>
              </div>
            )}
          </div>
          <button onClick={() => setResendOpen(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold practmd-gradient text-white">
            {latest ? (st === "failed" ? <Pencil className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />) : <Send className="w-4 h-4" />}
            {latest ? (st === "failed" ? "Edit email & resend" : "Resend invite") : "Send invite"}
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex overflow-x-auto" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={cn("px-5 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              tab === t.id ? "border-blue-600 text-blue-600 dark:text-blue-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="pt-6 space-y-8">
        {tab === "identity" && (
          <>
            <div>
              <H2>Identity</H2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
                <Field label="First name" value={p.firstName} />
                <Field label="Middle name" value={p.middleName} />
                <Field label="Last name" value={p.lastName} />
                <Field label="Credentials suffix" value={p.credentialsSuffix} />
                <Field label="Email" value={p.email} />
                <Field label="Phone number" value={p.phone} />
                <Field label="EIN" value={p.ein ? formatEin(p.ein) : ""} mono />
                <Field label="Fax" value={p.fax ? formatFax(p.fax) : ""} />
                <Field label="Taxonomy code" value={p.taxonomyCode} mono />
                <Field label="Date of birth" value={p.dob} />
                <Field label="Status" value={STATUS_META[p.status].label} />
              </div>
            </div>
            <div>
              <H2>Address</H2>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-4">
                <Field label="Address line 1" value={p.addressLine1} className="lg:col-span-2" />
                <Field label="Address line 2" value={p.addressLine2} />
                <Field label="City" value={p.city} />
                <Field label="State" value={p.state} />
                <Field label="Zip code" value={p.zip} mono />
                <Field label="Country" value={p.country} />
              </div>
            </div>
            <div>
              <H2>Credentials</H2>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-sm min-w-[520px]">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <th className="px-4 py-2.5">ID qualifier</th><th className="px-4 py-2.5">Value</th><th className="px-4 py-2.5">Expiry</th><th className="px-4 py-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {p.credentials.map((c) => {
                      const s = expiryState(c.expiry);
                      return (
                        <tr key={c.id}>
                          <td className="px-4 py-2.5 font-medium text-slate-800 dark:text-slate-200">{c.qualifier === NPI_QUALIFIER ? "NPI" : qualifierLabel(c.qualifier)}</td>
                          <td className="px-4 py-2.5 font-mono text-xs text-slate-600 dark:text-slate-400">{c.value || <span className="text-slate-400 italic font-sans">Not yet provided</span>}</td>
                          <td className="px-4 py-2.5 text-slate-500">{c.expiry || "—"}</td>
                          <td className="px-4 py-2.5">
                            {s === "expired" && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400">Expired</span>}
                            {s === "expiring" && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400">Expiring</span>}
                            {s === "valid" && <span className="text-xs text-slate-400">Valid</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === "access" && (
          <>
            <div>
              <H2>Clinic access</H2>
              <div className="grid md:grid-cols-2 gap-2">
                {clinics.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-xl">{c.logoEmoji}</span>
                    <div>
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</p>
                      <p className="text-xs text-slate-500">{c.locations.map((l) => l.name).join(" · ")}</p>
                    </div>
                  </div>
                ))}
                {!clinics.length && <p className="text-sm text-slate-400">No clinic access.</p>}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-6">
              <Field label="Provider type" value={p.providerType} />
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Provider color</p>
                {color ? <p className="text-sm font-medium inline-flex items-center gap-2 text-slate-800 dark:text-slate-200"><span className="w-4 h-4 rounded-full" style={{ backgroundColor: color.value }} />{color.label}</p> : <p className="text-sm text-slate-400 italic">Not specified</p>}
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Visit types</p>
                <div className="flex flex-wrap gap-2">{p.visitTypes.length ? p.visitTypes.map((x) => <Chip key={x} label={x} tone="emerald" />) : <span className="text-sm text-slate-400 italic">None</span>}</div>
              </div>
              <div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1.5">Specializations</p>
                <div className="flex flex-wrap gap-2">{p.specializations.length ? p.specializations.map((x) => <Chip key={x} label={x} tone="violet" />) : <span className="text-sm text-slate-400 italic">None</span>}</div>
              </div>
            </div>
            <div>
              <H2>Capabilities</H2>
              <ul className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {CAPABILITY_ORDER.map((k) => {
                  const meta = ACCESS_CAPABILITY_META[k];
                  const on = p.capabilities[k];
                  return (
                    <li key={k} className="px-4 py-3 flex items-start gap-3">
                      {on ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /> : <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span className={cn(!on && "text-slate-500")}>{meta.label}</span>
                          {meta.soon && <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold uppercase tracking-wide text-slate-500">Coming soon</span>}
                          {k === "telehealth_license" && <span className="text-xs font-normal text-slate-500">{used} of {TELEHEALTH_LICENSES_PURCHASED} licences used</span>}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{meta.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}

        {tab === "schedule" && (
          <>
            <div>
              <H2>Available for</H2>
              <div className="flex flex-wrap gap-2">
                {CONSULT_MODES.filter((m) => p.availableFor.includes(m.key)).map((m) => <Chip key={m.key} label={m.label} tone="blue" />)}
                {!p.availableFor.length && <span className="text-sm text-slate-400 italic">Nothing selected</span>}
              </div>
              {p.availableFor.includes("video") && !p.capabilities.telehealth_license && (
                <Callout tone="warn" className="mt-3 flex items-start gap-2"><AlertTriangle className="w-4 h-4 shrink-0 mt-px" />Video Consultation is selected but there is no Telehealth License — this provider can&apos;t access PractMD Telehealth.</Callout>
              )}
            </div>
            <div>
              <div className="flex items-center justify-between mb-4">
                <H2>Working hours</H2>
                <Link href={`/provider-staff/${p.id}/edit#schedule`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 -mt-4"><Pencil className="w-3.5 h-3.5" /> Edit schedule</Link>
              </div>
              {p.pendingWorkingHours && (
                <Callout tone="info" className="mb-4 flex items-start gap-2"><Lock className="w-4 h-4 shrink-0 mt-px" /><span>A change is scheduled from <strong>{p.pendingWorkingHours.effectiveFrom}</strong> (set by {p.pendingWorkingHours.scheduledBy}). No further changes until it takes effect.</span></Callout>
              )}
              <div className={cn("grid gap-6", p.pendingWorkingHours && "md:grid-cols-2")}>
                <div className="max-w-xl"><WorkingHoursReadOnly hours={p.workingHours} locations={locations} /></div>
                {p.pendingWorkingHours && (
                  <div className="max-w-xl rounded-xl border border-blue-200 dark:border-blue-900 p-4 bg-blue-50/30 dark:bg-blue-950/10">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-2">From {p.pendingWorkingHours.effectiveFrom}</p>
                    <WorkingHoursReadOnly hours={p.pendingWorkingHours.hours} locations={locations} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {tab === "profile" && (
          profileOn ? (
            <div className="space-y-6 max-w-3xl">
              <div><H2>About provider</H2><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{p.aboutProvider || <span className="text-slate-400 italic">Not provided</span>}</p></div>
              <div>
                <H2>Education</H2>
                {p.education.length ? (
                  <ul className="space-y-1.5 text-sm text-slate-700 dark:text-slate-300">
                    {p.education.map((e) => <li key={e.id}><span className="font-medium">{e.degree}</span>{e.institution && ` — ${e.institution}`}{e.year && ` (${e.year})`}</li>)}
                  </ul>
                ) : <p className="text-sm text-slate-400 italic">None added</p>}
              </div>
              <div className="grid grid-cols-2 gap-8"><Field label="Years of experience" value={p.yearsExperience} /></div>
              <div><H2>Experience summary</H2><p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{p.experienceSummary || <span className="text-slate-400 italic">Not provided</span>}</p></div>
              <div><H2>Services provided</H2><div className="flex flex-wrap gap-2">{p.servicesProvided.length ? p.servicesProvided.map((s) => <Chip key={s} label={s} />) : <span className="text-sm text-slate-400 italic">None</span>}</div></div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              <Lock className="w-5 h-5 mx-auto mb-2 text-slate-400" />
              Profile &amp; Bio is available only when <strong>Include for self-scheduling</strong> is on.
              <div className="mt-2"><Link href={`/provider-staff/${p.id}/edit#access`} className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Turn it on in Access &amp; Services</Link></div>
            </div>
          )
        )}

        {invs.length > 0 && (
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-4">Invitation history</h2>
            <InviteHistoryTable entries={auditFor(store, p.id)} />
          </div>
        )}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200 mt-6 mb-4">Full audit history</h2>
          <AuditList entries={auditFor(store, p.id)} />
          <ResolvedCorrectionsList corrections={corrections} />
        </div>
      </div>

      <ResendInviteDialog open={resendOpen} onClose={() => setResendOpen(false)} provider={p} everSent={invs.length > 0}
        onResult={(r) => setNote(r.ok ? { tone: "ok", text: `Invitation sent to ${r.invitation.email}. The link expires on ${fmtDate(r.invitation.expiresAt)}; the previous link no longer works.` } : { tone: "error", text: r.message })} />
      <InviteEmailPreview open={emailOpen} onClose={() => setEmailOpen(false)} provider={p} invitation={latest && latest.delivery === "delivered" ? latest : undefined} isResend={invs.length > 1} />
      <ChangeStatusDialog open={statusOpen} onClose={() => setStatusOpen(false)} provider={p} onDone={() => setNote({ tone: "ok", text: "Status updated." })} />
      <ActiveToggleDialog open={activeOpen} onClose={() => setActiveOpen(false)} provider={p} onDone={() => setNote({ tone: "ok", text: p.isActive ? `${p.firstName} was deactivated.` : `${p.firstName} was reactivated.` })} />
    </div>
  );
}
