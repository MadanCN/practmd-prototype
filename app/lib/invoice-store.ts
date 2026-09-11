"use client";

// Patient-facing invoices — copays collected at check-in, self-pay balances,
// and patient-responsibility balances left over after a payer adjudicates a
// claim (see claim-store.ts). This is the "money owed by the patient" ledger;
// claim-store.ts is the parallel "money owed by the payer" ledger. A visit
// can produce either or both, which is what lets self-pay, copay-then-claim,
// and post-denial patient billing all share one Collect Payment flow.

import { useSyncExternalStore } from "react";
import { createPersistedStore } from "@/lib/persist";
import { getCard, type SavedCard } from "@/lib/payment-methods-store";

export type InvoiceType = "copay" | "self-pay" | "patient-responsibility" | "no-show-fee" | "late-cancel-fee";
export type InvoiceStatus = "unpaid" | "partially-paid" | "paid" | "refunded" | "void";
export type PaymentMethodKind = "saved-card" | "new-card" | "cash" | "check" | "other";
export type CollectionPoint = "pre-checkin" | "post-checkin" | "post-visit" | "revenue-cycle";

export interface InvoiceLineItem {
  description: string;
  amount: number;
}

export interface Payment {
  id: string;
  amount: number;
  method: PaymentMethodKind;
  cardId?: string;
  cardSummary?: string; // e.g. "Visa •••• 4242" — snapshotted so history survives card removal
  note?: string;
  collectionPoint: CollectionPoint;
  collectedAt: string;
  collectedBy: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  chargeId?: string;
  claimId?: string;
  type: InvoiceType;
  lineItems: InvoiceLineItem[];
  subtotal: number;
  payments: Payment[];
  amountPaid: number;
  amountDue: number;
  status: InvoiceStatus;
  createdAt: string;
  createdBy: string;
  dueDate?: string;
  note?: string;
}

interface StoreState {
  invoices: Invoice[];
}

function now() { return new Date().toISOString(); }
function genId(prefix: string) { return `${prefix}_${Math.random().toString(36).slice(2, 9)}`; }
function round2(n: number) { return Math.round(n * 100) / 100; }

const store = createPersistedStore<StoreState>({
  key: "invoice-store",
  initial: { invoices: [] },
  revive: (raw, initial) => ({ invoices: (raw as StoreState)?.invoices ?? initial.invoices }),
});

function set(updater: (s: StoreState) => StoreState) {
  store.set(updater);
}

export function useInvoiceStore() {
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getServerSnapshot);
}

export function getInvoices(): Invoice[] {
  return store.get().invoices;
}

export function getInvoicesForPatient(patientId: string): Invoice[] {
  return store.get().invoices.filter((i) => i.patientId === patientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getInvoicesForAppointment(appointmentId: string): Invoice[] {
  return store.get().invoices.filter((i) => i.appointmentId === appointmentId);
}

export function getInvoice(id: string): Invoice | undefined {
  return store.get().invoices.find((i) => i.id === id);
}

function deriveStatus(subtotal: number, amountPaid: number): InvoiceStatus {
  if (amountPaid <= 0) return "unpaid";
  if (amountPaid >= subtotal) return "paid";
  return "partially-paid";
}

export interface CreateInvoiceInput {
  patientId: string;
  patientName: string;
  appointmentId?: string;
  chargeId?: string;
  claimId?: string;
  type: InvoiceType;
  lineItems: InvoiceLineItem[];
  createdBy: string;
  dueDate?: string;
  note?: string;
}

export function createInvoice(input: CreateInvoiceInput): Invoice {
  const subtotal = round2(input.lineItems.reduce((s, l) => s + l.amount, 0));
  const invoice: Invoice = {
    id: genId("inv"),
    patientId: input.patientId,
    patientName: input.patientName,
    appointmentId: input.appointmentId,
    chargeId: input.chargeId,
    claimId: input.claimId,
    type: input.type,
    lineItems: input.lineItems,
    subtotal,
    payments: [],
    amountPaid: 0,
    amountDue: subtotal,
    status: deriveStatus(subtotal, 0),
    createdAt: now(),
    createdBy: input.createdBy,
    dueDate: input.dueDate,
    note: input.note,
  };
  set((s) => ({ invoices: [invoice, ...s.invoices] }));
  return invoice;
}

export interface RecordPaymentInput {
  invoiceId: string;
  amount: number;
  method: PaymentMethodKind;
  cardId?: string;
  note?: string;
  collectionPoint: CollectionPoint;
  collectedBy: string;
}

/** Records a payment against an invoice — full or partial. Simulates the
 *  card-charge round trip when paying by (saved or new) card. */
export async function recordPayment(input: RecordPaymentInput): Promise<Invoice> {
  if (input.method === "saved-card" || input.method === "new-card") {
    await new Promise((r) => setTimeout(r, 1100)); // simulated Stripe PaymentIntent confirm
  }
  const card: SavedCard | undefined = input.cardId ? getCard(input.cardId) : undefined;
  const payment: Payment = {
    id: genId("pay"),
    amount: round2(input.amount),
    method: input.method,
    cardId: input.cardId,
    cardSummary: card ? `${card.brand[0].toUpperCase()}${card.brand.slice(1)} •••• ${card.last4}` : undefined,
    note: input.note,
    collectionPoint: input.collectionPoint,
    collectedAt: now(),
    collectedBy: input.collectedBy,
  };

  let updated: Invoice | undefined;
  set((s) => ({
    invoices: s.invoices.map((inv) => {
      if (inv.id !== input.invoiceId) return inv;
      const amountPaid = round2(inv.amountPaid + payment.amount);
      const next: Invoice = {
        ...inv,
        payments: [...inv.payments, payment],
        amountPaid,
        amountDue: round2(Math.max(0, inv.subtotal - amountPaid)),
        status: deriveStatus(inv.subtotal, amountPaid),
      };
      updated = next;
      return next;
    }),
  }));
  if (!updated) throw new Error(`Invoice ${input.invoiceId} not found`);
  return updated;
}

export function voidInvoice(invoiceId: string, reason: string) {
  set((s) => ({
    invoices: s.invoices.map((inv) => inv.id === invoiceId ? { ...inv, status: "void", note: [inv.note, `Voided: ${reason}`].filter(Boolean).join(" — ") } : inv),
  }));
}

export function refundInvoice(invoiceId: string, amount: number, reason: string, refundedBy: string) {
  set((s) => ({
    invoices: s.invoices.map((inv) => {
      if (inv.id !== invoiceId) return inv;
      const refundPayment: Payment = {
        id: genId("pay"), amount: -round2(amount), method: "other",
        note: `Refund — ${reason}`, collectionPoint: "revenue-cycle", collectedAt: now(), collectedBy: refundedBy,
      };
      const amountPaid = round2(inv.amountPaid - amount);
      return {
        ...inv,
        payments: [...inv.payments, refundPayment],
        amountPaid,
        amountDue: round2(Math.max(0, inv.subtotal - amountPaid)),
        status: amountPaid <= 0 ? "refunded" : "partially-paid",
      };
    }),
  }));
}

export function totalOutstandingForPatient(patientId: string): number {
  return round2(getInvoicesForPatient(patientId).filter((i) => i.status !== "void" && i.status !== "refunded").reduce((s, i) => s + i.amountDue, 0));
}
