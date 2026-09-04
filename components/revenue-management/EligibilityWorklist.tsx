"use client";

import { useMemo, useState } from "react";
import {
  ClipboardCheck, Search, X, Clock3, ShieldAlert, Phone, Globe, Building2,
  CheckCircle2, XCircle, HelpCircle, PauseCircle, Wallet, History, ChevronRight,
} from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { cn } from "@/lib/utils";
import {
  useOnboardingStore, pickWorklistItem, setVerificationChannel, resolveVerification,
  placeOnHold, receiveMissingInfo, markUnableToVerify, convertToSelfPay, reverify,
  expireCoverage, setCarveOut, RCM_ASSIGNEES,
  type EligibilityWorklistItem, type EligibilityState,
} from "@/lib/onboarding-store";

const STATE_LABELS: Record<EligibilityState, string> = {
  "pending": "Pending",
  "in-progress": "In Progress",
  "on-hold": "On Hold",
  "verified-active": "Verified - Active",
  "verified-inactive": "Verified - Inactive",
  "verified-not-covered": "Verified - Not Covered",
  "unable-to-verify": "Unable to Verify",
  "self-pay-confirmed": "Self-Pay Confirmed",
  "expired": "Expired",
};

const STATE_COLORS: Record<EligibilityState, string> = {
  "pending": "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  "in-progress": "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  "on-hold": "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400",
  "verified-active": "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  "verified-inactive": "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  "verified-not-covered": "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
  "unable-to-verify": "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
  "self-pay-confirmed": "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  "expired": "bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400",
};

const FILTERS: { id: string; label: string; match: (s: EligibilityState) => boolean }[] = [
  { id: "all", label: "All", match: () => true },
  { id: "pending", label: "Pending", match: (s) => s === "pending" },
  { id: "in-progress", label: "In Progress", match: (s) => s === "in-progress" },
  { id: "on-hold", label: "On Hold", match: (s) => s === "on-hold" },
  { id: "resolved", label: "Resolved", match: (s) => ["verified-active", "verified-inactive", "verified-not-covered", "self-pay-confirmed"].includes(s) },
  { id: "attention", label: "Needs Attention", match: (s) => ["unable-to-verify", "expired"].includes(s) },
];

function StateBadge({ state }: { state: EligibilityState }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold", STATE_COLORS[state])}>
      {STATE_LABELS[state]}
    </span>
  );
}

function StatTile({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex-1 min-w-[110px] p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
      <p className={cn("text-2xl font-bold", color)}>{value}</p>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

const channelBtn = (active: boolean) => cn(
  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
  active ? "bg-blue-600 border-blue-600 text-white" : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
);

const actionBtn = (tone: "emerald" | "red" | "amber" | "slate" | "blue") => cn(
  "px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors",
  {
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    red: "bg-red-600 hover:bg-red-700 text-white",
    amber: "bg-amber-500 hover:bg-amber-600 text-white",
    slate: "bg-slate-600 hover:bg-slate-700 text-white",
    blue: "bg-blue-600 hover:bg-blue-700 text-white",
  }[tone]
);

function ItemDrawer({ item, onClose }: { item: EligibilityWorklistItem; onClose: () => void }) {
  const store = useOnboardingStore();
  const submission = store.submissions.find((s) => s.id === item.submissionId);
  const [onHoldReason, setOnHoldReason] = useState("");
  const [unableReason, setUnableReason] = useState("");
  const [carveVendor, setCarveVendor] = useState(item.carveOut?.vendor ?? "");
  const [carvePayerId, setCarvePayerId] = useState(item.carveOut?.payerId ?? "");
  const [carveNotes, setCarveNotes] = useState(item.carveOut?.notes ?? "");
  const [showCarveForm, setShowCarveForm] = useState(false);

  const live = store.worklist.find((w) => w.id === item.id) ?? item;

  return (
    <Drawer open onClose={onClose} title={live.patientName} description={`${live.payerName} · Member ID ${live.memberId}`} width="w-[520px]">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <StateBadge state={live.state} />
          {live.assignee && <span className="text-xs text-slate-400">Assigned to {live.assignee}</span>}
        </div>

        {/* Submission details */}
        {submission && (
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Cardholder", val: submission.insurance ? `${submission.insurance.cardholderFirstName} ${submission.insurance.cardholderLastName}` : "—" },
              { label: "Relationship to Cardholder", val: submission.insurance?.relationshipToCardholder ?? "—" },
              { label: "Cardholder DOB", val: submission.insurance?.cardholderDob ?? "—" },
              { label: "Account Holder", val: submission.accountHolder ? `${submission.accountHolder.firstName} ${submission.accountHolder.lastName} (${submission.accountHolder.relationship})` : "—" },
              { label: "Card Front", val: submission.insurance?.cardFrontUploaded ? "Uploaded" : "Missing" },
              { label: "Card Back", val: submission.insurance?.cardBackUploaded ? "Uploaded" : "Missing" },
            ].map((f) => (
              <div key={f.label} className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{f.label}</p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 mt-0.5">{f.val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Carve-out */}
        <div className="p-4 rounded-xl border border-violet-200 dark:border-violet-900 bg-violet-50/40 dark:bg-violet-950/10">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-violet-800 dark:text-violet-300 mb-1">Carve-out redirect</p>
              <p className="text-[11px] text-violet-700/80 dark:text-violet-400/80 leading-relaxed mb-2">
                Some payers don&apos;t administer behavioral-health benefits themselves — they contract that service line out to a specialty vendor
                (e.g. Optum Behavioral Health sitting behind United Healthcare). If this applies, verify against the carve-out vendor&apos;s network,
                payer ID, and authorization rules — not the medical payer on the card.
              </p>
              {live.carveOut && !showCarveForm ? (
                <div className="text-xs text-violet-800 dark:text-violet-300 space-y-0.5">
                  <p><span className="font-semibold">Vendor:</span> {live.carveOut.vendor}</p>
                  <p><span className="font-semibold">Vendor Payer ID:</span> {live.carveOut.payerId}</p>
                  {live.carveOut.notes && <p className="opacity-80">{live.carveOut.notes}</p>}
                  <button onClick={() => setShowCarveForm(true)} className="text-[11px] font-semibold underline mt-1">Edit</button>
                </div>
              ) : showCarveForm ? (
                <div className="space-y-2">
                  <input value={carveVendor} onChange={(e) => setCarveVendor(e.target.value)} placeholder="Carve-out vendor name" className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900" />
                  <input value={carvePayerId} onChange={(e) => setCarvePayerId(e.target.value)} placeholder="Vendor payer ID" className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900" />
                  <textarea value={carveNotes} onChange={(e) => setCarveNotes(e.target.value)} placeholder="Notes" rows={2} className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900 resize-none" />
                  <button
                    onClick={() => { setCarveOut(live.id, { vendor: carveVendor, payerId: carvePayerId, notes: carveNotes }); setShowCarveForm(false); }}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold"
                  >
                    Save carve-out info
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowCarveForm(true)} className="text-[11px] font-semibold text-violet-700 dark:text-violet-400 underline">
                  Flag a carve-out for this case
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Actions per state */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Actions</p>

          {live.state === "pending" && (
            <div className="flex flex-wrap gap-2">
              {RCM_ASSIGNEES.map((name) => (
                <button key={name} onClick={() => pickWorklistItem(live.id, name)} className={actionBtn("blue")}>
                  Pick up as {name}
                </button>
              ))}
            </div>
          )}

          {live.state === "in-progress" && (
            <div className="space-y-4">
              <div>
                <p className="text-[11px] text-slate-400 mb-1.5">Verification channel</p>
                <div className="flex gap-2">
                  <button onClick={() => setVerificationChannel(live.id, "portal")} className={channelBtn(live.verificationChannel === "portal")}><Globe className="w-3.5 h-3.5" /> Portal</button>
                  <button onClick={() => setVerificationChannel(live.id, "phone")} className={channelBtn(live.verificationChannel === "phone")}><Phone className="w-3.5 h-3.5" /> Phone</button>
                  <button onClick={() => setVerificationChannel(live.id, "clearinghouse")} className={channelBtn(live.verificationChannel === "clearinghouse")}><Building2 className="w-3.5 h-3.5" /> Clearinghouse</button>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-1.5">Record outcome</p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => resolveVerification(live.id, "verified-active")} className={actionBtn("emerald")}><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />Verified - Active</button>
                  <button onClick={() => resolveVerification(live.id, "verified-inactive")} className={actionBtn("red")}><XCircle className="w-3.5 h-3.5 inline mr-1" />Verified - Inactive</button>
                  <button onClick={() => resolveVerification(live.id, "verified-not-covered")} className={actionBtn("red")}><XCircle className="w-3.5 h-3.5 inline mr-1" />Not Covered</button>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-1.5">Place on hold (info missing)</p>
                <div className="flex gap-2">
                  <input value={onHoldReason} onChange={(e) => setOnHoldReason(e.target.value)} placeholder="What's missing?" className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  <button disabled={!onHoldReason.trim()} onClick={() => placeOnHold(live.id, onHoldReason)} className={cn(actionBtn("amber"), !onHoldReason.trim() && "opacity-40 cursor-not-allowed")}><PauseCircle className="w-3.5 h-3.5 inline mr-1" />On Hold</button>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 mb-1.5">Unable to verify (payer unreachable / conflicting info)</p>
                <div className="flex gap-2">
                  <input value={unableReason} onChange={(e) => setUnableReason(e.target.value)} placeholder="Reason" className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" />
                  <button disabled={!unableReason.trim()} onClick={() => markUnableToVerify(live.id, unableReason)} className={cn(actionBtn("slate"), !unableReason.trim() && "opacity-40 cursor-not-allowed")}><HelpCircle className="w-3.5 h-3.5 inline mr-1" />Unable to Verify</button>
                </div>
              </div>
            </div>
          )}

          {live.state === "on-hold" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">On hold: {live.onHoldReason}</p>
              <button onClick={() => receiveMissingInfo(live.id)} className={actionBtn("blue")}>Info received — resume verification</button>
            </div>
          )}

          {live.state === "unable-to-verify" && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 dark:text-slate-400">Reason: {live.unableReason}</p>
              <button onClick={() => convertToSelfPay(live.id)} className={actionBtn("blue")}><Wallet className="w-3.5 h-3.5 inline mr-1" />Patient opts self-pay — confirm</button>
            </div>
          )}

          {(live.state === "verified-inactive" || live.state === "expired") && (
            <div className="space-y-2">
              <p className="text-xs text-slate-400">
                {live.state === "verified-inactive"
                  ? "Coverage is inactive. Resubmit once the patient has updated or confirmed their insurance."
                  : "This coverage window has lapsed and needs re-verification."}
              </p>
              <button onClick={() => reverify(live.id)} className={actionBtn("blue")}>Resubmit for re-verification</button>
            </div>
          )}

          {live.state === "verified-active" && (
            <div className="space-y-2">
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                Resolved — coverage confirmed active. The Care Coordinator has been notified to book the appointment.
              </p>
              <button onClick={() => expireCoverage(live.id)} className="text-xs text-slate-400 underline hover:text-slate-600">
                Simulate: termination date passed (demo)
              </button>
            </div>
          )}

          {(live.state === "verified-not-covered" || live.state === "self-pay-confirmed") && (
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Resolved. The Care Coordinator has been notified to book the appointment.</p>
          )}
        </div>

        {/* History */}
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> History</p>
          <div className="space-y-2">
            {live.history.slice().reverse().map((h, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-slate-700 dark:text-slate-300">{STATE_LABELS[h.state]}</span>
                  <span className="text-slate-400"> — {new Date(h.at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                  {h.by && <span className="text-slate-400"> · {h.by}</span>}
                  {h.note && <p className="text-slate-400 mt-0.5">{h.note}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Drawer>
  );
}

export default function EligibilityWorklist() {
  const store = useOnboardingStore();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const activeFilter = FILTERS.find((f) => f.id === filter)!;

  const filtered = useMemo(() => store.worklist.filter((it) =>
    activeFilter.match(it.state) &&
    (it.patientName.toLowerCase().includes(query.toLowerCase()) || it.payerName.toLowerCase().includes(query.toLowerCase()))
  ), [store.worklist, activeFilter, query]);

  const counts = {
    pending: store.worklist.filter((i) => i.state === "pending").length,
    inProgress: store.worklist.filter((i) => i.state === "in-progress").length,
    onHold: store.worklist.filter((i) => i.state === "on-hold").length,
    resolved: store.worklist.filter((i) => ["verified-active", "verified-inactive", "verified-not-covered", "self-pay-confirmed"].includes(i.state)).length,
    attention: store.worklist.filter((i) => ["unable-to-verify", "expired"].includes(i.state)).length,
  };

  const openItem = openId ? store.worklist.find((i) => i.id === openId) ?? null : null;

  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center shrink-0">
          <ClipboardCheck className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Eligibility Worklist</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Insurance submitted at onboarding, routed here for eligibility verification</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <StatTile label="Pending" value={counts.pending} color="text-amber-600" />
        <StatTile label="In Progress" value={counts.inProgress} color="text-blue-600" />
        <StatTile label="On Hold" value={counts.onHold} color="text-yellow-600" />
        <StatTile label="Resolved" value={counts.resolved} color="text-emerald-600" />
        <StatTile label="Needs Attention" value={counts.attention} color="text-red-600" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-wrap">
          <div className="flex gap-1.5">
            {FILTERS.map((f) => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={cn("px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                  filter === f.id ? "bg-amber-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700")}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-[160px] max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search patient or payer…"
              className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>

        <div className="divide-y divide-slate-50 dark:divide-slate-800/60">
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-slate-400">No cases match this filter.</div>
          )}
          {filtered.map((it) => (
            <button key={it.id} onClick={() => setOpenId(it.id)} className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-left">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{it.patientName}</p>
                <p className="text-xs text-slate-400 truncate">{it.payerName} · Member ID {it.memberId}</p>
              </div>
              {it.carveOut && <span title="Carve-out flagged"><ShieldAlert className="w-4 h-4 text-violet-500 shrink-0" /></span>}
              {it.assignee && <span className="text-xs text-slate-400 shrink-0 hidden sm:inline">{it.assignee}</span>}
              <div className="flex items-center gap-1.5 shrink-0">
                <Clock3 className="w-3 h-3 text-slate-300" />
                <span className="text-[11px] text-slate-400">{new Date(it.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              </div>
              <StateBadge state={it.state} />
              <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {openItem && <ItemDrawer item={openItem} onClose={() => setOpenId(null)} />}
    </div>
  );
}
