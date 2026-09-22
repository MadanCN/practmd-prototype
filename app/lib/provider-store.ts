"use client";

// Provider records, invitations and the invitation audit trail.
//
// Prototype persistence (localStorage via createPersistedStore) standing in
// for the real tables:  provider  ·  provider_invitation  ·  provider_audit.
//
// Seed providers (data/providers.ts) are lifted into the full record shape on
// demand; an edit stores the whole edited record as an "override". Providers
// created through Add live in `created`. Every save is also mirrored into the
// legacy `PROVIDERS` array so the Care Coordinator / Provider portals — which
// still read that — see new providers, renamed providers, clinic access and
// working-hours changes within the same session.

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";
import { PROVIDERS, STAFF, type Provider } from "@/data/providers";
import { CLINICS } from "@/data/clinics";
import type { ClinicalStatus } from "@/data/provider-credentialing";
import {
  seedProviderRecord, providerDisplayName, NPI_QUALIFIER, CURRENT_ADMIN,
  type ProviderRecord,
} from "@/data/provider-record";
import { addDaysIso, isValidEmail, normalizeEmail, todayIso } from "@/lib/provider-validation";

/* ── Types ───────────────────────────────────────────────────────────── */

export const INVITE_TTL_DAYS = 7;
export const REMINDER_DAYS = [3, 6];
export const RESEND_COOLDOWN_MIN = 10;
export const RESEND_DAILY_LIMIT = 5;

export interface Invitation {
  id: string;
  providerId: string;
  email: string;
  token: string;
  sentAt: string;
  expiresAt: string;
  sentBy: string;
  /** live = the current link; used = account set up; invalidated = killed by a resend / email edit */
  status: "live" | "used" | "invalidated";
  delivery: "delivered" | "failed";
  failureReason?: string;
  reminders: string[];
  usedAt?: string;
}

export type AuditEvent =
  | "provider_created" | "provider_updated" | "status_changed" | "deactivated" | "reactivated"
  | "invite_sent" | "invite_resent" | "invite_failed" | "invite_expired" | "invite_invalidated" | "invite_accepted"
  | "email_changed" | "email_reverification_sent" | "verification_bypassed" | "correction_submitted";

export interface AuditEntry {
  id: string;
  providerId: string;
  at: string;
  actor: string;
  event: AuditEvent;
  email?: string;
  note?: string;
}

export interface ProviderStoreState {
  overrides: Record<string, ProviderRecord>;
  created: ProviderRecord[];
  invitations: Invitation[];
  audit: AuditEntry[];
}
type State = ProviderStoreState;

/* ── Demo seed: one provider per invitation state ──────────────────────
 * p6 live · p7 expired · p8 deactivated-before-accepting · p9 accepted.
 * Fixed 09:00Z times so server + client render identical text on a given day. */

const at = (daysAgo: number, hour = 9) => `${addDaysIso(todayIso(), -daysAgo)}T${String(hour).padStart(2, "0")}:00:00.000Z`;

function seedInvite(providerId: string, email: string, daysAgo: number, token: string, status: Invitation["status"]): Invitation {
  const sentAt = at(daysAgo);
  return {
    id: `inv_${token}`, providerId, email, token, sentAt,
    expiresAt: at(daysAgo - INVITE_TTL_DAYS),
    sentBy: CURRENT_ADMIN.name, status, delivery: "delivered",
    reminders: REMINDER_DAYS.map((d) => at(daysAgo - d)),
    usedAt: status === "used" ? at(daysAgo - 1, 14) : undefined,
  };
}

const SEED_PROVIDERS: Provider[] = JSON.parse(JSON.stringify(PROVIDERS));
const seedById = new Map(SEED_PROVIDERS.map((p) => [p.id, p]));

function demoState(): State {
  const emailOf = (id: string) => seedById.get(id)?.email ?? "";
  const invitations = [
    seedInvite("p6", emailOf("p6"), 2, "demo-live-p6", "live"),
    seedInvite("p7", emailOf("p7"), 9, "demo-expired-p7", "live"),
    seedInvite("p8", emailOf("p8"), 3, "demo-deactivated-p8", "live"),
    seedInvite("p9", emailOf("p9"), 5, "demo-used-p9", "used"),
  ];
  const audit: AuditEntry[] = [];
  let n = 0;
  const push = (providerId: string, when: string, event: AuditEvent, email?: string, actor: string = CURRENT_ADMIN.name, note?: string) =>
    audit.push({ id: `au_seed_${n++}`, providerId, at: when, actor, event, email, note });
  push("p6", at(2), "invite_sent", emailOf("p6"));
  push("p7", at(9), "invite_sent", emailOf("p7"));
  push("p7", at(2), "invite_expired", emailOf("p7"), "System");
  push("p8", at(3), "invite_sent", emailOf("p8"));
  push("p8", at(1), "deactivated", undefined, CURRENT_ADMIN.name, "Deactivated before accepting the invitation");
  push("p9", at(5), "invite_sent", emailOf("p9"));
  push("p9", at(4, 14), "invite_accepted", emailOf("p9"), "Provider");
  return { overrides: {}, created: [], invitations, audit };
}

const store = createPersistedStore<State>({
  key: "provider-records",
  initial: demoState(),
  revive: (raw, initial) => {
    const r = raw as Partial<State>;
    return {
      overrides: r.overrides ?? initial.overrides,
      created: r.created ?? initial.created,
      invitations: r.invitations ?? initial.invitations,
      audit: r.audit ?? initial.audit,
    };
  },
});

/* ── Reads ───────────────────────────────────────────────────────────── */

const seedCache = new Map<string, ProviderRecord>();
function seedRecord(id: string): ProviderRecord | undefined {
  const cached = seedCache.get(id);
  if (cached) return cached;
  const p = seedById.get(id);
  if (!p) return undefined;
  const r = seedProviderRecord(p);
  seedCache.set(id, r);
  return r;
}

/** A scheduled working-hours change takes effect on its date — resolve it on read. */
function materialize(r: ProviderRecord): ProviderRecord {
  const pend = r.pendingWorkingHours;
  if (pend && pend.effectiveFrom <= todayIso()) return { ...r, workingHours: pend.hours, pendingWorkingHours: undefined };
  return r;
}

const recordsCache = new WeakMap<State, ProviderRecord[]>();
export function selectRecords(s: State): ProviderRecord[] {
  const hit = recordsCache.get(s);
  if (hit) return hit;
  const seeds = SEED_PROVIDERS.map((p) => s.overrides[p.id] ?? seedRecord(p.id)!);
  const out = [...seeds, ...s.created.map((c) => s.overrides[c.id] ?? c)].map(materialize);
  recordsCache.set(s, out);
  return out;
}
export const selectRecord = (s: State, id: string) => selectRecords(s).find((r) => r.id === id);

export function useProviderStore(): State {
  return useSyncExternalStore(subscribeAndSync, store.getSnapshot, store.getServerSnapshot);
}
export const getProviderStore = () => store.get();
export const getRecord = (id: string) => selectRecord(store.get(), id);
/** For external stores (e.g. the provider portal session) that need to re-derive when a record changes. */
export const subscribeProviderStore = (l: () => void) => store.subscribe(l);

export const invitationsFor = (s: State, id: string) =>
  s.invitations.filter((i) => i.providerId === id).sort((a, b) => b.sentAt.localeCompare(a.sentAt));
export const auditFor = (s: State, id: string) =>
  s.audit.filter((a) => a.providerId === id).sort((a, b) => b.at.localeCompare(a.at));

/** The most recent invitation for a provider (whatever its state). */
export const latestInvite = (s: State, id: string) => invitationsFor(s, id)[0];

export type InviteState = "live" | "expired" | "used" | "invalidated" | "failed";
export function inviteStateOf(inv: Invitation, now = Date.now()): InviteState {
  if (inv.status === "used") return "used";
  if (inv.status === "invalidated") return "invalidated";
  if (inv.delivery === "failed") return "failed";
  return new Date(inv.expiresAt).getTime() < now ? "expired" : "live";
}

/** Has the provider accepted their invitation (account set up)? */
export function isInviteAccepted(s: State, r: ProviderRecord): boolean {
  const invs = invitationsFor(s, r.id);
  if (invs.some((i) => i.status === "used")) return true;
  if (invs.length > 0) return false;
  return r.status !== "invited" && !r.verificationBypass;
}

export function telehealthLicensesUsed(s: State, excludeId?: string): number {
  return selectRecords(s).filter((r) => r.id !== excludeId && r.capabilities.telehealth_license).length;
}

/* ── Email uniqueness across the tenant ───────────────────────────────── */

export type EmailConflict =
  | { kind: "provider"; name: string; clinic: string; id: string }
  | { kind: "staff" | "admin"; name: string };

export function findEmailConflict(s: State, email: string, excludeId?: string): EmailConflict | null {
  const e = normalizeEmail(email);
  if (!e) return null;
  const prov = selectRecords(s).find((r) => r.id !== excludeId && normalizeEmail(r.email) === e);
  if (prov) {
    const clinic = CLINICS.find((c) => c.id === prov.clinicAccess[0])?.name ?? "your organization";
    return { kind: "provider", name: providerDisplayName(prov), clinic, id: prov.id };
  }
  const staff = STAFF.find((m) => normalizeEmail(m.email) === e);
  if (staff) return { kind: "staff", name: staff.displayName };
  for (const c of CLINICS) {
    const admin = c.admins.find((a) => normalizeEmail(a.email) === e);
    if (admin) return { kind: "admin", name: admin.name };
  }
  return null;
}

export function emailConflictMessage(c: EmailConflict): string {
  return c.kind === "provider"
    ? `Duplicate — ${c.name} already has an account with this email in your organization (${c.clinic}). No new account will be created.`
    : `This email already belongs to a ${c.kind === "admin" ? "clinic admin" : "staff"} user (${c.name}). One account, one role — use a different email.`;
}

/* ── Legacy mirror ────────────────────────────────────────────────────── */

function toLegacy(r: ProviderRecord, prev?: Provider): Provider {
  const nameSame = prev && prev.firstName === r.firstName && prev.lastName === r.lastName && prev.credentials === r.credentialsSuffix;
  const npi = r.credentials.find((c) => c.qualifier === NPI_QUALIFIER)?.value ?? prev?.npi ?? "";
  const lic = r.credentials.find((c) => c.qualifier === "0B");
  const years = Number(r.yearsExperience);
  return {
    id: r.id, kind: "provider",
    firstName: r.firstName, lastName: r.lastName,
    displayName: nameSame && prev ? prev.displayName : providerDisplayName(r),
    gender: prev?.gender ?? "",
    email: r.email, phone: r.phone, dob: r.dob,
    providerType: r.providerType, npi,
    licenseNumber: lic?.value ?? prev?.licenseNumber ?? "", licenseState: prev?.licenseState ?? r.state,
    specializations: r.specializations, clinicAccess: r.clinicAccess, color: r.color,
    credentials: r.credentialsSuffix, bio: r.aboutProvider, languages: prev?.languages ?? ["English"],
    street: [r.addressLine1, r.addressLine2].filter(Boolean).join(", "), city: r.city, state: r.state, zip: r.zip,
    visitTypes: r.visitTypes, services: r.servicesProvided,
    telehealthEnabled: r.capabilities.telehealth_license,
    permissionRole: prev?.permissionRole ?? "Attending Physician",
    isActive: r.isActive, isDeleted: false,
    workingHours: r.workingHours,
    yearsExperience: Number.isFinite(years) && r.yearsExperience !== "" ? years : prev?.yearsExperience,
    education: r.education.length ? r.education.map((e) => `${e.degree}${e.institution ? ` — ${e.institution}` : ""}${e.year ? ` (${e.year})` : ""}`) : prev?.education,
    boardCertifications: prev?.boardCertifications, insuranceAccepted: prev?.insuranceAccepted,
    acceptingNewPatients: r.capabilities.include_for_self_scheduling,
  };
}

function syncLegacy(r: ProviderRecord) {
  const i = PROVIDERS.findIndex((p) => p.id === r.id);
  if (i >= 0) PROVIDERS[i] = toLegacy(r, PROVIDERS[i]);
  else PROVIDERS.push(toLegacy(r));
}

function syncAllLegacy(s: State) {
  for (const id of Object.keys(s.overrides)) {
    const r = selectRecord(s, id);
    if (r) syncLegacy(r);
  }
  for (const c of s.created) {
    const r = selectRecord(s, c.id);
    if (r) syncLegacy(r);
  }
}

let ready = false;
const readyListeners = new Set<() => void>();
function markReady() {
  if (ready) return;
  ready = true;
  readyListeners.forEach((l) => l());
}

function subscribeAndSync(l: () => void) {
  const unsub = store.subscribe(l); // hydrates from localStorage on first subscribe
  syncAllLegacy(store.get());
  markReady();
  return unsub;
}

/** false on the server and during the first client render, true once the persisted state has been loaded.
 *  Screens that seed local form state from a record wait for it so they pre-fill from saved data, not the seed. */
export function useProviderStoreReady(): boolean {
  return useSyncExternalStore(
    (l) => {
      readyListeners.add(l);
      store.hydrate();
      syncAllLegacy(store.get());
      markReady();
      return () => { readyListeners.delete(l); };
    },
    () => ready,
    () => false,
  );
}

/* ── Writes ──────────────────────────────────────────────────────────── */

const nowIso = () => new Date().toISOString();
let uid = 0;
const nextId = (p: string) => `${p}_${Date.now().toString(36)}${(uid++).toString(36)}`;

function audit(s: State, e: Omit<AuditEntry, "id" | "at" | "actor"> & { actor?: string; at?: string }): State {
  return { ...s, audit: [...s.audit, { id: nextId("au"), at: e.at ?? nowIso(), actor: e.actor ?? CURRENT_ADMIN.name, providerId: e.providerId, event: e.event, email: e.email, note: e.note }] };
}

function putRecord(s: State, r: ProviderRecord): State {
  const isCreated = s.created.some((c) => c.id === r.id);
  return isCreated
    ? { ...s, created: s.created.map((c) => (c.id === r.id ? r : c)) }
    : { ...s, overrides: { ...s.overrides, [r.id]: r } };
}

/** Delivery is simulated: any address containing "bounce" (or ending .invalid) is rejected by the mail provider. */
export function isUndeliverable(email: string) {
  const e = normalizeEmail(email);
  return e.includes("bounce") || e.endsWith(".invalid");
}

/** Relative by default so server and client render the same href; pass `absolute` when copying to the clipboard. */
export function inviteUrl(token: string, absolute = false) {
  const origin = absolute && typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/invite/${token}`;
}

export type InviteResult =
  | { ok: true; invitation: Invitation }
  | { ok: false; reason: "rate_limited" | "delivery_failed" | "invalid_email" | "duplicate" | "already_accepted" | "not_found"; message: string; retryAt?: string; invitation?: Invitation };

export interface ResendAllowance { allowed: boolean; reason?: string; retryAt?: string; remainingToday: number }

/** One resend per 10 minutes, five per day. Failed deliveries don't count. */
export function resendAllowance(s: State, providerId: string, now = Date.now()): ResendAllowance {
  const resends = s.audit.filter((a) => a.providerId === providerId && a.event === "invite_resent");
  const inDay = resends.filter((a) => now - new Date(a.at).getTime() < 86400000);
  const last = resends.map((a) => new Date(a.at).getTime()).sort((a, b) => b - a)[0];
  const remainingToday = Math.max(0, RESEND_DAILY_LIMIT - inDay.length);
  if (last !== undefined && now - last < RESEND_COOLDOWN_MIN * 60000) {
    const retryAt = new Date(last + RESEND_COOLDOWN_MIN * 60000).toISOString();
    return { allowed: false, retryAt, remainingToday, reason: `You can resend once every ${RESEND_COOLDOWN_MIN} minutes.` };
  }
  if (inDay.length >= RESEND_DAILY_LIMIT) {
    return { allowed: false, remainingToday: 0, reason: `Daily limit reached — ${RESEND_DAILY_LIMIT} resends per provider per day. Try again tomorrow.` };
  }
  return { allowed: true, remainingToday };
}

function newInvitation(providerId: string, email: string): Invitation {
  const sent = new Date();
  const token = `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  const failed = isUndeliverable(email);
  return {
    id: nextId("inv"), providerId, email, token,
    sentAt: sent.toISOString(),
    expiresAt: new Date(sent.getTime() + INVITE_TTL_DAYS * 86400000).toISOString(),
    sentBy: CURRENT_ADMIN.name, status: "live",
    delivery: failed ? "failed" : "delivered",
    failureReason: failed ? "The mail server rejected this address (mailbox unavailable)." : undefined,
    reminders: REMINDER_DAYS.map((d) => new Date(sent.getTime() + d * 86400000).toISOString()),
  };
}

/** Kill every live link for a provider (a resend, an email edit, or a deactivation of the link). */
function invalidateLive(s: State, providerId: string, note: string): State {
  const live = s.invitations.filter((i) => i.providerId === providerId && i.status === "live");
  if (!live.length) return s;
  let next: State = { ...s, invitations: s.invitations.map((i) => (i.providerId === providerId && i.status === "live" ? { ...i, status: "invalidated" as const } : i)) };
  next = audit(next, { providerId, event: "invite_invalidated", email: live[0].email, note });
  return next;
}

/**
 * Send or resend an invitation. `email` overrides the address on the record
 * (Resend dialog → "Edit email"): the record is updated, the old link dies and
 * the new one goes to the new address in one step.
 */
export function sendInvite(providerId: string, opts: { resend: boolean; email?: string }): InviteResult {
  let s = store.get();
  const rec = selectRecord(s, providerId);
  if (!rec) return { ok: false, reason: "not_found", message: "Provider not found." };
  if (isInviteAccepted(s, rec)) return { ok: false, reason: "already_accepted", message: "This provider has already set up their account." };

  const email = (opts.email ?? rec.email).trim();
  if (!isValidEmail(email)) return { ok: false, reason: "invalid_email", message: "Enter a valid email address." };

  if (opts.resend) {
    const allow = resendAllowance(s, providerId);
    if (!allow.allowed) return { ok: false, reason: "rate_limited", message: allow.reason ?? "Too many resends.", retryAt: allow.retryAt };
  }

  const emailChanged = normalizeEmail(email) !== normalizeEmail(rec.email);
  if (emailChanged) {
    const conflict = findEmailConflict(s, email, providerId);
    if (conflict) return { ok: false, reason: "duplicate", message: emailConflictMessage(conflict) };
  }

  s = invalidateLive(s, providerId, emailChanged ? "Replaced — invitation re-sent to a new address" : opts.resend ? "Replaced by a resend" : "Replaced by a new invitation");
  if (emailChanged) {
    s = putRecord(s, { ...rec, email: email });
    s = audit(s, { providerId, event: "email_changed", email, note: `From ${rec.email}` });
  }
  const invitation = newInvitation(providerId, email);
  s = { ...s, invitations: [...s.invitations, invitation] };
  if (invitation.delivery === "failed") {
    s = audit(s, { providerId, event: "invite_failed", email, note: invitation.failureReason });
  } else {
    s = audit(s, { providerId, event: opts.resend ? "invite_resent" : "invite_sent", email });
  }
  store.set(() => s);
  const saved = selectRecord(s, providerId);
  if (saved) syncLegacy(saved);
  return invitation.delivery === "failed"
    ? { ok: false, reason: "delivery_failed", message: `We couldn't deliver the invitation to ${email}. ${invitation.failureReason ?? ""} Check the address and try again.`, invitation }
    : { ok: true, invitation };
}

export interface CreateOptions { sendInvite: boolean; markActive: boolean }

/** Create a provider (Add). Status follows the invite × Clinically Active matrix. */
export function createProvider(draft: Omit<ProviderRecord, "id" | "createdAt" | "createdBy" | "status" | "isActive" | "emailVerified">, opts: CreateOptions): { record: ProviderRecord; invite?: InviteResult } {
  let s = store.get();
  const id = `p${100 + s.created.length + 1}`;
  const now = nowIso();
  const record: ProviderRecord = {
    ...draft, id,
    status: opts.markActive ? "clinically-active" : "invited",
    isActive: true, emailVerified: true,
    createdAt: now, createdBy: CURRENT_ADMIN.name,
    verificationBypass: opts.markActive ? { by: CURRENT_ADMIN.name, at: now } : undefined,
  };
  s = { ...s, created: [...s.created, record] };
  s = audit(s, { providerId: id, event: "provider_created", email: record.email });
  if (opts.markActive) s = audit(s, { providerId: id, event: "verification_bypassed", note: "Marked Clinically Active at creation — status lifecycle skipped" });
  store.set(() => s);
  syncLegacy(record);
  const invite = opts.sendInvite ? sendInvite(id, { resend: false }) : undefined;
  return { record, invite };
}

export interface SaveResult { record: ProviderRecord; emailChanged: boolean; accepted: boolean; invalidatedInvite: boolean }

/** Save an Edit. Handles the email-change consequences (old link dies / re-verification). */
export function saveProvider(next: ProviderRecord): SaveResult {
  let s = store.get();
  const prev = selectRecord(s, next.id);
  const accepted = prev ? isInviteAccepted(s, prev) : true;
  const emailChanged = !!prev && normalizeEmail(prev.email) !== normalizeEmail(next.email);
  let record = next;
  let invalidatedInvite = false;

  if (emailChanged) {
    if (accepted) record = { ...record, emailVerified: false };
    else {
      const hadLive = s.invitations.some((i) => i.providerId === next.id && i.status === "live");
      s = invalidateLive(s, next.id, "Email address edited on the record");
      invalidatedInvite = hadLive;
    }
  }
  s = putRecord(s, record);
  s = audit(s, { providerId: next.id, event: "provider_updated" });
  if (emailChanged) {
    s = audit(s, { providerId: next.id, event: "email_changed", email: next.email, note: `From ${prev?.email}` });
    if (accepted) s = audit(s, { providerId: next.id, event: "email_reverification_sent", email: next.email });
  }
  store.set(() => s);
  syncLegacy(selectRecord(s, next.id) ?? record);
  return { record, emailChanged, accepted, invalidatedInvite };
}

/** The provider corrected a pre-filled field during account activation (PRD "Account setup" —
 *  corrections raise a task to the Clinic Admin rather than silently overwriting; NPI/licence
 *  corrections also go to Credentialing). The value is applied immediately (prototype: no
 *  separate approve/deny queue) and logged here so the admin sees it on the provider's audit trail. */
export function logCorrection(providerId: string, field: string, from: string, to: string) {
  let s = store.get();
  s = audit(s, { providerId, event: "correction_submitted", actor: "Provider", note: `${field}: "${from}" → "${to}"` });
  store.set(() => s);
}

export function changeStatus(id: string, status: ClinicalStatus, note?: string) {
  let s = store.get();
  const rec = selectRecord(s, id);
  if (!rec || rec.status === status) return;
  s = putRecord(s, { ...rec, status });
  s = audit(s, { providerId: id, event: "status_changed", note: `${rec.status} → ${status}${note ? ` · ${note}` : ""}` });
  store.set(() => s);
}

export function setProviderActive(id: string, active: boolean) {
  let s = store.get();
  const rec = selectRecord(s, id);
  if (!rec || rec.isActive === active) return;
  const next = { ...rec, isActive: active };
  s = putRecord(s, next);
  s = audit(s, { providerId: id, event: active ? "reactivated" : "deactivated" });
  store.set(() => s);
  syncLegacy(next);
}

/** The provider finished account setup from the invitation link. */
export function completeInvitation(token: string) {
  let s = store.get();
  const inv = s.invitations.find((i) => i.token === token);
  if (!inv) return;
  const rec = selectRecord(s, inv.providerId);
  s = { ...s, invitations: s.invitations.map((i) => (i.id === inv.id ? { ...i, status: "used", usedAt: nowIso() } : i)) };
  s = audit(s, { providerId: inv.providerId, event: "invite_accepted", email: inv.email, actor: "Provider" });
  if (rec && rec.isActive && rec.status === "invited") s = putRecord(s, { ...rec, status: "account-setup" });
  store.set(() => s);
}

/** Log an "expired" audit line for any live invitation that has lapsed since it was last looked at. */
export function sweepExpiries() {
  const s = store.get();
  const now = Date.now();
  const lapsed = s.invitations.filter(
    (i) => inviteStateOf(i, now) === "expired" &&
      !s.audit.some((a) => a.providerId === i.providerId && a.event === "invite_expired" && a.email === i.email && a.at >= i.sentAt),
  );
  if (!lapsed.length) return;
  let next = s;
  for (const i of lapsed) next = audit(next, { providerId: i.providerId, event: "invite_expired", email: i.email, actor: "System", at: i.expiresAt });
  store.set(() => next);
}

export function resetProviderStore() {
  store.reset();
}
