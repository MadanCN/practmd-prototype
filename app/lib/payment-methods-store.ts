"use client";

// Saved payment methods, per patient — a simulated Stripe Elements /
// SetupIntent flow. This prototype has no backend, so nothing is sent over
// the network: card numbers are never stored, only the Stripe-style
// "returned" shape (brand, last4, exp, a mock PaymentMethod id) — exactly
// what a real integration would keep after tokenizing with Stripe.js.

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";

export type CardBrand = "visa" | "mastercard" | "amex" | "discover";

export interface SavedCard {
  id: string;
  patientId: string;
  stripePaymentMethodId: string; // mock, e.g. "pm_mock_9f2a..."
  brand: CardBrand;
  last4: string;
  expMonth: number;
  expYear: number;
  nameOnCard: string;
  billingZip: string;
  isDefault: boolean;
  addedAt: string;
  addedBy: string;
}

interface StoreState {
  cards: SavedCard[];
}

function genId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function detectBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return "visa";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|5)/.test(digits)) return "discover";
  return "mastercard";
}

// A couple of demo patients arrive with a card already on file.
function seed(): SavedCard[] {
  return [
    { id: "card_seed1", patientId: "pt02", stripePaymentMethodId: "pm_mock_a1b2c3d4", brand: "visa", last4: "4242", expMonth: 11, expYear: 2028, nameOnCard: "Elena Vasquez", billingZip: "14526", isDefault: true, addedAt: new Date(Date.now() - 40 * 86400000).toISOString(), addedBy: "Elena Vasquez (patient portal)" },
    { id: "card_seed2", patientId: "pt07", stripePaymentMethodId: "pm_mock_e5f6g7h8", brand: "mastercard", last4: "4444", expMonth: 3, expYear: 2027, nameOnCard: "Robert Flynn", billingZip: "14526", isDefault: true, addedAt: new Date(Date.now() - 90 * 86400000).toISOString(), addedBy: "Front desk — Jordan Lee" },
  ];
}

const store = createPersistedStore<StoreState>({
  key: "payment-methods-store",
  initial: { cards: seed() },
  revive: (raw, initial) => {
    const p = (raw as StoreState)?.cards ?? [];
    const seedIds = new Set(initial.cards.map((c) => c.id));
    return { cards: [...p, ...initial.cards.filter((c) => !p.some((x) => x.id === c.id) && seedIds.has(c.id))] };
  },
});

function set(updater: (s: StoreState) => StoreState) {
  store.set(updater);
}

export function usePaymentMethodsStore() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function getCardsForPatient(patientId: string): SavedCard[] {
  return store.get().cards.filter((c) => c.patientId === patientId).sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
}

export function getDefaultCard(patientId: string): SavedCard | undefined {
  return getCardsForPatient(patientId).find((c) => c.isDefault) ?? getCardsForPatient(patientId)[0];
}

export function getCard(cardId: string): SavedCard | undefined {
  return store.get().cards.find((c) => c.id === cardId);
}

export interface NewCardInput {
  patientId: string;
  cardNumber: string; // simulated Stripe Elements field — never persisted raw
  expMonth: number;
  expYear: number;
  nameOnCard: string;
  billingZip: string;
  addedBy: string;
}

/** Simulates Stripe.js tokenizing the card + a SetupIntent confirm round-trip. */
export async function addCard(input: NewCardInput): Promise<SavedCard> {
  await new Promise((r) => setTimeout(r, 900));
  const digits = input.cardNumber.replace(/\D/g, "");
  const isFirst = getCardsForPatient(input.patientId).length === 0;
  const card: SavedCard = {
    id: genId("card"),
    patientId: input.patientId,
    stripePaymentMethodId: genId("pm_mock"),
    brand: detectBrand(digits),
    last4: digits.slice(-4).padStart(4, "0"),
    expMonth: input.expMonth,
    expYear: input.expYear,
    nameOnCard: input.nameOnCard,
    billingZip: input.billingZip,
    isDefault: isFirst,
    addedAt: new Date().toISOString(),
    addedBy: input.addedBy,
  };
  set((s) => ({ cards: [...s.cards, card] }));
  return card;
}

export function setDefaultCard(patientId: string, cardId: string) {
  set((s) => ({
    cards: s.cards.map((c) => (c.patientId === patientId ? { ...c, isDefault: c.id === cardId } : c)),
  }));
}

export function removeCard(cardId: string) {
  set((s) => {
    const removed = s.cards.find((c) => c.id === cardId);
    const rest = s.cards.filter((c) => c.id !== cardId);
    if (removed?.isDefault) {
      const next = rest.find((c) => c.patientId === removed.patientId);
      if (next) return { cards: rest.map((c) => (c.id === next.id ? { ...c, isDefault: true } : c)) };
    }
    return { cards: rest };
  });
}
