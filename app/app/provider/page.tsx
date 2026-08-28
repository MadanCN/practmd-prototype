"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isProviderOnboarded } from "@/lib/provider-onboarding";
import { PractMdLogo } from "@/components/brand/PractMdLogo";

/**
 * Entry point for the Provider portal. With no real auth in the prototype we
 * branch on a localStorage flag: providers who have not activated their account
 * see the invitation / onboarding flow; everyone else lands in the portal.
 */
export default function ProviderRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace(isProviderOnboarded() ? "/provider/today" : "/provider/welcome");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <PractMdLogo className="h-9 animate-pulse" />
      <p className="text-sm text-slate-400">Loading your portal…</p>
    </div>
  );
}
