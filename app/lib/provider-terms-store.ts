"use client";

// Global Masters → Users & Access → Providers → Provider Terms & Conditions.
//
// Unlike most Global Masters screens (which are decorative — local component
// state, no read outside their own screen; see docs/global-masters-settings-
// reference.md), this one has a real, named effect: turning it on enables the
// "accept terms" step in the provider account-setup flow
// (components/provider-staff/InviteLanding.tsx), which shows this exact
// content. So it's a real persisted store, not local state, and it's read
// from a completely different route.

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";

export interface ProviderTermsState {
  required: boolean;
  content: string;
}

const DEFAULT_CONTENT = `Acceptable Use Policy

As a provider on this platform, you agree to:
- Access only the patient records necessary for the care you're providing.
- Keep your login credentials confidential and never share your account.
- Document encounters accurately and sign notes in a timely manner.
- Report any suspected security incident or unauthorized access immediately.

This platform is provided for clinical and administrative use by [Clinic Name] providers and staff only. Misuse may result in account suspension and is reportable to your credentialing body where required by law.`;

const INITIAL: ProviderTermsState = { required: false, content: DEFAULT_CONTENT };

const store = createPersistedStore<ProviderTermsState>({
  key: "provider-terms",
  initial: INITIAL,
  revive: (raw, initial) => ({ ...initial, ...(raw as object) }),
});

export function useProviderTerms(): ProviderTermsState {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function getProviderTerms(): ProviderTermsState {
  return store.get();
}

export function setProviderTermsRequired(required: boolean) {
  store.set((s) => ({ ...s, required }));
}

export function setProviderTermsContent(content: string) {
  store.set((s) => ({ ...s, content }));
}
