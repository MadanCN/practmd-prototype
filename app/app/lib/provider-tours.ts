// Guided first-visit tours + contextual ? help copy, one entry per provider
// nav page. The tour engine lives in components/provider/tour/. Step targets
// are `data-tour="<key>"` attributes on real elements; the final step always
// targets `data-tour="help"` (the header ? button).

export type TourPageId =
  | "today" | "calendar" | "list" | "notes" | "waiting" | "messages"
  | "patients" | "tasks" | "reports" | "recents" | "availability"
  | "settings" | "profile";

export interface TourStep {
  /** matches data-tour="<target>" in the page; "help" = the header ? button */
  target: string;
  title: string;
  body: string;
}

export interface TourHelpBlock { h: string; p: string; }

export interface TourDef {
  pageName: string;
  welcome: { title: string; body: string };
  steps: TourStep[];
  helpIntro: string;
  helpDoc: TourHelpBlock[];
}

const HELP_STEP = (pageName: string): TourStep => ({
  target: "help",
  title: "That's the tour",
  body: `The ? here opens ${pageName === "Today" ? "this page's" : "the " + pageName.toLowerCase()} help guide any time — and it's where you replay this tour.`,
});

export const PROVIDER_TOURS: Record<TourPageId, TourDef> = {
  today: {
    pageName: "Today",
    welcome: { title: "Welcome to your Today dashboard", body: "Here's a 60-second tour of everything on this page — it's your daily starting point." },
    steps: [
      { target: "today-greeting", title: "One place to start your day", body: "Today gathers everything that needs you across the portal, ordered by what it costs to ignore — not by time." },
      { target: "today-kpis", title: "Four numbers set the tone", body: "These tiles are ordered by revenue impact. Each links straight to the work behind it." },
      { target: "today-kpi-unsigned", title: "Unsigned notes come first", body: "Every unsigned note is a finished visit that can't be billed yet — the dollar figure is revenue sitting on the table." },
      { target: "today-needs-sig", title: "Sign what's waiting", body: "Your first working section: notes awaiting signature, highest value and oldest at the top. 'Open note' jumps into the SOAP editor." },
      { target: "today-schedule", title: "Your day, and check-in", body: "Your appointments in order. When a patient is within 30 minutes a 'Check in' button appears here — one click starts their encounter and moves them to your waiting room." },
      { target: "today-charts", title: "Read the week at a glance", body: "Appointment volume by day, and how many notes are signed versus still open." },
      { target: "today-secondary", title: "Everything else, compact", body: "Tasks, messages, results and refills sit below in brief. Full lists are one click away." },
      HELP_STEP("Today"),
    ],
    helpIntro: "The Today dashboard is your daily command centre — a single scan of what needs attention, prioritised by billing impact.",
    helpDoc: [
      { h: "Priority order", p: "Sections are arranged by revenue impact: unsigned notes, then today's appointments, then supporting queues." },
      { h: "Needs your signature", p: "Every encounter note awaiting your signature, with its billable value and age. Anything over 7 days shows in red." },
      { h: "The KPI tiles", p: "Unsigned notes (with unbilled total), today's appointments, patients checked in, and open tasks. Each tile is a link." },
      { h: "Today's schedule & check-in", p: "Your appointments in order. Check-in appears when a visit is within 30 minutes; Join appears for telehealth." },
      { h: "Weekly charts", p: "Appointment count per weekday and a signed-vs-pending documentation gauge for the current week." },
    ],
  },

  calendar: {
    pageName: "Calendar",
    welcome: { title: "Your week at a glance", body: "The calendar shows your own appointments across this week and the next two. Here's how to read and work it." },
    steps: [
      { target: "cal-toolbar", title: "Move through your weeks", body: "Step back and forward a week at a time, or jump to today. Appointments are loaded for this week plus the next two." },
      { target: "cal-legend", title: "Colour = visit type", body: "Every card is coloured by its visit type. Click a colour in the legend to show only that type." },
      { target: "cal-grid", title: "Read the grid", body: "Click any card to open its detail drawer. Overlapping appointments pack side by side, and a red line marks the current time on today's column." },
      { target: "cal-filters", title: "Narrow the view", body: "Filter by mode or status, and toggle cancelled appointments on or off." },
      HELP_STEP("Calendar"),
    ],
    helpIntro: "The calendar is your own schedule — this provider's appointments only, three weeks wide, colour-coded by visit type.",
    helpDoc: [
      { h: "Navigation", p: "Previous / next week and a Today jump. The header shows the week range." },
      { h: "Visit-type legend", p: "Spravato, Med Management, Initial Consultation, Talk Therapy, TMS, Follow-Up, Crisis Visit, Group Session — each has a fixed colour. Click one to filter." },
      { h: "Overlapping appointments", p: "Appointments in the same slot pack side by side so nothing is hidden." },
      { h: "The now line", p: "A red horizontal line with a dot marks the current time on today's column, updating every minute." },
      { h: "Filters", p: "Mode, status, visit type, and a Cancelled toggle. A List view is one click away." },
    ],
  },

  list: {
    pageName: "Appointment list",
    welcome: { title: "Every appointment, as a table", body: "The list view is a filterable table of your own appointments — good for scanning, searching and jumping to a specific visit." },
    steps: [
      { target: "list-summary", title: "The numbers first", body: "Upcoming, completed, and how many need a note — a quick health check on your schedule." },
      { target: "list-range", title: "Pick a window", body: "Upcoming, next 7 days, past, or all. The table groups by day underneath." },
      { target: "list-filters", title: "Filter and search", body: "Status, mode and visit type, plus free-text search by patient or visit type." },
      { target: "list-table", title: "Open the drawer", body: "Click any row to open the same appointment detail drawer you get from the calendar. The Note column shows whether that visit's note is a draft or signed." },
      HELP_STEP("Appointment list"),
    ],
    helpIntro: "The list view is a dense, filterable table of your appointments — the fastest way to find one visit or scan status across many.",
    helpDoc: [
      { h: "Summary strip", p: "Upcoming count, completed count, and 'need note' — completed visits whose encounter note isn't signed yet." },
      { h: "Range", p: "Upcoming, Next 7 days, Past, All. Rows are grouped by date." },
      { h: "Filters", p: "Status, mode and visit type dropdowns, plus a search box matching patient name or visit type." },
      { h: "Note column", p: "A draft or signed marker per row, so you can spot unbilled visits from the list." },
      { h: "Row click", p: "Opens the shared appointment detail drawer — the same one the calendar uses." },
    ],
  },

  notes: {
    pageName: "Encounter Notes",
    welcome: { title: "Where your notes get finished", body: "This is the queue of clinical notes for your visits. An unsigned note can't be billed — so this page has a revenue edge." },
    steps: [
      { target: "notes-header", title: "Unsigned = unbilled", body: "The heading says it plainly: until a note is signed, the visit behind it produces no revenue." },
      { target: "notes-tabs", title: "Pending vs Signed", body: "Pending holds drafts and notes awaiting co-signature. Signed is your completed history." },
      { target: "notes-table", title: "Age flags urgency, Open to sign", body: "The Age column stays grey, turns amber after a couple of days, and red past a week. Open takes you into the SOAP editor — signing there also sends the charge to billing." },
      { target: "nav-notes-badge", title: "Always visible", body: "The number on 'Encounter Notes' in the sidebar is your unsigned count — it follows you around the portal." },
      HELP_STEP("Encounter Notes"),
    ],
    helpIntro: "This is the working queue for clinical documentation. Every visit needs a signed note before it can be billed.",
    helpDoc: [
      { h: "Pending tab", p: "Drafts and notes awaiting co-signature. The count matches the sidebar badge." },
      { h: "Signed tab", p: "Your completed, locked notes, most recent first." },
      { h: "Age column", p: "Time since the date of service. Grey, then amber after 2 days, then red past 7." },
      { h: "Open / View", p: "Open loads the SOAP editor for a draft; View opens a signed note read-only." },
      { h: "Signing sends the charge", p: "When you sign, a charge with the CPT and diagnoses is created for Revenue Management automatically." },
    ],
  },

  waiting: {
    pageName: "Waiting Room",
    welcome: { title: "Who's here, right now", body: "The waiting room shows only your own checked-in patients — in person and in the virtual lobby." },
    steps: [
      { target: "wr-stats", title: "The room at a glance", body: "How many are waiting, how many are with you, average wait, and total checked in today." },
      { target: "wr-tabs", title: "In person vs telehealth", body: "Split the view by mode. Telehealth patients waiting appear as 'In Virtual Lobby'." },
      { target: "wr-list", title: "Call in, then start", body: "Each card shows name, visit type, wait time and room. 'Call In' marks the patient ready; 'Start Session' opens their encounter note. Telehealth shows 'Join Call'." },
      HELP_STEP("Waiting Room"),
    ],
    helpIntro: "The waiting room is a live list of your checked-in patients — it only fills once someone is actually here.",
    helpDoc: [
      { h: "What shows here", p: "Only your patients with a status of arrived or in-session. A confirmed appointment for later today does not appear." },
      { h: "Stat tiles", p: "In waiting room, with provider, average wait, and total checked in today." },
      { h: "Mode tabs", p: "All / In Person / Telehealth / Phone. Telehealth waiters read 'In Virtual Lobby'." },
      { h: "Actions", p: "Call In → Start Session (opens the SOAP note) for in-person; Join Call for telehealth; Check Out when done." },
      { h: "Insurance flags", p: "An amber warning appears on the card when eligibility is inactive or pending." },
    ],
  },

  messages: {
    pageName: "Messages",
    welcome: { title: "Two inboxes, one place", body: "Secure messages from patients and internal notes from staff, pharmacy and labs — kept on separate channels in the sidebar." },
    steps: [
      { target: "msg-list", title: "Unread and urgent stand out", body: "A dot and bold text mark threads you haven't opened; a red triangle means the sender flagged it urgent. Those sort to the top. Click a thread to read the full history and reply." },
      { target: "msg-new", title: "Start a conversation", body: "New Message lets you pick a recipient — a patient on this channel, or staff / pharmacy / lab on Internal — and send." },
      HELP_STEP("Messages"),
    ],
    helpIntro: "Messages keeps patient correspondence and internal coordination on separate channels so nothing gets lost between them.",
    helpDoc: [
      { h: "Channels", p: "Patients (direct secure messaging) and Internal (staff, pharmacy, lab). Each has its own unread count." },
      { h: "Unread & urgent", p: "Unread threads show a dot and bold subject. Urgent-flagged threads carry a red marker and sort first." },
      { h: "Reading pane", p: "The full thread with timestamps and sender roles. Your replies are marked as from you." },
      { h: "Replying", p: "Compose at the bottom of the thread. Internal threads can be linked to a patient chart." },
    ],
  },

  patients: {
    pageName: "Patients",
    welcome: { title: "Your patient panel", body: "Every patient you have an appointment with. Search, shape the columns, filter, and open a full 360° chart." },
    steps: [
      { target: "pt-search", title: "Find anyone fast", body: "Search by name, MRN, email or phone. Results narrow as you type." },
      { target: "pt-columns", title: "Choose your columns", body: "Show or hide optional columns — gender/age, clinic, insurance, last visit, next appointment — to fit how you work." },
      { target: "pt-filters", title: "Advanced filters", body: "Care coordinator, status, age range, upcoming appointment, insurance status. Active filters show as removable chips." },
      { target: "pt-table", title: "Open the 360° chart", body: "Click a name to open the full patient profile — overview, appointments, encounters, allergies, vitals, forms, timeline and more." },
      { target: "pt-refer", title: "Refer a patient", body: "Send a referral to another provider or an external clinic without leaving the list." },
      HELP_STEP("Patients"),
    ],
    helpIntro: "The patient list is your working panel — the patients you actually see — with a configurable table and a deep chart behind every name.",
    helpDoc: [
      { h: "Scope", p: "Patients with any appointment with you. Not the whole clinic's roster." },
      { h: "Columns", p: "A default set plus optional columns you toggle: gender/age, clinic, patient type, insurance, last visit, next appointment, status." },
      { h: "Filters", p: "Care coordinator, active/inactive, age range, has upcoming appointment, insurance status — surfaced as chips you can clear." },
      { h: "The 360° profile", p: "Name links to a sticky highlight bar plus a chart with overview, appointments, encounters, messages, tasks, allergies, vitals, forms, documents, PHR, timeline and emails." },
      { h: "Refer Patient", p: "Opens a modal to send a referral to an internal provider or external clinic with a reason and note." },
    ],
  },

  tasks: {
    pageName: "Tasks",
    welcome: { title: "Your task queue", body: "Chart reviews, prior authorisations, callbacks and admin work assigned to you — sorted so the pressing items sit on top." },
    steps: [
      { target: "tasks-filters", title: "Slice the list", body: "Filter by type or status. Open tasks show first; done tasks move out of the way." },
      { target: "tasks-list", title: "Priority and due dates", body: "A coloured dot flags priority — red overdue, amber high, grey routine — and 'Overdue by 1 day' turns red. Mark a task done from its row." },
      HELP_STEP("Tasks"),
    ],
    helpIntro: "Tasks is the catch-all for non-visit work assigned to you — kept in one prioritised list rather than scattered across messages.",
    helpDoc: [
      { h: "Types", p: "Chart review, prior auth, callback, lab follow-up and admin. Each carries a patient link where relevant." },
      { h: "Priority", p: "Red dot = overdue, amber = high, grey = routine. The list sorts overdue first." },
      { h: "Due labels", p: "Due today / tomorrow / Friday, or 'Overdue by N days' in red." },
      { h: "Completing", p: "Mark done from the row. Completed tasks stay searchable under the Done filter." },
    ],
  },

  reports: {
    pageName: "Reports",
    welcome: { title: "Your numbers at a glance", body: "Volume, no-shows, session length and satisfaction for your own panel — a quick read on how the month is going." },
    steps: [
      { target: "reports-kpis", title: "Headline metrics", body: "Visits this month, no-show rate, average session length and patient satisfaction — your four vital signs." },
      { target: "reports-charts", title: "See the trend", body: "Visits per week and the visit-type mix, so you can see direction rather than just a single number." },
      HELP_STEP("Reports"),
    ],
    helpIntro: "Reports summarises your own clinical activity — for self-review and supervision, not clinic-wide analytics.",
    helpDoc: [
      { h: "Headline metrics", p: "Visits this month, no-show rate, average session length, and patient satisfaction." },
      { h: "Visits per week", p: "Your completed-visit count for each of the last eight weeks." },
      { h: "Visit-type mix", p: "How your visits split across Med Management, Talk Therapy, Initial Consultation and the rest." },
    ],
  },

  recents: {
    pageName: "Recents",
    welcome: { title: "Retrace your steps", body: "A running trail of what you've opened — patients, notes and appointments — so you can jump back without searching." },
    steps: [
      { target: "recents-list", title: "Grouped by time, one click back", body: "Today, yesterday, earlier this week — newest first. Every row links straight back to where you were. Clear the history whenever you like." },
      HELP_STEP("Recents"),
    ],
    helpIntro: "Recents is a personal, time-ordered trail of the records you've opened — a quick way back to work in progress.",
    helpDoc: [
      { h: "What's tracked", p: "Patient charts, encounter notes, and appointments you've viewed." },
      { h: "Grouping", p: "Today, Yesterday, Earlier this week — most recent first." },
      { h: "Privacy", p: "The list is yours alone and can be cleared at any time." },
    ],
  },

  availability: {
    pageName: "My Availability",
    welcome: { title: "Your working schedule", body: "Your standing hours, plus the requests that change them — leave, blocked time, and hours changes." },
    steps: [
      { target: "av-actions", title: "Request a change", body: "Apply for leave, block time for admin or CME, or ask for a change to your standing hours. Each routes for approval." },
      { target: "av-hours", title: "Your standing week", body: "Working days, hours and breaks by day of the week — your default before any leave or blocks." },
      { target: "av-calendar", title: "See the month", body: "Working days, days off, approved leave, pending leave and blocked time laid out on a calendar." },
      { target: "av-requests", title: "Track approvals", body: "Every request you've made with its status — pending, approved, auto-approved or rejected — and who's approving it." },
      HELP_STEP("My Availability"),
    ],
    helpIntro: "My Availability is where your schedule is defined and changed — standing hours plus leave, blocks and hours-change requests.",
    helpDoc: [
      { h: "Standing hours", p: "Your default working days, open/close times and breaks by weekday, plus your primary location." },
      { h: "Requests", p: "Apply for Leave, Block Time, and Request Change in Working Hours. Approval routing is set by the clinic — some auto-approve." },
      { h: "Monthly calendar", p: "Colour-coded: working day (with hours), off, approved leave, pending leave, blocked time." },
      { h: "My Requests", p: "A log of what you've submitted with status and approver. Rejected requests show the reason." },
    ],
  },

  settings: {
    pageName: "Settings",
    welcome: { title: "Make the portal yours", body: "Account details, notifications, scheduling defaults, documentation preferences, billing defaults and security — organised into tabs." },
    steps: [
      { target: "settings-rail", title: "Seven areas", body: "Each tab is one area of configuration. Start with Notifications and Documentation — they shape your day the most." },
      { target: "settings-panel", title: "Defaults that save clicks", body: "Notification toggles and reminder cadence, default appointment length, note template, required diagnosis before signing, favourite codes." },
      { target: "settings-save", title: "Save to apply", body: "Changes take effect when you save. Nothing is committed until then." },
      HELP_STEP("Settings"),
    ],
    helpIntro: "Settings holds every per-provider preference. Most of it is set once; Notifications and Documentation are the ones worth revisiting.",
    helpDoc: [
      { h: "Account", p: "Name, credentials, contact details, timezone. NPI and licence are read-only." },
      { h: "Notifications", p: "Per-category toggles, a reminder cadence for unsigned notes, and delivery channels." },
      { h: "Scheduling", p: "Default appointment length, buffer, check-in window, default visit type, double-booking, telehealth link, default view." },
      { h: "Documentation", p: "Default note template, autopopulate from last visit, require a diagnosis before signing, co-sign defaults, favourite diagnoses and procedure codes." },
      { h: "Billing & Security", p: "Default place of service and rendering provider; password, two-factor and active sessions." },
    ],
  },

  profile: {
    pageName: "Profile",
    welcome: { title: "Your provider profile", body: "The details patients and staff see about you — and a preview of exactly how your public listing looks." },
    steps: [
      { target: "profile-toggle", title: "Two views", body: "'My Profile' is the full record you edit. 'View as Patient' shows the card patients see when they self-schedule." },
      { target: "profile-edit", title: "Edit in place", body: "Edit turns the bio and contact fields into inputs. Save writes them; Cancel drops the changes." },
      { target: "profile-accepting", title: "Accepting new patients", body: "This toggle controls whether you appear as bookable in self-scheduling and on your public listing." },
      HELP_STEP("Profile"),
    ],
    helpIntro: "Your profile is both an internal record and a public listing. What you enter here is what patients see when choosing a provider.",
    helpDoc: [
      { h: "My Profile vs View as Patient", p: "The editable record, and a live preview of your self-scheduling card." },
      { h: "Editable fields", p: "Bio, email and phone are editable inline. NPI, licence and credentials are managed by the clinic." },
      { h: "Accepting new patients", p: "Turns your bookability on or off in self-scheduling and on the public card." },
      { h: "Static sections", p: "Education, board certifications, practice locations, visit types and accepted insurance are drawn from your credentialing record." },
    ],
  },
};

const ROUTES: { path: string; id: TourPageId }[] = [
  { path: "/provider/today", id: "today" },
  { path: "/provider/appointments/list", id: "list" },
  { path: "/provider/appointments", id: "calendar" },
  { path: "/provider/encounter-notes", id: "notes" },
  { path: "/provider/encounters", id: "notes" },
  { path: "/provider/waiting-room", id: "waiting" },
  { path: "/provider/messages/patients", id: "messages" },
  { path: "/provider/messages", id: "messages" },
  { path: "/provider/patients", id: "patients" },
  { path: "/provider/tasks", id: "tasks" },
  { path: "/provider/reports", id: "reports" },
  { path: "/provider/recents", id: "recents" },
  { path: "/provider/availability", id: "availability" },
  { path: "/provider/settings", id: "settings" },
  { path: "/provider/profile", id: "profile" },
];

/** The help/tour context for a path — matches sub-routes too (a patient chart
 *  gets the Patients help). */
export function tourIdForPath(pathname: string): TourPageId | null {
  const m = ROUTES.find((r) => pathname === r.path || pathname.startsWith(r.path + "/"));
  return m?.id ?? null;
}

// The SOAP editor route shares the "notes" help but must not auto-fire a tour.
const MAIN_ROUTES = new Set(ROUTES.filter((r) => r.path !== "/provider/encounters").map((r) => r.path));

/** True only on a nav item's exact main page — where a first-visit tour auto-fires. */
export function isTourMainRoute(pathname: string): boolean {
  return MAIN_ROUTES.has(pathname);
}

export function tourSeenKey(id: TourPageId) {
  return `practmd.provider.tour.${id}`;
}
