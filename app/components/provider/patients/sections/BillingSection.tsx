"use client";

import { useState } from "react";
import {
  CreditCard, Plus, Trash2, Star, X, Loader2, ShieldCheck, Receipt, FileStack, ChevronRight,
} from "lucide-react";
import Link from "next/link";
import type { PatientProfile } from "@/data/provider-patients";
import { cn } from "@/lib/utils";
import {
  usePaymentMethodsStore, getCardsForPatient, addCard, removeCard, setDefaultCard, type CardBrand,
} from "@/lib/payment-methods-store";
import { useInvoiceStore, getInvoicesForPatient, totalOutstandingForPatient, type Invoice, type InvoiceStatus } from "@/lib/invoice-store";
import { useClaimStore, getClaimsForPatient, buildCms1500, type Claim, type ClaimStatus } from "@/lib/claim-store";
import CollectPaymentModal from "@/components/billing/CollectPaymentModal";
import Drawer from "@/components/ui/Drawer";
import Cms1500Form from "@/components/revenue-management/Cms1500Form";

const BRAND_LABEL: Record<CardBrand, string> = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover" };

const INVOICE_STATUS_CFG: Record<InvoiceStatus, { label: string; cls: string }> = {
  unpaid: { label: "Unpaid", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  "partially-paid": { label: "Partially Paid", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  refunded: { label: "Refunded", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  void: { label: "Void", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

const CLAIM_STATUS_CFG: Record<ClaimStatus, { label: string; cls: string }> = {
  draft: { label: "Draft", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
  "scrub-failed": { label: "Scrub Failed", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  "ready-to-send": { label: "Ready to Send", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  submitted: { label: "Submitted", cls: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" },
  paid: { label: "Paid", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" },
  "partially-paid": { label: "Partially Paid", cls: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" },
  denied: { label: "Denied", cls: "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400" },
  appealed: { label: "Appealed", cls: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-400" },
  closed: { label: "Closed", cls: "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function AddCardModal({ patientId, onClose, onAdded }: { patientId: string; onClose: () => void; onAdded: () => void }) {
  const [cardNumber, setCardNumber] = useState("");
  const [expMonth, setExpMonth] = useState(1);
  const [expYear, setExpYear] = useState(new Date().getFullYear() + 3);
  const [nameOnCard, setNameOnCard] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = cardNumber.replace(/\D/g, "").length >= 12 && nameOnCard.trim() && billingZip.trim().length >= 5;

  async function submit() {
    setBusy(true);
    await addCard({ patientId, cardNumber, expMonth, expYear, nameOnCard, billingZip, addedBy: "Care Coordinator" });
    setBusy(false);
    onAdded();
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">Add a card</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-slate-400" /></button>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-3">
          <ShieldCheck className="w-3.5 h-3.5" /> Simulated Stripe Elements — no card data leaves this browser in the prototype.
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Card number</label>
            <input value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4242 4242 4242 4242" inputMode="numeric"
              className="mt-1 w-full px-3 py-2 rounded-lg text-sm font-mono border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Exp month</label>
              <select value={expMonth} onChange={(e) => setExpMonth(Number(e.target.value))} className="mt-1 w-full px-2 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Exp year</label>
              <select value={expYear} onChange={(e) => setExpYear(Number(e.target.value))} className="mt-1 w-full px-2 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950">
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Name on card</label>
            <input value={nameOnCard} onChange={(e) => setNameOnCard(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
          </div>
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Billing ZIP</label>
            <input value={billingZip} onChange={(e) => setBillingZip(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950" />
          </div>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-semibold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Cancel</button>
          <button onClick={submit} disabled={!valid || busy} className="px-4 py-2 rounded-lg text-sm font-semibold practmd-gradient text-white disabled:opacity-40 flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Save card
          </button>
        </div>
      </div>
    </div>
  );
}

function ClaimDrawer({ claim, onClose }: { claim: Claim; onClose: () => void }) {
  const { data } = buildCms1500(claim);
  return (
    <Drawer open onClose={onClose} title={`Claim ${claim.id}`} description={`${CLAIM_STATUS_CFG[claim.status].label} · $${claim.totalCharge.toFixed(2)}`} width="w-[720px]">
      <div className="space-y-4">
        {claim.payerResponse && (
          <div className={cn("rounded-xl border p-3.5 text-sm",
            claim.payerResponse.outcome === "paid" ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20"
              : claim.payerResponse.outcome === "partial" ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
              : "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20")}>
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Payer {claim.payerResponse.outcome === "paid" ? "paid in full" : claim.payerResponse.outcome === "partial" ? "paid partially" : "denied this claim"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Allowed ${claim.payerResponse.allowedAmount.toFixed(2)} · Paid ${claim.payerResponse.paidAmount.toFixed(2)} · Patient responsibility ${claim.payerResponse.patientResponsibility.toFixed(2)}
            </p>
            {claim.payerResponse.denialReason && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{claim.payerResponse.denialReason}</p>}
          </div>
        )}
        <div className="overflow-x-auto">
          <Cms1500Form data={data} />
        </div>
        <Link href="/revenue-management/claims" className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1">
          Manage in Revenue Cycle <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Drawer>
  );
}

export function BillingSection({ patient }: { patient: PatientProfile }) {
  usePaymentMethodsStore();
  useInvoiceStore();
  useClaimStore();
  const [addingCard, setAddingCard] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [viewingClaim, setViewingClaim] = useState<Claim | null>(null);

  const cards = getCardsForPatient(patient.id);
  const invoices = getInvoicesForPatient(patient.id);
  const claims = getClaimsForPatient(patient.id);
  const outstanding = totalOutstandingForPatient(patient.id);

  return (
    <div className="space-y-6">
      {outstanding > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">${outstanding.toFixed(2)} outstanding balance</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Across all unpaid and partially-paid invoices.</p>
          </div>
        </div>
      )}

      {/* Payment methods */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Saved payment methods</p>
          <button onClick={() => setAddingCard(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold practmd-gradient text-white">
            <Plus className="w-3.5 h-3.5" /> Add card
          </button>
        </div>
        {cards.length === 0 ? (
          <p className="text-sm text-slate-400 py-6 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">No cards on file.</p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {cards.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 flex items-center gap-3">
                <div className="w-10 h-7 rounded bg-slate-800 dark:bg-slate-700 flex items-center justify-center shrink-0"><CreditCard className="w-4 h-4 text-white" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{BRAND_LABEL[c.brand]} •••• {c.last4}{c.isDefault && <span className="ml-1.5 text-[10px] font-semibold text-brand-600 dark:text-brand-400">DEFAULT</span>}</p>
                  <p className="text-xs text-slate-400">Exp {c.expMonth.toString().padStart(2, "0")}/{c.expYear} · Added {fmtDate(c.addedAt)}</p>
                </div>
                {!c.isDefault && (
                  <button title="Make default" onClick={() => setDefaultCard(patient.id, c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800"><Star className="w-3.5 h-3.5" /></button>
                )}
                <button title="Remove card" onClick={() => removeCard(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invoices */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5" /> Invoices & payments</p>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          {invoices.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No invoices yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {invoices.map((inv) => {
                const sc = INVOICE_STATUS_CFG[inv.status];
                return (
                  <div key={inv.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 capitalize">{inv.type.replace(/-/g, " ")}</p>
                      <p className="text-xs text-slate-400 truncate">{inv.lineItems.map((l) => l.description).join(", ")} · {fmtDate(inv.createdAt)}</p>
                      {inv.payments.length > 0 && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {inv.payments.filter(p => p.amount > 0).map((p) => `$${p.amount.toFixed(2)} via ${p.method === "saved-card" || p.method === "new-card" ? p.cardSummary ?? "card" : p.method}`).join(" + ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">${inv.subtotal.toFixed(2)}</p>
                      {inv.amountDue > 0 && inv.status !== "void" && <p className="text-xs text-amber-600 dark:text-amber-400">${inv.amountDue.toFixed(2)} due</p>}
                    </div>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", sc.cls)}>{sc.label}</span>
                    {inv.amountDue > 0 && inv.status !== "void" && (
                      <button onClick={() => setPayingInvoice(inv)} className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline shrink-0">Collect</button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Claims */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5"><FileStack className="w-3.5 h-3.5" /> Claims</p>
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
          {claims.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-400">No claims filed for this patient yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {claims.map((c) => {
                const sc = CLAIM_STATUS_CFG[c.status];
                return (
                  <button key={c.id} onClick={() => setViewingClaim(c)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Claim {c.id}</p>
                      <p className="text-xs text-slate-400">Created {fmtDate(c.createdAt)}{c.submittedAt ? ` · Submitted ${fmtDate(c.submittedAt)}` : ""}</p>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 shrink-0">${c.totalCharge.toFixed(2)}</p>
                    <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0", sc.cls)}>{sc.label}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {addingCard && <AddCardModal patientId={patient.id} onClose={() => setAddingCard(false)} onAdded={() => setAddingCard(false)} />}
      {payingInvoice && (
        <CollectPaymentModal
          patientId={patient.id} patientName={patient.displayName}
          collectionPoint="revenue-cycle" collectedBy="Care Coordinator"
          existingInvoice={payingInvoice}
          onClose={() => setPayingInvoice(null)}
          onDone={() => setPayingInvoice(null)}
        />
      )}
      {viewingClaim && <ClaimDrawer claim={viewingClaim} onClose={() => setViewingClaim(null)} />}
    </div>
  );
}
