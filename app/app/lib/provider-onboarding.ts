"use client";

// Prototype-only: there is no backend, so "has this provider activated their
// account?" is remembered in localStorage. The /provider gate reads it to decide
// between the invitation/onboarding flow and the portal itself.

const KEY = "practmd.provider.onboarded";

export function isProviderOnboarded(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function markProviderOnboarded(): void {
  try {
    window.localStorage.setItem(KEY, "1");
  } catch {
    /* ignore — private mode, etc. */
  }
}

export function resetProviderOnboarding(): void {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
