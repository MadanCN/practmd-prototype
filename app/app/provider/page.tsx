"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isProviderOnboarded } from "@/lib/provider-onboarding";
import { getActivation, accountSetupComplete } from "@/lib/provider-activation";
import { PractMdLogo } from "@/components/brand/PractMdLogo";

/**
 * Entry point for the Provider portal. No real auth in the prototype, so we
 * branch on the persisted journey state (PRD "The Provider's journey"):
 *   not through account setup   → invitation / onboarding flow
 *   setup done, not activated    → activation wizard (steps 5–8)
 *   activated                    → the portal (the layout then routes
 *                                  limited / read-only statuses on to
 *                                  their readiness checklist)
 */
export default function ProviderRootPage() {
  const router = useRouter();

  useEffect(() => {
    const a = getActivation();
    if (a.activated || isProviderOnboarded()) {
      router.replace("/provider/today");
    } else if (accountSetupComplete(a)) {
      router.replace("/provider/activate");
    } else {
      router.replace("/provider/welcome");
    }
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <PractMdLogo className="h-9 animate-pulse" />
      <p className="text-sm text-slate-400">Loading your portal…</p>
    </div>
  );
}
