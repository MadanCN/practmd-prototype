"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/layout/AppLayout";
import { CalendarRange, ClipboardEdit, ClipboardCheck } from "lucide-react";
import { useProviderStore } from "@/lib/provider-store";
import LeaveApprovalsPanel from "@/components/admin/LeaveApprovalsPanel";
import ChangeRequestsPanel from "@/components/admin/ChangeRequestsPanel";
import { cn } from "@/lib/utils";

type Tab = "leave" | "changes";

function ApprovalPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const store = useProviderStore();
  const initial: Tab = params.get("tab") === "changes" ? "changes" : "leave";
  const [tab, setTab] = useState<Tab>(initial);
  const pendingChanges = store.corrections.filter((c) => c.status === "pending").length;

  function go(t: Tab) {
    setTab(t);
    router.replace(`/admin/approvals?tab=${t}`, { scroll: false });
  }

  return (
    <AppLayout>
      <div className="mb-5 flex items-center gap-3">
        <ClipboardCheck className="w-5 h-5 text-violet-600 dark:text-violet-400" />
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">Approval</h1>
      </div>

      <div className="border-b border-slate-200 dark:border-slate-800 flex mb-5" role="tablist">
        <button role="tab" aria-selected={tab === "leave"} onClick={() => go("leave")}
          className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px",
            tab === "leave" ? "border-violet-600 text-violet-600 dark:text-violet-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
          <CalendarRange className="w-4 h-4" /> Leave Approvals
        </button>
        <button role="tab" aria-selected={tab === "changes"} onClick={() => go("changes")}
          className={cn("flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px",
            tab === "changes" ? "border-violet-600 text-violet-600 dark:text-violet-400" : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300")}>
          <ClipboardEdit className="w-4 h-4" /> Change Requests
          {pendingChanges > 0 && <span className="ml-1 text-[10px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded-full">{pendingChanges}</span>}
        </button>
      </div>

      {tab === "leave" ? <LeaveApprovalsPanel /> : <ChangeRequestsPanel />}
    </AppLayout>
  );
}

export default function ApprovalPage() {
  return (
    <Suspense fallback={null}>
      <ApprovalPageInner />
    </Suspense>
  );
}
