"use client";

// The provider's journey from invitation to first session (PRD "The Provider's
// journey"). Prototype state: which steps of account-setup + activation are
// done. Field corrections at "Confirm profile" are tracked here for the
// readiness page's own list; the actual approve/deny/revise workflow lives in
// lib/provider-store.ts's Correction model.

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";

export type AccountStep = "welcome" | "verify-identity" | "set-password" | "enrol-mfa" | "accept-terms";
export type ActivationStep = "confirm-profile" | "confirm-hours" | "notification-prefs";

export const ACCOUNT_STEPS: AccountStep[] = ["welcome", "verify-identity", "set-password", "enrol-mfa", "accept-terms"];
export const ACTIVATION_STEPS: ActivationStep[] = ["confirm-profile", "confirm-hours", "notification-prefs"];

export interface FieldCorrection {
  field: string;
  from: string;
  to: string;
  raisedTaskAt: string;
}

interface ActivationState {
  invitationAccepted: boolean;
  accountStepsDone: AccountStep[];
  activationStepsDone: ActivationStep[];
  corrections: FieldCorrection[];
  /** the provider has fully finished activation and entered the portal */
  activated: boolean;
  credentialsSubmittedAt?: string;
}

const INITIAL: ActivationState = {
  invitationAccepted: false,
  accountStepsDone: [],
  activationStepsDone: [],
  corrections: [],
  activated: false,
};

const store = createPersistedStore<ActivationState>({
  key: "provider-activation",
  initial: INITIAL,
  // legacy flag from lib/provider-onboarding.ts — honour it so existing demos
  // that ran the old password/MFA flow don't get bounced back through setup
  revive: (raw, initial) => ({ ...initial, ...(raw as object) }),
});

export function useActivation() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function getActivation() {
  return store.get();
}

export function acceptInvitation() {
  store.set((s) => ({ ...s, invitationAccepted: true }));
}

export function completeAccountStep(step: AccountStep) {
  store.set((s) => ({
    ...s,
    accountStepsDone: Array.from(new Set([...s.accountStepsDone, step])),
  }));
}

export function completeActivationStep(step: ActivationStep) {
  store.set((s) => ({
    ...s,
    activationStepsDone: Array.from(new Set([...s.activationStepsDone, step])),
  }));
}

export function recordCorrection(field: string, from: string, to: string) {
  store.set((s) => ({
    ...s,
    corrections: [...s.corrections.filter((c) => c.field !== field), { field, from, to, raisedTaskAt: new Date().toISOString() }],
  }));
}

export function submitCredentials() {
  store.set((s) => ({ ...s, credentialsSubmittedAt: new Date().toISOString() }));
}

export function finishActivation() {
  store.set((s) => ({ ...s, activated: true, activationStepsDone: [...ACTIVATION_STEPS] }));
}

export function resetActivation() {
  store.reset();
}

export function accountSetupComplete(s: ActivationState) {
  return ACCOUNT_STEPS.every((x) => s.accountStepsDone.includes(x));
}
export function activationComplete(s: ActivationState) {
  // tour is skippable
  return s.activationStepsDone.includes("confirm-profile") && s.activationStepsDone.includes("confirm-hours");
}
