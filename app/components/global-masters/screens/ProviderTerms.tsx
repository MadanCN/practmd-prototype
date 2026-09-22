"use client";

import { useState } from "react";
import { FileText, Save, CheckCircle } from "lucide-react";
import Toggle from "@/components/ui/Toggle";
import { cn } from "@/lib/utils";
import { useProviderTerms, setProviderTermsRequired, setProviderTermsContent } from "@/lib/provider-terms-store";

// Pattern C: single toggle + rich-text panel. Unlike the other Global
// Masters screens, this one is backed by a real persisted store
// (lib/provider-terms-store.ts) because it has a named cross-cutting
// effect: it gates the "accept terms" step of the provider account-setup
// wizard (components/provider-staff/InviteLanding.tsx) and the provider's
// acceptance is logged to their audit trail.
export default function ProviderTermsScreen() {
  const terms = useProviderTerms();
  const [content, setContent] = useState(terms.content);
  const [syncedContent, setSyncedContent] = useState(terms.content);
  const [saved, setSaved] = useState(false);

  // The store hydrates from localStorage after first paint (SSR-safe pattern
  // used across this app's stores) — pick up that value into the draft
  // textarea. Adjusting state during render (not an effect) avoids an extra
  // render pass and matches React's guidance for syncing to a changed prop.
  if (terms.content !== syncedContent) {
    setSyncedContent(terms.content);
    setContent(terms.content);
  }

  function handleSave() {
    setProviderTermsContent(content);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center flex-shrink-0">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Provider Terms and Conditions</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Require providers to accept terms during account setup, and configure the content they see.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div className={cn(
          "flex items-center justify-between px-5 py-4 transition-colors",
          terms.required ? "bg-blue-50 dark:bg-blue-950/20" : ""
        )}>
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Require Provider Terms &amp; Conditions</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              When on, the provider account setup wizard adds an &quot;Accept terms&quot; step showing the content below. Acceptance is logged to the provider&apos;s audit trail.
            </p>
          </div>
          <Toggle checked={terms.required} onChange={setProviderTermsRequired} />
        </div>

        {terms.required && (
          <div className="px-5 py-4 space-y-2">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              Terms &amp; Conditions Content
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Shown to the provider verbatim on the &quot;Accept terms&quot; step of account setup.
            </p>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={14}
              className={cn(
                "w-full mt-2 px-3 py-2.5 rounded-lg text-sm leading-relaxed border border-slate-200 dark:border-slate-700 font-mono",
                "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              )}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Setting
        </button>
        {saved && (
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            Saved successfully
          </div>
        )}
      </div>
    </div>
  );
}
