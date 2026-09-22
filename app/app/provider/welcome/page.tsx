"use client";

// The only account-setup entry point is a clinic-sent invitation link
// (components/provider-staff/InviteLanding.tsx, at /invite/[token]) — there is
// no separate "welcome" screen of its own. This route exists for the two
// places that land a provider here without a token in hand (the /provider
// root redirect for a not-yet-onboarded session, and Settings' "Replay
// account activation" demo control): it finds the signed-in provider's live
// invite link, sending a fresh one if they don't have one, and hands off to it.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { PractMdLogo } from "@/components/brand/PractMdLogo";
import { getProviderSession } from "@/lib/provider-session";
import { ensureLiveInvite, inviteUrl } from "@/lib/provider-store";

export default function ProviderWelcomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    const { provider } = getProviderSession();
    const invite = ensureLiveInvite(provider.id);
    router.replace(invite ? inviteUrl(invite.token) : "/provider/activate");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-white">
      <PractMdLogo className="h-9 animate-pulse" />
      <p className="text-sm text-slate-400">Finding your invitation…</p>
    </div>
  );
}
