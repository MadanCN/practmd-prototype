"use client";

// Shared "how is this being paid" control — saved cards, add-a-new-card
// (styled like Stripe Elements, but nothing leaves the browser: see
// lib/payment-methods-store.ts), cash, check, or other. Used by
// CollectPaymentModal and by the Patient 360 Billing tab's card manager.

import { useState } from "react";
import { CreditCard, Plus, Banknote, FileCheck, MoreHorizontal, Check, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { getCardsForPatient, addCard, type SavedCard, type CardBrand } from "@/lib/payment-methods-store";

const BRAND_LABEL: Record<CardBrand, string> = { visa: "Visa", mastercard: "Mastercard", amex: "Amex", discover: "Discover" };

export type PaymentChoice =
  | { method: "saved-card"; cardId: string }
  | { method: "new-card"; draft: NewCardDraft }
  | { method: "cash" }
  | { method: "check" }
  | { method: "other" };

export interface NewCardDraft {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  nameOnCard: string;
  billingZip: string;
}

function CardRow({ card, selected, onSelect }: { card: SavedCard; selected: boolean; onSelect: () => void }) {
  return (
    <button onClick={onSelect} type="button"
      className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors",
        selected ? "border-brand-400 bg-brand-50 dark:bg-brand-950/20" : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50")}>
      <div className="w-9 h-6 rounded bg-slate-800 dark:bg-slate-700 flex items-center justify-center shrink-0">
        <CreditCard className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{BRAND_LABEL[card.brand]} •••• {card.last4}</p>
        <p className="text-xs text-slate-400">Exp {card.expMonth.toString().padStart(2, "0")}/{card.expYear} · {card.nameOnCard}</p>
      </div>
      {card.isDefault && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 shrink-0">Default</span>}
      {selected && <Check className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0" />}
    </button>
  );
}

function fmtCardNumber(v: string) {
  const digits = v.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function NewCardForm({ draft, onChange }: { draft: NewCardDraft; onChange: (d: NewCardDraft) => void }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-3.5 space-y-3 bg-slate-50/60 dark:bg-slate-800/30">
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5" /> Simulated Stripe Elements — no card data is transmitted or stored in this prototype.
      </div>
      <div>
        <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Card number</label>
        <input value={fmtCardNumber(draft.cardNumber)} onChange={(e) => onChange({ ...draft, cardNumber: e.target.value })}
          placeholder="4242 4242 4242 4242" inputMode="numeric"
          className="mt-1 w-full px-3 py-2 rounded-lg text-sm font-mono border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Month</label>
          <select value={draft.expMonth} onChange={(e) => onChange({ ...draft, expMonth: Number(e.target.value) })}
            className="mt-1 w-full px-2 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => <option key={m} value={m}>{m.toString().padStart(2, "0")}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Year</label>
          <select value={draft.expYear} onChange={(e) => onChange({ ...draft, expYear: Number(e.target.value) })}
            className="mt-1 w-full px-2 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">CVC</label>
          <input placeholder="•••" maxLength={4} className="mt-1 w-full px-2 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Name on card</label>
          <input value={draft.nameOnCard} onChange={(e) => onChange({ ...draft, nameOnCard: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </div>
        <div>
          <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Billing ZIP</label>
          <input value={draft.billingZip} onChange={(e) => onChange({ ...draft, billingZip: e.target.value })}
            className="mt-1 w-full px-3 py-2 rounded-lg text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
        </div>
      </div>
    </div>
  );
}

export function isChoiceValid(choice: PaymentChoice | null): boolean {
  if (!choice) return false;
  if (choice.method === "new-card") {
    const d = choice.draft;
    return d.cardNumber.replace(/\D/g, "").length >= 12 && !!d.nameOnCard.trim() && d.billingZip.trim().length >= 5;
  }
  return true;
}

export default function PaymentMethodPicker({ patientId, value, onChange }: {
  patientId: string;
  value: PaymentChoice | null;
  onChange: (choice: PaymentChoice) => void;
}) {
  const [addingNew, setAddingNew] = useState(false);
  const cards = getCardsForPatient(patientId);
  const defaultDraft: NewCardDraft = { cardNumber: "", expMonth: 1, expYear: new Date().getFullYear() + 3, nameOnCard: "", billingZip: "" };

  const tab = (method: PaymentChoice["method"], icon: React.ElementType, label: string) => {
    const Icon = icon;
    const active = value?.method === method || (method === "new-card" && addingNew);
    return (
      <button type="button" onClick={() => {
        if (method === "new-card") { setAddingNew(true); onChange({ method: "new-card", draft: defaultDraft }); }
        else { setAddingNew(false); onChange(method === "cash" ? { method: "cash" } : method === "check" ? { method: "check" } : { method: "other" }); }
      }}
        className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors",
          active ? "bg-brand-600 border-brand-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800")}>
        <Icon className="w-3.5 h-3.5" /> {label}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {cards.length > 0 && !addingNew && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Saved cards</p>
          {cards.map((c) => (
            <CardRow key={c.id} card={c} selected={value?.method === "saved-card" && value.cardId === c.id} onSelect={() => onChange({ method: "saved-card", cardId: c.id })} />
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tab("new-card", Plus, cards.length > 0 ? "New card" : "Card")}
        {tab("cash", Banknote, "Cash")}
        {tab("check", FileCheck, "Check")}
        {tab("other", MoreHorizontal, "Other")}
      </div>

      {addingNew && value?.method === "new-card" && (
        <NewCardForm draft={value.draft} onChange={(d) => onChange({ method: "new-card", draft: d })} />
      )}
    </div>
  );
}

export async function resolveAndMaybeSaveCard(patientId: string, choice: PaymentChoice, addedBy: string, saveForFuture: boolean): Promise<string | undefined> {
  if (choice.method !== "new-card" || !saveForFuture) return choice.method === "saved-card" ? choice.cardId : undefined;
  const card = await addCard({ patientId, cardNumber: choice.draft.cardNumber, expMonth: choice.draft.expMonth, expYear: choice.draft.expYear, nameOnCard: choice.draft.nameOnCard, billingZip: choice.draft.billingZip, addedBy });
  return card.id;
}
