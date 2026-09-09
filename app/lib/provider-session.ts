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
  type ProviderCapabilities,
  type ProviderClinicalProfile,
  type ProviderTypeKey,
} from "@/data/provider-credentialing";

export interface ProviderSessionState {
  providerId: string;
  /** null = use the profile's own status */
  statusOverride: ClinicalStatus | null;
  /** null = use provider-type defaults + seeded overrides */
  providerTypeOverride: ProviderTypeKey | null;
  capabilityOverrides: Partial<ProviderCapabilities>;
  activeClinicId: string;
  locked: boolean;
  /** provider has flagged that they are screen-sharing — the shell suppresses
   *  patient names in the notification tray while this is on */
  presenting: boolean;
  /** last time the provider touched the keyboard / mouse (inactivity lock) */
  lastActivity: number;
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
  capabilities: ProviderCapabilities;
  activeClinicId: string;
  locked: boolean;
  presenting: boolean;
}

function deriveSession(s: ProviderSessionState): ProviderSession {
  const provider = PROVIDERS.find((p) => p.id === s.providerId) ?? PROVIDERS[0];
  const base = CLINICAL_PROFILES[s.providerId] ?? buildClinicalProfile(s.providerId);

  const providerType = s.providerTypeOverride ?? base.providerType;

  // when the provider-type is overridden in the dev switcher, re-seed capability
  // defaults from that type, then apply the seeded + dev overrides on top
  const typeDefaults = s.providerTypeOverride
    ? defaultCapabilities(base.isSupervising ? "supervising" : s.providerTypeOverride)
    : base.capabilities;

  const capabilities: ProviderCapabilities = { ...typeDefaults, ...s.capabilityOverrides };

  const clinicalStatus = s.statusOverride ?? base.clinicalStatus;

  return {
    raw: s,
    provider,
    profile: { ...base, providerType, capabilities, clinicalStatus },
    providerType,
    clinicalStatus,
    capabilities,
    activeClinicId: s.activeClinicId,
    locked: s.locked,
    presenting: s.presenting,
  };
}

let cached: { input: ProviderSessionState; value: ProviderSession } | null = null;
function currentSession(): ProviderSession {
  const input = store.get();
  if (!cached || cached.input !== input) cached = { input, value: deriveSession(input) };
  return cached.value;
}

const SERVER_SESSION = deriveSession(INITIAL);

export function useProviderSession(): ProviderSession {
  return useSyncExternalStore(store.subscribe, currentSession, () => SERVER_SESSION);
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

export function setSessionCapability(key: keyof ProviderCapabilities, value: boolean) {
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
