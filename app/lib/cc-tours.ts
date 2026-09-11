// Guided first-visit tour + contextual ? help copy for the Care Coordinator
// portal — same engine as lib/provider-tours.ts (components/care-coordinator/
// tour/). Step targets are `data-tour="<key>"` attributes on real elements;
// the final step always targets `data-tour="help"` (the header ? button).
// Only "home" is defined today — the CC equivalent of the Provider Today
// tour, for when a coordinator first lands on the portal. Add more page ids
// here the same way provider-tours.ts covers each of its nav pages.

export type CcTourPageId = "home";

export interface CcTourStep {
  /** matches data-tour="<target>" in the page; "help" = the header ? button */
  target: string;
  title: string;
  body: string;
}

export interface CcTourHelpBlock { h: string; p: string; }

export interface CcTourDef {
  pageName: string;
  welcome: { title: string; body: string };
  steps: CcTourStep[];
  helpIntro: string;
  helpDoc: CcTourHelpBlock[];
}

const HELP_STEP = (pageName: string): CcTourStep => ({
  target: "help",
  title: "That's the tour",
  body: `The ? here opens ${pageName === "Home" ? "this page's" : "the " + pageName.toLowerCase()} help guide any time — and it's where you replay this tour.`,
});

export const CC_TOURS: Record<CcTourPageId, CcTourDef> = {
  home: {
    pageName: "Home",
    welcome: { title: "Welcome to your Care Coordinator Home", body: "You manage every provider's patients at once, not one person's day. Here's a 60-second tour of what Home surfaces the moment you log in." },
    steps: [
      { target: "cc-home-kpis", title: "Four queues, one glance", body: "Who's in the waiting room across every provider, pending requests, the waitlist, and open tasks. Each tile links straight to the work behind it." },
      { target: "cc-home-actions", title: "This is the real job", body: "A patient finishing self-registration, Revenue Cycle resolving an eligibility check, a provider recommending a follow-up — each one hands you something to act on. This queue is where they all land." },
      { target: "cc-home-secondary", title: "Live waiting room, requests, and the waitlist", body: "Who's actually checked in right now across every provider, plus a preview of pending requests and the waitlist. Full lists are one click away." },
      HELP_STEP("Home"),
    ],
    helpIntro: "Home is a coordinator's command centre across every provider — not a single schedule, but the queues you actually manage: who's here, who's waiting on a slot, and what other people just handed you to act on.",
    helpDoc: [
      { h: "The KPI tiles", p: "Waiting room (across all providers), pending appointment requests, the waitlist, and open tasks. Each tile is a link." },
      { h: "Needs your action", p: "Your real task queue: new patient onboarding, appointments to book once Revenue Cycle resolves eligibility, and follow-ups a provider recommended. Coverage/billing itself is Revenue Cycle's queue, not yours." },
      { h: "Waiting room now", p: "A live snapshot of who's checked in across every provider — not a forward-looking calendar." },
      { h: "Requests & waitlist", p: "A compact preview of each queue, with a 'View all' link to the full page." },
    ],
  },
};

const ROUTES: { path: string; id: CcTourPageId }[] = [
  { path: "/care-coordinator", id: "home" },
];

/** The help/tour context for a path — matches sub-routes too. */
export function ccTourIdForPath(pathname: string): CcTourPageId | null {
  const m = ROUTES.find((r) => pathname === r.path || pathname.startsWith(r.path + "/"));
  return m?.id ?? null;
}

// Only the exact "/care-coordinator" root counts as the main landing page —
// sub-routes like /care-coordinator/patients share the "home" help but must
// not auto-fire the welcome tour.
const MAIN_ROUTES = new Set(["/care-coordinator"]);

/** True only on a nav item's exact main page — where a first-visit tour auto-fires. */
export function isCcTourMainRoute(pathname: string): boolean {
  return MAIN_ROUTES.has(pathname);
}

export function ccTourSeenKey(id: CcTourPageId) {
  return `practmd.cc.tour.${id}`;
}
