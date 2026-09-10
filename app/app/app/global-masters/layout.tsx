"use client";

import AppLayout from "@/components/layout/AppLayout";
import GmNav from "@/components/global-masters/GmNav";

export default function GlobalMastersLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout>
      {/* Cancel parent padding, extend to full content height */}
      <div className="-m-6 flex min-h-[calc(100vh-60px)]">
        <GmNav />
        <div className="flex-1 min-w-0 overflow-auto p-6">
          {children}
        </div>
      </div>
    </AppLayout>
  );
}
