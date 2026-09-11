"use client";

// One modal for every "collect money from the patient" scenario in the app:
// copay before or after check-in, full self-pay, an existing
// patient-responsibility balance left after a payer's ERA, or a partial
// payment today with the rest billed later. Called from the appointment
// check-in flow, the appointment detail drawer, and the Patient 360 Billing
// tab — every caller just describes what's owed and where in the workflow
// it's being collected (CollectionPoint), and this modal creates/updates the
// Invoice and records the Payment.

import { useState } from "react";
import { X, CheckCircle2, Loader2, Receipt, AlertTriangle } from "lucide-react";
import PaymentMethodPicker, { type PaymentChoice, isChoiceValid, resolveAndMaybeSaveCard } from "./PaymentMethodPicker";
import {
  createInvoice, recordPayment, type Invoice, type InvoiceType, type CollectionPoint, type InvoiceLineItem,
} from "@/lib/invoice-store";

interface Props {
  patientId: string;
  patientName: string;
  collectionPoint: CollectionPoint;
  collectedBy: string;
  onClose: () => void;
  onDone: (invoice: Invoice) => void;
  /** Pay against an existing invoice (e.g. a patient-responsibility balance from a denied/partial claim). */
  existingInvoice?: Invoice;
  /** Otherwise, create a new invoice from these line items. */
  newInvoice?: { type: InvoiceType; lineItems: InvoiceLineItem[]; appointmentId?: string; chargeId?: string; title: string; subtitle?: string };
}

export default function CollectPaymentModal({ patientId, patientName, collectionPoint, collectedBy, onClose, onDone, existingInvoice, newInvoice }: Props) {
  const owed = existingInvoice ? existingInvoice.amountDue : (newInvoice?.lineItems.reduce((s, l) => s + l.amount, 0) ?? 0);
  const [amount, setAmount] = useState(owed.toFixed(2));
  const [choice, setChoice] = useState<PaymentChoice | null>(null);
  const [saveCard, setSaveCard] = useState(true);
  const [billLater, setBillLater] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numAmount = parseFloat(amount) || 0;
  const isPartial = !billLater && numAmount > 0 && numAmount < owed - 0.005;
  const canSubmit = billLater || (numAmount > 0 && numAmount <= owed + 0.005 && isChoiceValid(choice));

  async function handleSubmit() {
    setBusy(true);
    setError(null);
    try {
      let invoice = existingInvoice;
      if (!invoice) {
        if (!newInvoice) throw new Error("No invoice context provided.");
        invoice = createInvoice({
          patientId, patientName,
          appointmentId: newInvoice.appointmentId, chargeId: newInvoice.chargeId,
          type: newInvoice.type, lineItems: newInvoice.lineItems, createdBy: collectedBy,
        });
      }

      if (billLater) {
        setDone(true);
        onDone(invoice);
        return;
      }

      if (!choice) throw new Error("Choose a payment method.");
      const cardId = await resolveAndMaybeSaveCard(patientId, choice, collectedBy, saveCard);
      const method = choice.method === "new-card" ? (saveCard ? "saved-card" : "new-card") : choice.method;
      const updated = await recordPayment({
        invoiceId: invoice.id, amount: numAmount, method,
        cardId: method === "saved-card" ? cardId : undefined,
        collectionPoint, collectedBy,
      });
      setDone(true);
      onDone(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment failed — please try again.");
    } finally {
      setBusy(false);
    }
  }

  const title = existingInvoice ? "Collect balance due" : (newInvoice?.title ?? "Collect payment");
  const subtitle = existingInvoice
    ? `${patientName} · Invoice ${existingInvoice.id}`
    : `${patientName}${newInvoice?.subtitle ? ` · ${newInvoice.subtitle}` : ""}`;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={busy ? undefined : onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-600 dark:text-brand-400" /> {title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          </div>
          <button onClick={onClose} disabled={busy} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-40">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {billLater ? "Invoice created — billing patient later" : `$${numAmount.toFixed(2)} collected`}
            </p>
            <p className="text-xs text-slate-400 mt-1">{billLater ? "No payment collected yet. This balance now shows on the patient's Billing tab." : "A receipt has been added to the patient's Billing tab."}</p>
            <button onClick={onClose} className="mt-5 px-4 py-2 rounded-lg text-sm font-semibold practmd-gradient text-white">Done</button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 p-3.5">
                {!existingInvoice && newInvoice && (
                  <div className="space-y-1 mb-2 pb-2 border-b border-slate-200 dark:border-slate-700">
                    {newInvoice.lineItems.map((l, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span>{l.description}</span><span>${l.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Amount due</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-slate-100">${owed.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Collect now</label>
                <div className="mt-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
                  <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))} disabled={billLater}
                    className="w-full pl-6 pr-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-40" />
                </div>
                {isPartial && <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">Partial payment — ${(owed - numAmount).toFixed(2)} will remain due.</p>}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={billLater} onChange={(e) => setBillLater(e.target.checked)} className="accent-brand-600 w-4 h-4" />
                <span className="text-sm text-slate-700 dark:text-slate-300">Don&apos;t collect now — bill the patient later</span>
              </label>

              {!billLater && (
                <>
                  <PaymentMethodPicker patientId={patientId} value={choice} onChange={setChoice} />
                  {choice?.method === "new-card" && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={saveCard} onChange={(e) => setSaveCard(e.target.checked)} className="accent-brand-600 w-4 h-4" />
                      <span className="text-xs text-slate-600 dark:text-slate-400">Save this card to the patient&apos;s profile for future visits</span>
                    </label>
                  )}
                </>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-400">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {error}
                </div>
              )}
            </div>

            <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-800 shrink-0 flex gap-3">
              <button onClick={onClose} disabled={busy} className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={!canSubmit || busy}
                className="flex-1 py-2.5 rounded-lg practmd-gradient text-white text-sm font-semibold disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {busy ? "Processing…" : billLater ? "Create invoice" : `Collect $${numAmount.toFixed(2)}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
