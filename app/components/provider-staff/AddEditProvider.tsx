"use client";

// Add / Edit Provider — one full-page form, one schema (PRM-105). Add and Edit
// share every section; Add alone shows the invite / Clinically Active options
// above the footer, Edit alone runs the "changes that affect live work"
// guardrails before it saves.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Check, Lock, Send } from "lucide-react";
import { STATUS_META } from "@/data/provider-credentialing";
import { providerDisplayName, type ProviderRecord } from "@/data/provider-record";
import {
  SECTIONS, defaultHoursFromClinics, emptyForm, formFromRecord, stripFormMeta, validateForm,
  type ProviderForm, type SectionId,
} from "@/lib/provider-form";
import {
  createProvider, isInviteAccepted, saveProvider, selectRecord, sendInvite, sweepExpiries, useProviderStore, useProviderStoreReady,
} from "@/lib/provider-store";
import { todayIso } from "@/lib/provider-validation";
import { useUnsavedGuard } from "@/lib/use-unsaved-guard";
import { CURRENT_ADMIN } from "@/data/provider-record";
import Modal from "@/components/ui/Modal";
import { cn } from "@/lib/utils";
import { Callout } from "./form/fields";
import IdentitySection from "./form/IdentitySection";
import AccessSection from "./form/AccessSection";
import ScheduleSection from "./form/ScheduleSection";
import ProfileSection from "./form/ProfileSection";
import type { SectionProps } from "./form/types";

interface Props { providerId?: string }

export default function AddEditProviderScreen({ providerId }: Props) {
  const store = useProviderStore();
  // The persisted store hydrates client-side after mount; hold the form back until it has,
  // so Edit pre-fills from the saved record rather than the seed.
  const ready = useProviderStoreReady();
  const original = providerId ? selectRecord(store, providerId) : undefined;

  if (!ready) return <div className="py-20 text-center text-sm text-slate-400">Loading…</div>;
  if (providerId && !original) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-slate-500 dark:text-slate-400 mb-3">Provider not found</p>
        <Link href="/provider-staff" className="flex items-center gap-2 text-sm text-blue-600 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to Providers</Link>
      </div>
    );
  }
  return <ProviderFormScreen key={providerId ?? "new"} original={original} />;
}

function ProviderFormScreen({ original }: { original?: ProviderRecord }) {
  const router = useRouter();
  const store = useProviderStore();
  const mode: "add" | "edit" = original ? "edit" : "add";
  const backHref = original ? `/provider-staff/${original.id}` : "/provider-staff";

  const [initial] = useState<ProviderForm>(() => (original ? formFromRecord(original) : emptyForm()));
  const [initialJson] = useState(() => JSON.stringify(initial));
  const [form, setFormState] = useState<ProviderForm>(initial);
  const formRef = useRef(form);
  const scheduleTouched = useRef(mode === "edit");
  const [touched, setTouched] = useState<Record<string, true>>({});
  const [showAll, setShowAll] = useState(false);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<SectionId>("identity");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [newInvitePrompt, setNewInvitePrompt] = useState<{ email: string; providerId: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { sweepExpiries(); }, []);

  /** Functional updater that also keeps the schedule in step with Clinic Access until the admin edits it by hand. */
  const update = useCallback((fn: (f: ProviderForm) => ProviderForm) => {
    const prev = formRef.current;
    let next = fn(prev);
    if (next.workingHours !== prev.workingHours) scheduleTouched.current = true;
    else if (!scheduleTouched.current && next.clinicAccess !== prev.clinicAccess) next = { ...next, workingHours: defaultHoursFromClinics(next.clinicAccess) };
    formRef.current = next;
    setFormState(next);
  }, []);
  const set = useCallback(<K extends keyof ProviderForm>(key: K, value: ProviderForm[K]) => update((f) => ({ ...f, [key]: value })), [update]);
  const touch = useCallback((key: string) => setTouched((t) => (t[key] ? t : { ...t, [key]: true })), []);

  const v = useMemo(() => validateForm(form, { mode, original, store }), [form, mode, original, store]);
  const err = useCallback((key: string) => {
    const i = v.issues[key];
    if (!i) return undefined;
    return i.kind === "invalid" || touched[key] || showAll ? i.msg : undefined;
  }, [v, touched, showAll]);

  const dirty = !saving && JSON.stringify(form) !== initialJson;
  const guard = useUnsavedGuard(dirty);

  // Scroll-spy for the section rail
  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (top) setActive(top.target.getAttribute("data-section") as SectionId);
    }, { root, rootMargin: "0px 0px -70% 0px", threshold: 0 });
    root.querySelectorAll("[data-section]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  function jump(id: SectionId) {
    scrollRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActive(id);
  }

  const totalIssues = Object.keys(v.issues).length;
  const firstBad = SECTIONS.find((s) => v.counts[s.id].required + v.counts[s.id].invalid > 0);

  /* ── Save ── */

  function persistAdd() {
    setSaving(true);
    const { record } = createProvider(stripFormMeta(form), { sendInvite: form.sendInvite, markActive: form.markActive });
    router.push(`/provider-staff/${record.id}?created=1`);
  }

  function persistEdit() {
    if (!original) return;
    setSaving(true);
    const fields = stripFormMeta(form);
    const today = todayIso();
    let next: ProviderRecord = { ...original, ...fields };
    if (v.hoursChanged) {
      if (form.applyFrom <= today) next = { ...next, workingHours: form.workingHours, pendingWorkingHours: undefined };
      else next = { ...next, workingHours: original.workingHours, pendingWorkingHours: { effectiveFrom: form.applyFrom, hours: form.workingHours, scheduledAt: new Date().toISOString(), scheduledBy: CURRENT_ADMIN.name } };
    } else {
      next = { ...next, workingHours: original.workingHours, pendingWorkingHours: original.pendingWorkingHours };
    }
    const res = saveProvider(next);
    if (res.emailChanged && !res.accepted) {
      setReviewOpen(false);
      setNewInvitePrompt({ email: next.email, providerId: original.id });
      return;
    }
    router.push(`${backHref}?saved=1${res.emailChanged ? "&reverify=1" : ""}`);
  }

  /** Things an admin should consciously acknowledge before an Edit goes live. */
  const impacts: { tone: "warn" | "info"; text: string }[] = [];
  if (original) {
    if (v.hoursChanged) impacts.push({ tone: "info", text: form.applyFrom <= todayIso() ? "Working hours change takes effect immediately." : `Working hours change is scheduled to take effect on ${form.applyFrom}. No further hour changes are allowed until then.` });
    if (form.email.trim().toLowerCase() !== original.email.toLowerCase()) {
      const accepted = isInviteAccepted(store, selectRecord(store, original.id) ?? original);
      impacts.push({
        tone: "warn",
        text: `Email changes from ${original.email} to ${form.email.trim()}. This changes ${original.firstName}'s login. ${accepted
          ? "They have already accepted their invitation, so the new address must be re-verified — a verification email goes to it."
          : "Their current invitation link stops working; you'll be asked whether to send a new one to the new address."}`,
      });
    }
    for (const k of ["telehealthOff", "cosignOff", "cosignOn"]) if (v.advisories[k]) impacts.push({ tone: v.advisories[k].tone, text: v.advisories[k].msg });
    const removed = original.clinicAccess.filter((c) => !form.clinicAccess.includes(c));
    if (removed.length) impacts.push({ tone: "warn", text: `Clinic access removed for ${removed.length} clinic${removed.length === 1 ? "" : "s"}. ${original.firstName} will no longer see or be booked there.` });
  }

  function onSave() {
    if (!v.valid) return;
    if (mode === "add") persistAdd();
    else if (impacts.length) setReviewOpen(true);
    else persistEdit();
  }

  /* ── Add-only: resulting status ── */
  const addResult = (() => {
    const inv = form.sendInvite, act = form.markActive;
    if (inv && !act) return { tone: "info" as const, text: "Resulting status: Invited — normal lifecycle." };
    if (inv && act) return { tone: "info" as const, text: "Resulting status: Clinically Active, invite sent — the provider is bookable immediately." };
    if (!inv && act) return { tone: "warn" as const, text: "Resulting status: Clinically Active, no login — bookable, but can't open encounters or sign notes until invited." };
    return { tone: "info" as const, text: "Resulting status: Invited — no email will be sent; use Resend invite when you're ready." };
  })();

  const sectionProps: SectionProps = { form, set, update, v, mode, original, err, touch };
  const displayName = original ? providerDisplayName(original) : "";

  return (
    <div className="flex flex-col h-[calc(100vh-108px)] min-h-[520px] -mb-1">
      {/* Header */}
      <div className="shrink-0 flex items-start justify-between gap-4 pb-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
            <Link href="/provider-staff" className="hover:text-slate-600">Provider &amp; Staff</Link><span>/</span>
            <span className="text-slate-500">{mode === "add" ? "Add provider" : `Edit ${displayName}`}</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{mode === "add" ? "Add provider" : "Edit provider"}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {mode === "add" ? "Add a provider to the organization. Every section is open — jump around as you like." : <>{displayName} · <span className="font-medium">{STATUS_META[original!.status].label}</span></>}
          </p>
        </div>
        <button type="button" onClick={() => guard.requestLeave(backHref)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
          <ArrowLeft className="w-4 h-4" /> {mode === "add" ? "Back to list" : "Back to provider"}
        </button>
      </div>

      {/* Rail + form */}
      <div className="flex-1 min-h-0 flex gap-6">
        <nav aria-label="Form sections" className="w-56 shrink-0 hidden md:block">
          <ul className="space-y-1">
            {SECTIONS.map((s, idx) => {
              const off = s.id === "profile" && !form.capabilities.include_for_self_scheduling;
              const c = v.counts[s.id];
              const state = off ? "off" : c.invalid > 0 ? "invalid" : c.required > 0 ? "pending" : "done";
              return (
                <li key={s.id}>
                  <button type="button" onClick={() => jump(s.id)} aria-current={active === s.id ? "true" : undefined}
                    title={off ? "Turn on “Include for self-scheduling” in Access & Services to fill this in" : undefined}
                    className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm transition-colors",
                      active === s.id ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 font-semibold" : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                      off && "opacity-50")}>
                    <span className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0",
                      state === "done" && "bg-emerald-500 text-white",
                      state === "pending" && "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400",
                      state === "invalid" && "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400",
                      state === "off" && "bg-slate-100 dark:bg-slate-800 text-slate-400")}>
                      {state === "done" ? <Check className="w-3.5 h-3.5" aria-label="Complete" /> : state === "off" ? <Lock className="w-3 h-3" aria-label="Unavailable" /> : c.required + c.invalid}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block truncate">{idx + 1}. {s.label}</span>
                      <span className="block text-[11px] font-normal text-slate-400 dark:text-slate-500">
                        {state === "done" ? "Complete" : state === "off" ? "Off · self-scheduling" : state === "invalid" ? `${c.invalid} to fix${c.required ? ` · ${c.required} missing` : ""}` : `${c.required} required left`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div ref={scrollRef} className="flex-1 min-w-0 overflow-y-auto pr-1 pb-6 space-y-5">
          <IdentitySection {...sectionProps} />
          <AccessSection {...sectionProps} />
          <ScheduleSection {...sectionProps} />
          <ProfileSection {...sectionProps} />
        </div>
      </div>

      {/* Footer */}
      <div className="shrink-0 -mx-6 -mb-6 mt-2 px-6 py-3 bg-white/95 dark:bg-slate-950/95 backdrop-blur border-t border-slate-200 dark:border-slate-800">
        {mode === "add" && (
          <div className="grid md:grid-cols-2 gap-x-8 gap-y-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" className="accent-brand-600 w-4 h-4 mt-0.5" checked={form.sendInvite} onChange={(e) => set("sendInvite", e.target.checked)} />
              <span>
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Send invite email to the provider</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Sends a single-use invite link to the provider&apos;s email on save.</span>
              </span>
            </label>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" className="accent-brand-600 w-4 h-4 mt-0.5" checked={form.markActive} onChange={(e) => set("markActive", e.target.checked)} />
              <span>
                <span className="block text-sm font-medium text-slate-800 dark:text-slate-200">Mark the provider Clinically Active</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">Skip the status lifecycle and immediately make the provider available for scheduling.</span>
              </span>
            </label>
            {form.markActive && (
              <Callout tone="warn" className="md:col-span-2 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-px" />
                <span>Verification is being bypassed. Date of birth and the NPI credential are now required. This will be recorded against {CURRENT_ADMIN.name} with today&apos;s date and time.</span>
              </Callout>
            )}
            <Callout tone={addResult.tone} className="md:col-span-2 flex items-start gap-2">
              {addResult.tone === "warn" ? <AlertTriangle className="w-4 h-4 shrink-0 mt-px" /> : <Send className="w-4 h-4 shrink-0 mt-px" />}
              <span>{addResult.text}</span>
            </Callout>
          </div>
        )}
        <div className="flex items-center gap-4">
          <div className="flex-1 min-w-0 text-xs">
            {totalIssues > 0 ? (
              <button type="button" onClick={() => { setShowAll(true); if (firstBad) jump(firstBad.id); }} className="text-left text-amber-700 dark:text-amber-400 hover:underline">
                <span className="font-semibold">{totalIssues} thing{totalIssues === 1 ? "" : "s"} to complete</span> before you can save
                {firstBad && <> — start with {firstBad.label}</>}
              </button>
            ) : dirty ? <span className="text-slate-500">Unsaved changes</span> : <span className="text-slate-400">{mode === "edit" ? "No changes yet" : ""}</span>}
          </div>
          <button type="button" onClick={() => guard.requestLeave(backHref)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">Cancel</button>
          <button type="button" disabled={!v.valid || saving || (mode === "edit" && !dirty)} onClick={onSave}
            className="px-5 py-2 rounded-xl practmd-gradient text-white text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">
            {mode === "add" ? "Save provider" : "Save changes"}
          </button>
        </div>
      </div>

      {/* Unsaved-changes prompt */}
      <Modal open={guard.pending !== null} onClose={guard.stay} title="Discard unsaved changes?" description="You have edits on this form that haven't been saved."
        footer={<>
          <button onClick={guard.stay} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Keep editing</button>
          <button onClick={guard.confirmLeave} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold">Discard changes</button>
        </>}>
        <p>Leaving now throws them away.</p>
      </Modal>

      {/* Edit: review impactful changes */}
      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} width="max-w-lg" title="Review before saving" description="These changes affect live work.">
        <ul className="space-y-2">
          {impacts.map((i, n) => <li key={n}><Callout tone={i.tone}>{i.text}</Callout></li>)}
        </ul>
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={() => setReviewOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Go back</button>
          <button onClick={persistEdit} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold">Confirm &amp; save</button>
        </div>
      </Modal>

      {/* Edit: email changed before the invite was accepted */}
      <Modal open={!!newInvitePrompt} onClose={() => { /* forced choice */ }} hideClose title="Send the invitation to the new address?"
        description="The previous invitation link no longer works.">
        <p>You changed {original?.firstName}&apos;s email to <strong>{newInvitePrompt?.email}</strong>. The invitation sent to the old address no longer works.</p>
        <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
          If you choose Not now, the provider won&apos;t have a working invitation until you send one from their record.
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <button onClick={() => router.push(`${backHref}?saved=1`)} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800">Not now</button>
          <button onClick={() => { if (newInvitePrompt) sendInvite(newInvitePrompt.providerId, { resend: false }); router.push(`${backHref}?saved=1&invited=1`); }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl practmd-gradient text-white text-sm font-semibold">Send to new address</button>
        </div>
      </Modal>
    </div>
  );
}
