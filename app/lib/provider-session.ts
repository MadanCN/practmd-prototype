"use client";

// The signed-in provider's session: who they are, their live clinical status
// and capability set, the clinic they're working in, and the screen-lock /
// screen-share flags the shell needs. Persisted so a refresh keeps you where
// you were. A dev switcher (header, gated to the prototype) writes the
// override fields so every provider-type / status combination can be demoed.

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";
import { PROVIDERS, type Provider } from "@/data/providers";
import {
  CLINICAL_PROFILES,
  buildClinicalProfile,
  defaultCapabilities,
  type ClinicalStatus,
  type ProviderClinicalProfile,
  type ProviderTypeKey,
} from "@/data/provider-credentialing";
import { emptyCapabilities, type AccessCapabilities } from "@/data/provider-record";
import { getProviderStore, getRecord, subscribeProviderStore } from "@/lib/provider-store";

export interface ProviderSessionState {
  providerId: string;
  /** null = use the profile's own status */
  statusOverride: ClinicalStatus | null;
  /** null = use provider-type defaults + seeded overrides */
  providerTypeOverride: ProviderTypeKey | null;
  capabilityOverrides: Partial<AccessCapabilities>;
  activeClinicId: string;
  locked: boolean;
  /** provider has flagged that they are screen-sharing — the shell suppresses
   *  patient names in the notification tray while this is on */
  presenting: boolean;
  /** last time the provider touched the keyboard / mouse (inactivity lock) */
  lastActivity: number;
}

/** The dev switcher's "provider-type (re-seeds capabilities)" control needs a same-shaped
 *  default set to preview — mapped from the type-based seed defaults in provider-credentialing.ts. */
function accessCapsFromType(type: ProviderTypeKey, supervising: boolean): AccessCapabilities {
  const c = defaultCapabilities(supervising ? "supervising" : type);
  return {
    telehealth_license: c.can_telehealth, e_prescribing: c.can_prescribe, can_book: c.can_book,
    can_sign_notes: c.can_sign_notes, requires_cosign: c.requires_cosign, can_cosign: c.can_cosign,
    can_order_labs: c.can_order_labs, can_be_billed: c.can_bill, can_view_all_patients: c.can_view_all_patients,
    can_see_reports: true, include_for_self_scheduling: true,
  };
}

const INITIAL: ProviderSessionState = {
  providerId: "p1",
  statusOverride: null,
  providerTypeOverride: null,
  capabilityOverrides: {},
  activeClinicId: "penfield-psychiatry",
  locked: false,
  presenting: false,
  lastActivity: Date.now(),
};

const store = createPersistedStore<ProviderSessionState>({
  key: "provider-session",
  initial: INITIAL,
  revive: (raw, initial) => ({ ...initial, ...(raw as object), locked: false, lastActivity: Date.now() }),
});

/* ── derived session view ─────────────────────────────────────────────── */

export interface ProviderSession {
  raw: ProviderSessionState;
  provider: Provider;
  profile: ProviderClinicalProfile;
  providerType: ProviderTypeKey;
  clinicalStatus: ClinicalStatus;
  capabilities: AccessCapabilities;
  activeClinicId: string;
  locked: boolean;
  presenting: boolean;
}

function deriveSession(s: ProviderSessionState): ProviderSession {
  const provider = PROVIDERS.find((p) => p.id === s.providerId) ?? PROVIDERS[0];
  const base = CLINICAL_PROFILES[s.providerId] ?? buildClinicalProfile(s.providerId);

  const providerType = s.providerTypeOverride ?? base.providerType;

  // Capabilities live on the provider record (lib/provider-store) — what the
  // Clinic Admin actually granted in Add/Edit — and that's what gates the
  // portal now, not a frozen provider-type seed. The dev switcher's
  // provider-type override still re-seeds a same-shaped default set to
  // preview a different type; capabilityOverrides always wins on top.
  const liveRecord = getRecord(s.providerId);
  const typeDefaults = s.providerTypeOverride
    ? accessCapsFromType(s.providerTypeOverride, base.isSupervising)
    : (liveRecord?.capabilities ?? emptyCapabilities());

  const capabilities: AccessCapabilities = { ...typeDefaults, ...s.capabilityOverrides };

  // Clinical status lives on the same live record — the admin- and
  // provider-side source of truth. The dev switcher's statusOverride still
  // wins, for demoing any status on any provider; CLINICAL_PROFILES is only
  // the last-resort seed for a provider id with no record at all.
  const clinicalStatus = s.statusOverride ?? liveRecord?.status ?? base.clinicalStatus;

  return {
    raw: s,
    provider,
    profile: { ...base, providerType, clinicalStatus },
    providerType,
    clinicalStatus,
    capabilities,
    activeClinicId: s.activeClinicId,
    locked: s.locked,
    presenting: s.presenting,
  };
}

let cached: { input: ProviderSessionState; providerState: unknown; value: ProviderSession } | null = null;
function currentSession(): ProviderSession {
  const input = store.get();
  const providerState = getProviderStore();
  if (!cached || cached.input !== input || cached.providerState !== providerState) {
    cached = { input, providerState, value: deriveSession(input) };
  }
  return cached.value;
}

const SERVER_SESSION = deriveSession(INITIAL);

/** Re-render session consumers on either the session store or the provider
 *  record store changing (e.g. an activation-wizard status transition). */
function subscribeSession(l: () => void) {
  const unsub1 = store.subscribe(l);
  const unsub2 = subscribeProviderStore(l);
  return () => { unsub1(); unsub2(); };
}

export function useProviderSession(): ProviderSession {
  return useSyncExternalStore(subscribeSession, currentSession, () => SERVER_SESSION);
}

/** Non-hook read for stores / event handlers. */
export function getProviderSession(): ProviderSession {
  return currentSession();
}

/* ── actions ──────────────────────────────────────────────────────────── */

export function setSessionProvider(providerId: string) {
  store.set((s) => ({
    ...s,
    providerId,
    statusOverride: null,
    providerTypeOverride: null,
    capabilityOverrides: {},
  }));
}

export function setSessionStatus(status: ClinicalStatus | null) {
  store.set((s) => ({ ...s, statusOverride: status }));
}

export function setSessionProviderType(type: ProviderTypeKey | null) {
  store.set((s) => ({ ...s, providerTypeOverride: type, capabilityOverrides: {} }));
}

export function setSessionCapability(key: keyof AccessCapabilities, value: boolean) {
  store.set((s) => ({ ...s, capabilityOverrides: { ...s.capabilityOverrides, [key]: value } }));
}

export function resetSessionOverrides() {
  store.set((s) => ({ ...s, statusOverride: null, providerTypeOverride: null, capabilityOverrides: {} }));
}

export function setActiveClinic(clinicId: string) {
  store.set((s) => ({ ...s, activeClinicId: clinicId }));
}

export function lockPortal() {
  store.set((s) => ({ ...s, locked: true }));
}

export function unlockPortal() {
  store.set((s) => ({ ...s, locked: false, lastActivity: Date.now() }));
}

export function setPresenting(on: boolean) {
  store.set((s) => ({ ...s, presenting: on }));
}

export function noteActivity() {
  const s = store.get();
  if (s.locked) return;
  // throttle writes — only persist every 20s of activity
  if (Date.now() - s.lastActivity > 20000) {
    store.set((prev) => ({ ...prev, lastActivity: Date.now() }));
  }
}

export function getLastActivity() {
  return store.get().lastActivity;
}

export { store as _providerSessionStore };
