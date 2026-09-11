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
    welcome: { title: "Welcome to your Care Coordinator Home", body: "You're the front door for every patient at this clinic. Here's a 60-second tour of what Home gives you the moment you log in." },
    steps: [
      { target: "cc-home-kpis", title: "Four numbers, one glance", body: "Today's appointments, who's in the waiting room, pending requests, and the waitlist. Each tile links straight to the work behind it." },
      { target: "cc-home-coverage", title: "Coverage catches problems early", body: "Anyone on today's schedule with lapsed, pending, or self-pay coverage shows up here — before they're sitting in your waiting room. Click through to their Insurance tab to fix it." },
      { target: "cc-home-schedule", title: "Today's schedule, live", body: "Every confirmed visit today, in order, with mode and time. It's the same list the calendar uses — click through to check a patient in." },
      { target: "cc-home-secondary", title: "Tasks, requests, and the waitlist", body: "Your open work in one compact row, so you never have to leave Home to see what's pending. Full lists are one click away." },
      HELP_STEP("Home"),
    ],
    helpIntro: "Home is your daily starting point — a single scan of today's schedule, coverage risk, and your team's open work.",
    helpDoc: [
      { h: "The KPI tiles", p: "Today's appointments, patients in the waiting room, pending appointment requests, and the waitlist. Each tile is a link." },
      { h: "Coverage needs attention", p: "Patients on today's schedule whose insurance is inactive, pending renewal, or who are self-pay — resolved from each patient's Insurance tab." },
      { h: "Today's schedule", p: "Your clinic's confirmed visits today, in time order." },
      { h: "Tasks, requests & waitlist", p: "A compact preview of each queue, with a 'View all' link to the full page." },
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
