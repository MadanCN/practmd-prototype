/* Per-page config for the provider onboarding tour. build.mjs stamps each
   into _template.html. `body` = the .body inner HTML for that page;
   steps[].id must match an id in that body (or "help-btn"). */

const RES_NOTE = "Anything over 7 days shows in red.";

export const PAGES = [
  /* ───────────────────────── TODAY (Main) ───────────────────────── */
  {
    file: "Main.dc.html", active: "today", name: "Today", crumb: "Today",
    welcome: { title: "Welcome to your Today dashboard", body: "Here's a 60-second tour of everything on this page — it's your daily starting point." },
    steps: [
      { id: "greeting", title: "One place to start your day", body: "Today gathers everything that needs you across the portal, ordered by what it costs to ignore — not by time." },
      { id: "kpi-row", title: "Four numbers set the tone", body: "These tiles are ordered by revenue impact. Each links straight to the work behind it." },
      { id: "kpi-unsigned", title: "Unsigned notes come first", body: "Every unsigned note is a finished visit that can't be billed yet — the dollar figure is revenue sitting on the table." },
      { id: "needs-sig", title: "Sign what's waiting", body: "Your first working section: notes awaiting signature, highest value and oldest at the top. 'Open note' jumps into the SOAP editor." },
      { id: "checkin-btn", title: "Check patients in from here", body: "When a patient is within 30 minutes this button appears. One click starts their encounter and moves them to your waiting room." },
      { id: "charts", title: "Read the week at a glance", body: "Appointment volume by day, and how many notes are signed versus still open." },
      { id: "secondary", title: "Everything else, compact", body: "Tasks, messages, results and refills sit below in brief. Full lists are one click away." },
      { id: "help-btn", title: "That's the tour", body: "The ? here opens this page's help guide any time — and it's where you replay this tour.", isHelpBtn: true },
    ],
    helpIntro: "The Today dashboard is your daily command centre — a single scan of what needs attention, prioritised by billing impact.",
    helpDoc: [
      { h: "Priority order", p: "Sections are arranged by revenue impact: unsigned notes, then today's appointments, then supporting queues." },
      { h: "Needs your signature", p: "Every encounter note awaiting your signature, with its billable value and age. " + RES_NOTE },
      { h: "The KPI tiles", p: "Unsigned notes (with unbilled total), today's appointments, patients checked in, and open tasks. Each tile is a link." },
      { h: "Today's schedule & check-in", p: "Your appointments in order. Check-in appears when a visit is within 30 minutes; Join appears for telehealth." },
      { h: "Weekly charts", p: "Appointment count per weekday and a signed-vs-pending documentation gauge for the current week." },
    ],
    body: `
    <div id="greeting">
      <div class="h1">Good morning, Sarah</div>
      <div class="sub">Friday, August 28 · MD, FAPA · Penfield Psychiatry</div>
    </div>
    <div class="kpis" id="kpi-row">
      <div class="kpi amber" id="kpi-unsigned"><div class="kl"><svg class="ico" style="width:14px;height:14px"><use href="#i-note"/></svg>Unsigned notes</div><div class="kv">3</div><div class="kd">$545 unbilled</div></div>
      <div class="kpi"><div class="kl"><svg class="ico" style="width:14px;height:14px"><use href="#i-cal"/></svg>Today's appts</div><div class="kv">10</div><div class="kd">0 done</div></div>
      <div class="kpi"><div class="kl"><svg class="ico" style="width:14px;height:14px"><use href="#i-door"/></svg>In waiting room</div><div class="kv">2</div><div class="kd">2 checked in</div></div>
      <div class="kpi"><div class="kl"><svg class="ico" style="width:14px;height:14px"><use href="#i-task"/></svg>Open tasks</div><div class="kv">5</div><div class="kd">1 overdue</div></div>
    </div>
    <div class="card sec" id="needs-sig">
      <div class="sec-h"><div class="st"><span class="sec-ic" style="background:#fef3c7"><svg class="ico" style="width:14px;height:14px;color:#d97706"><use href="#i-alert"/></svg></span>Needs your signature <span style="color:#d97706;font-weight:700">3 · $545</span></div><div class="sa">All notes <svg class="ico" style="width:13px;height:13px"><use href="#i-arrow"/></svg></div></div>
      <table class="t">
        <tr><td style="font-weight:600">Carmen Rivera</td><td><span class="row" style="gap:7px"><span class="dot" style="background:#f43f5e"></span>Crisis Visit</span></td><td class="muted">$240</td><td style="color:#dc2626;font-weight:600">6d old</td><td style="text-align:right"><a>Open note →</a></td></tr>
        <tr><td style="font-weight:600">David Okafor</td><td><span class="row" style="gap:7px"><span class="dot" style="background:#05a99a"></span>Follow-Up</span></td><td class="muted">$130</td><td style="color:#d97706;font-weight:600">3d old</td><td style="text-align:right"><a>Open note →</a></td></tr>
        <tr><td style="font-weight:600">Daniel Carter</td><td><span class="row" style="gap:7px"><span class="dot" style="background:#1a5c9e"></span>Med Management</span></td><td class="muted">$175</td><td class="muted">1d old</td><td style="text-align:right"><a>Open note →</a></td></tr>
      </table>
    </div>
    <div class="card sec" id="schedule">
      <div class="sec-h"><div class="st">Today's schedule</div><div class="sa">Calendar <svg class="ico" style="width:13px;height:13px"><use href="#i-arrow"/></svg></div></div>
      <div class="sched-row"><span class="bar" style="background:#0ea5e9"></span><div style="flex:1"><div style="font-weight:600;font-size:13px">James Holloway</div><div class="muted" style="font-size:12px">Initial Consultation</div></div><div style="text-align:right;font-size:12px"><div style="font-weight:600">9:00 AM</div><div class="muted">In-Person</div></div><button class="mini-btn" id="checkin-btn">Check in</button></div>
      <div class="sched-row"><span class="bar" style="background:#1a5c9e"></span><div style="flex:1"><div style="font-weight:600;font-size:13px">Elena Vasquez</div><div class="muted" style="font-size:12px">Med Management</div></div><div style="text-align:right;font-size:12px"><div style="font-weight:600">10:00 AM</div><div class="muted">In-Person</div></div></div>
      <div class="sched-row"><span class="bar" style="background:#05a99a"></span><div style="flex:1"><div style="font-weight:600;font-size:13px">Marcus Webb</div><div class="muted" style="font-size:12px">Follow-Up</div></div><div style="text-align:right;font-size:12px"><div style="font-weight:600">11:00 AM</div><div class="muted">Telehealth</div></div><button class="mini-btn">Join</button></div>
    </div>
    <div class="charts" id="charts">
      <div class="card" style="padding:16px 18px"><div style="font-size:13px;font-weight:600;margin-bottom:12px">Appointments this week</div><div class="bars"><i style="height:40%"></i><i style="height:65%"></i><i style="height:20%"></i><i style="height:70%"></i><i class="on" style="height:100%"></i><i style="height:10%"></i><i style="height:6%"></i></div></div>
      <div class="card" style="padding:16px 18px"><div style="font-size:13px;font-weight:600;margin-bottom:12px">Documentation status</div><div class="row" style="gap:16px"><div class="donut"></div><div><div style="font-size:22px;font-weight:700">62%</div><div class="muted" style="font-size:12px">notes signed</div><div style="font-size:11px;color:#d97706;margin-top:2px">3 awaiting signature</div></div></div></div>
    </div>
    <div class="grid2" id="secondary">
      <div class="mini"><b>Tasks</b><div class="li"><span class="dot" style="background:#ef4444"></span>Co-sign resident note<span style="margin-left:auto;color:#ef4444;font-weight:600">today</span></div><div class="li"><span class="dot" style="background:#f59e0b"></span>Prior auth — Vyvanse<span style="margin-left:auto" class="muted">today</span></div></div>
      <div class="mini"><b>Unread messages</b><div class="li">Daniel Carter<span class="muted" style="margin-left:auto">Feeling worse this week</span></div><div class="li">Elena Vasquez<span class="muted" style="margin-left:auto">Move appointment?</span></div></div>
      <div class="mini"><b>Results to review</b><div class="li"><span class="dot" style="background:#ef4444"></span>Daniel Carter · Lithium level</div><div class="li"><span class="dot" style="background:#f59e0b"></span>David Okafor · CMP</div></div>
      <div class="mini"><b>Refill requests</b><div class="li">Robert Flynn · Sertraline</div><div class="li">Marcus Webb · Vyvanse</div></div>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── CALENDAR ───────────────────────── */
  {
    file: "Calendar.dc.html", active: "calendar", name: "Calendar", crumb: "Schedule",
    welcome: { title: "Your week at a glance", body: "The calendar shows your own appointments across this week and the next two. Here's how to read and work it." },
    steps: [
      { id: "cal-nav", title: "Move through your weeks", body: "Step back and forward a week at a time, or jump to today. Appointments are loaded for this week plus the next two." },
      { id: "cal-legend", title: "Colour = visit type", body: "Every card is coloured by its visit type. Click a colour in the legend to show only that type." },
      { id: "cal-appt", title: "Open an appointment", body: "Click any card to open its detail drawer — patient, insurance, forms, and the check-in / start-session actions." },
      { id: "cal-now", title: "The red line is now", body: "A live marker shows the current time on today's column, so you can see what's next at a glance." },
      { id: "cal-filters", title: "Narrow the view", body: "Filter by mode or status, and toggle cancelled appointments on or off." },
      { id: "help-btn", title: "That's the calendar", body: "The ? opens the calendar help guide and replays this tour whenever you need it.", isHelpBtn: true },
    ],
    helpIntro: "The calendar is your own schedule — this provider's appointments only, three weeks wide, colour-coded by visit type.",
    helpDoc: [
      { h: "Navigation", p: "Previous / next week and a Today jump. The header shows the week range." },
      { h: "Visit-type legend", p: "Spravato, Med Management, Initial Consultation, Talk Therapy, TMS, Follow-Up, Crisis Visit, Group Session — each has a fixed colour. Click one to filter." },
      { h: "Overlapping appointments", p: "Appointments in the same slot are packed side by side so nothing is hidden." },
      { h: "The now line", p: "A red horizontal line with a dot marks the current time on today's column, updating every minute." },
      { h: "Filters", p: "Mode (in-person / telehealth / phone), status, and a Cancelled toggle. A List view is one click away." },
    ],
    body: `
    <div class="toolbar" id="cal-nav">
      <div style="display:flex;gap:4px"><span class="chip" style="padding:6px 8px"><svg class="ico"><use href="#i-chevr"/></svg></span><span class="chip" style="padding:6px 8px"><svg class="ico" style="transform:scaleX(-1)"><use href="#i-chevr"/></svg></span></div>
      <div style="font-size:14px;font-weight:600">Aug 24 – Aug 30, 2026</div>
      <span class="chip" style="background:#f1f5f9;border-color:#f1f5f9">Today</span>
      <div style="margin-left:auto;display:flex;gap:8px" id="cal-filters">
        <span class="chip"><svg class="ico"><use href="#i-slid"/></svg>Filters</span>
        <span class="chip"><svg class="ico"><use href="#i-ban"/></svg>Cancelled</span>
        <span class="chip"><svg class="ico"><use href="#i-list"/></svg>List</span>
      </div>
    </div>
    <div class="legend" id="cal-legend">
      <span><i style="background:#6366f1"></i>Spravato</span><span><i style="background:#1a5c9e"></i>Med Management</span><span><i style="background:#0ea5e9"></i>Initial Consultation</span><span><i style="background:#f59e0b"></i>Talk Therapy</span><span><i style="background:#10b981"></i>TMS</span><span><i style="background:#05a99a"></i>Follow-Up</span><span><i style="background:#f43f5e"></i>Crisis Visit</span><span><i style="background:#64748b"></i>Group Session</span>
    </div>
    <div class="wk">
      <div class="wk-h" style="border-left:none"></div>
      <div class="wk-h">Mon 24</div><div class="wk-h">Tue 25</div><div class="wk-h">Wed 26</div><div class="wk-h">Thu 27</div><div class="wk-h on">Fri 28</div><div class="wk-h">Sat 29</div><div class="wk-h">Sun 30</div>
      <div><div class="wk-t" style="height:64px">9a</div><div class="wk-t" style="height:64px">10a</div><div class="wk-t" style="height:64px">11a</div><div class="wk-t" style="height:64px">12p</div><div class="wk-t" style="height:64px">1p</div></div>
      <div class="wk-c"></div>
      <div class="wk-c"><div class="appt" style="top:8px;height:40px;background:#dbeafe;border-color:#1a5c9e;color:#1a5c9e"><b>Elena Vasquez</b><br>Med Mgmt</div></div>
      <div class="wk-c"></div>
      <div class="wk-c"><div class="appt" style="top:4px;height:56px;background:#e0f2fe;border-color:#0ea5e9;color:#0369a1"><b>Marcus Webb</b><br>Initial</div><div class="appt" style="top:150px;height:80px;background:#ecfdf5;border-color:#10b981;color:#047857"><b>Robert Flynn</b><br>TMS</div></div>
      <div class="wk-c" id="cal-appt"><div class="appt" style="top:4px;height:56px;background:#e0f2fe;border-color:#0ea5e9;color:#0369a1"><b>James Holloway</b><br>Initial Consultation</div><div class="appt" style="top:66px;height:36px;background:#dbeafe;border-color:#1a5c9e;color:#1a5c9e"><b>Elena V.</b> Med Mgmt</div><div class="appt" style="top:130px;height:130px;background:#eef2ff;border-color:#6366f1;color:#4338ca"><b>Daniel Carter</b><br>Spravato · 2 hr</div>
        <div class="nowline" style="left:0;right:0;top:34px"></div>
        <div id="cal-now" style="position:absolute;left:-2px;top:26px;width:14px;height:14px"></div>
      </div>
      <div class="wk-c"></div>
      <div class="wk-c"></div>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── LIST ───────────────────────── */
  {
    file: "List.dc.html", active: "list", name: "Appointment list", crumb: "Schedule",
    welcome: { title: "Every appointment, as a table", body: "The list view is a filterable table of your own appointments — good for scanning, searching and jumping to a specific visit." },
    steps: [
      { id: "list-summary", title: "The numbers first", body: "Upcoming, completed, and how many need a note — a quick health check on your schedule." },
      { id: "list-range", title: "Pick a window", body: "Upcoming, next 7 days, past, or all. The table groups by day underneath." },
      { id: "list-filters", title: "Filter and search", body: "Status, mode, and visit type, plus free-text search by patient or visit type." },
      { id: "list-row", title: "Open the drawer", body: "Click any row to open the same appointment detail drawer you get from the calendar." },
      { id: "list-note", title: "Note status inline", body: "The Note column shows whether that visit's encounter note is a draft or signed, without opening anything." },
      { id: "help-btn", title: "That's the list", body: "The ? opens this page's help guide and replays the tour any time.", isHelpBtn: true },
    ],
    helpIntro: "The list view is a dense, filterable table of your appointments — the fastest way to find one visit or scan status across many.",
    helpDoc: [
      { h: "Summary strip", p: "Upcoming count, completed count, and 'need note' — completed visits whose encounter note isn't signed yet." },
      { h: "Range", p: "Upcoming, Next 7 days, Past, All. Rows are grouped by date." },
      { h: "Filters", p: "Status, mode and visit type dropdowns, plus a search box matching patient name or visit type." },
      { h: "Note column", p: "A draft or signed marker per row, so you can spot unbilled visits from the list." },
      { h: "Row click", p: "Opens the shared appointment detail drawer — the same one the calendar uses." },
    ],
    body: `
    <div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="h1">My Appointments</div><div class="sub">30 appointments</div></div><div class="fld" style="width:230px;color:#94a3b8"><svg class="ico" style="width:13px;height:13px;display:inline;vertical-align:-2px"><use href="#i-search"/></svg> Search patient or visit type…</div></div>
    <div class="kpi3" id="list-summary" style="margin-top:16px;max-width:460px">
      <div class="kpi"><div class="kv" style="font-size:20px;color:#0a827a">30</div><div class="kd">Upcoming</div></div>
      <div class="kpi"><div class="kv" style="font-size:20px;color:#059669">0</div><div class="kd">Completed</div></div>
      <div class="kpi"><div class="kv" style="font-size:20px;color:#94a3b8">0</div><div class="kd">Need note</div></div>
    </div>
    <div class="toolbar" id="list-filters">
      <div class="seg" id="list-range"><b class="on">Upcoming</b><b>Next 7 days</b><b>Past</b><b>All</b></div>
      <span class="chip">All statuses <svg class="ico"><use href="#i-chevd"/></svg></span>
      <span class="chip">All modes <svg class="ico"><use href="#i-chevd"/></svg></span>
      <span class="chip">All visit types <svg class="ico"><use href="#i-chevd"/></svg></span>
    </div>
    <div style="font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#0a827a;margin:6px 0 8px">Today · Friday, August 28</div>
    <div class="card" style="overflow:hidden">
      <table class="t">
        <tr style="background:#f8fafc;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em"><td>Time</td><td>Patient</td><td>Visit type</td><td>Mode</td><td>Status</td><td>Note</td></tr>
        <tr id="list-row"><td class="muted">9:00 AM</td><td style="font-weight:600">James Holloway</td><td><span class="row" style="gap:7px"><span class="dot" style="background:#0ea5e9"></span>Initial Consultation</span></td><td class="muted">In-Person</td><td><span class="pill" style="background:#cbfbf3;color:#0a827a">Confirmed</span></td><td id="list-note"><span class="muted" style="font-size:12px">—</span></td></tr>
        <tr><td class="muted">10:00 AM</td><td style="font-weight:600">Elena Vasquez</td><td><span class="row" style="gap:7px"><span class="dot" style="background:#1a5c9e"></span>Med Management</span></td><td class="muted">In-Person</td><td><span class="pill" style="background:#cbfbf3;color:#0a827a">Confirmed</span></td><td><span class="muted" style="font-size:12px">—</span></td></tr>
        <tr><td class="muted">12:00 PM</td><td style="font-weight:600">Marcus Webb</td><td><span class="row" style="gap:7px"><span class="dot" style="background:#1a5c9e"></span>Med Management</span></td><td class="muted">In-Person</td><td><span class="pill" style="background:#dbeafe;color:#1d4ed8">Checked In</span></td><td><span style="font-size:12px;color:#d97706;font-weight:600">Draft</span></td></tr>
        <tr><td class="muted">1:30 PM</td><td style="font-weight:600">Daniel Carter</td><td><span class="row" style="gap:7px"><span class="dot" style="background:#6366f1"></span>Spravato</span></td><td class="muted">In-Person</td><td><span class="pill" style="background:#cbfbf3;color:#0a827a">Confirmed</span></td><td><span class="muted" style="font-size:12px">—</span></td></tr>
      </table>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── ENCOUNTER NOTES ───────────────────────── */
  {
    file: "EncounterNotes.dc.html", active: "notes", name: "Encounter Notes", crumb: "Encounter Notes",
    welcome: { title: "Where your notes get finished", body: "This is the queue of clinical notes for your visits. An unsigned note can't be billed — so this page has a revenue edge." },
    steps: [
      { id: "en-intro", title: "Unsigned = unbilled", body: "The heading says it plainly: until a note is signed, the visit behind it produces no revenue." },
      { id: "en-tabs", title: "Pending vs Signed", body: "Pending holds drafts and notes awaiting co-signature. Signed is your completed history." },
      { id: "en-age", title: "Age flags urgency", body: "How long a note has been sitting. It stays grey, turns amber after a couple of days, and red past a week." },
      { id: "en-open", title: "Open to sign", body: "Open takes you into the full SOAP editor. Signing there also sends the charge to billing." },
      { id: "nav-badge", title: "Always visible", body: "The number on 'Encounter Notes' in the sidebar is your unsigned count — it follows you around the portal." },
      { id: "help-btn", title: "That's this page", body: "The ? opens the notes help guide and replays this tour any time.", isHelpBtn: true },
    ],
    helpIntro: "This is the working queue for clinical documentation. Every visit needs a signed note before it can be billed.",
    helpDoc: [
      { h: "Pending tab", p: "Drafts and notes awaiting co-signature. The count matches the sidebar badge." },
      { h: "Signed tab", p: "Your completed, locked notes, most recent first." },
      { h: "Age column", p: "Time since the date of service. Grey, then amber after 2 days, then red past 7." },
      { h: "Open / View", p: "Open loads the SOAP editor for a draft; View opens a signed note read-only." },
      { h: "Signing sends the charge", p: "When you sign, a charge with the CPT and diagnoses is created for Revenue Management automatically." },
    ],
    body: `
    <div class="row" id="en-intro" style="gap:12px;margin-bottom:6px"><span class="sec-ic" style="width:38px;height:38px;background:#cbfbf3"><svg class="ico" style="color:#0a827a"><use href="#i-note"/></svg></span><div><div class="h1">Encounter Notes</div><div class="sub">Clinical documentation for your visits — an unsigned note is unbilled revenue.</div></div></div>
    <div class="tabbar" id="en-tabs" style="margin-top:14px"><div class="tab on">Pending (3)</div><div class="tab">Signed</div></div>
    <div class="toolbar"><span class="chip">All note types <svg class="ico"><use href="#i-chevd"/></svg></span><span class="chip"><svg class="ico"><use href="#i-search"/></svg>Search patient…</span></div>
    <div class="card" style="overflow:hidden">
      <table class="t">
        <tr style="background:#f8fafc;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em"><td>Patient</td><td>Visit type</td><td>Note type</td><td>Date of service</td><td>Status</td><td>Age</td><td></td></tr>
        <tr><td style="font-weight:600">Carmen Rivera</td><td><span class="row" style="gap:7px"><span class="dot" style="background:#f43f5e"></span>Crisis Visit</span></td><td class="muted">SOAP</td><td class="muted">Aug 21, 2026</td><td><span class="pill" style="background:#f1f5f9;color:#475569">Draft</span></td><td id="en-age" style="color:#dc2626;font-weight:600">6d</td><td style="text-align:right"><span class="chip" id="en-open"><svg class="ico"><use href="#i-note"/></svg>Open</span></td></tr>
        <tr><td style="font-weight:600">David Okafor</td><td><span class="row" style="gap:7px"><span class="dot" style="background:#05a99a"></span>Follow-Up</span></td><td class="muted">SOAP</td><td class="muted">Aug 24, 2026</td><td><span class="pill" style="background:#f1f5f9;color:#475569">Draft</span></td><td style="color:#d97706;font-weight:600">3d</td><td style="text-align:right"><span class="chip"><svg class="ico"><use href="#i-note"/></svg>Open</span></td></tr>
        <tr><td style="font-weight:600">Daniel Carter</td><td><span class="row" style="gap:7px"><span class="dot" style="background:#1a5c9e"></span>Med Management</span></td><td class="muted">SOAP</td><td class="muted">Aug 26, 2026</td><td><span class="pill" style="background:#f1f5f9;color:#475569">Draft</span></td><td class="muted">1d</td><td style="text-align:right"><span class="chip"><svg class="ico"><use href="#i-note"/></svg>Open</span></td></tr>
      </table>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── WAITING ROOM ───────────────────────── */
  {
    file: "WaitingRoom.dc.html", active: "waiting", name: "Waiting Room", crumb: "Waiting Room",
    welcome: { title: "Who's here, right now", body: "The waiting room shows only your own checked-in patients — in person and in the virtual lobby." },
    steps: [
      { id: "wr-stats", title: "The room at a glance", body: "How many are waiting, how many are with you, average wait, and total checked in today." },
      { id: "wr-tabs", title: "In person vs telehealth", body: "Split the view by mode. Telehealth patients waiting appear as 'In Virtual Lobby'." },
      { id: "wr-card", title: "One card per patient", body: "Name, MRN, visit type, wait time, and room. Insurance warnings surface here too." },
      { id: "wr-call", title: "Call in, then start", body: "'Call In' marks the patient as ready; 'Start Session' opens their encounter note. Telehealth shows 'Join Call'." },
      { id: "help-btn", title: "That's the waiting room", body: "The ? opens the waiting-room help guide and replays this tour.", isHelpBtn: true },
    ],
    helpIntro: "The waiting room is a live list of your checked-in patients — it only fills once someone is actually here.",
    helpDoc: [
      { h: "What shows here", p: "Only your patients with a status of arrived or in-session. A confirmed appointment for later today does not appear." },
      { h: "Stat tiles", p: "In waiting room, with provider, average wait, and total checked in today." },
      { h: "Mode tabs", p: "All / In Person / Telehealth / Phone. Telehealth waiters read 'In Virtual Lobby'." },
      { h: "Actions", p: "Call In → Start Session (opens the SOAP note) for in-person; Join Call for telehealth; Check Out when done." },
      { h: "Insurance flags", p: "An amber warning appears on the card when eligibility is inactive or pending." },
    ],
    body: `
    <div class="h1">Waiting Room</div><div class="sub">Dr. Sarah Mitchell · All patients</div>
    <div class="kpis" id="wr-stats" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi" style="text-align:center"><div class="kv" style="color:#d97706">2</div><div class="kd">In waiting room</div></div>
      <div class="kpi" style="text-align:center"><div class="kv" style="color:#059669">0</div><div class="kd">With provider</div></div>
      <div class="kpi" style="text-align:center"><div class="kv" style="color:#2563eb">0m</div><div class="kd">Avg wait</div></div>
      <div class="kpi" style="text-align:center"><div class="kv" style="color:#475569">2</div><div class="kd">Checked in</div></div>
    </div>
    <div class="tabbar" id="wr-tabs" style="margin-top:20px"><div class="tab on">All 2</div><div class="tab">In Person 1</div><div class="tab">Telehealth 1</div><div class="tab">Phone</div></div>
    <div style="font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#64748b;margin:14px 0 10px">Waiting</div>
    <div class="card" id="wr-card" style="padding:16px 18px;display:flex;align-items:center;gap:14px">
      <div class="avatar">EV</div>
      <div style="flex:1">
        <div class="row" style="gap:8px"><b style="font-size:14px">Elena Vasquez</b><span class="muted" style="font-size:11px">MRN-00102</span><span class="pill" style="background:#fef3c7;color:#b45309">Waiting</span></div>
        <div class="row muted" style="gap:10px;margin-top:4px;font-size:12px"><span class="pill" style="background:#dbeafe;color:#1d4ed8">In Person</span><span>Med Management</span><span>· Scheduled 10:00 AM</span><span>· Room 101</span></div>
      </div>
      <button class="mini-btn" id="wr-call">Call In</button>
    </div>
    <div class="card" style="padding:16px 18px;display:flex;align-items:center;gap:14px;margin-top:12px">
      <div class="avatar">CR</div>
      <div style="flex:1">
        <div class="row" style="gap:8px"><b style="font-size:14px">Carmen Rivera</b><span class="muted" style="font-size:11px">MRN-00114</span><span class="pill" style="background:#cbfbf3;color:#0a827a">In Virtual Lobby</span></div>
        <div class="row" style="gap:10px;margin-top:4px;font-size:12px"><span class="pill" style="background:#cbfbf3;color:#0a827a">Telehealth</span><span class="muted">Follow-Up · Scheduled 10:30 AM</span></div>
      </div>
      <button class="mini-btn"><svg class="ico" style="width:12px;height:12px;display:inline;vertical-align:-2px"><use href="#i-video"/></svg> Join Call</button>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── MESSAGES ───────────────────────── */
  {
    file: "Messages.dc.html", active: "messages", name: "Messages", crumb: "Messages",
    welcome: { title: "Two inboxes, one place", body: "Secure messages from patients and internal notes from staff, pharmacy and labs — kept on separate channels." },
    steps: [
      { id: "msg-channels", title: "Patients or Internal", body: "Switch channels here. Patient threads and internal (staff / pharmacy / lab) threads never mix." },
      { id: "msg-unread", title: "Unread stands out", body: "A dot and bold text mark threads you haven't opened. The sidebar count follows the Patients channel." },
      { id: "msg-urgent", title: "Urgent is flagged", body: "A red marker means the sender flagged it urgent — these sort to the top." },
      { id: "msg-thread", title: "Open a conversation", body: "Click a thread to read the full history in the reading pane." },
      { id: "msg-reply", title: "Reply inline", body: "Answer from the box at the bottom — attachments and quick templates are there too." },
      { id: "help-btn", title: "That's messages", body: "The ? opens the messages help guide and replays this tour.", isHelpBtn: true },
    ],
    helpIntro: "Messages keeps patient correspondence and internal coordination on separate channels so nothing gets lost between them.",
    helpDoc: [
      { h: "Channels", p: "Patients (direct secure messaging) and Internal (staff, pharmacy, lab). Each has its own unread count." },
      { h: "Unread & urgent", p: "Unread threads show a dot and bold subject. Urgent-flagged threads carry a red marker and sort first." },
      { h: "Reading pane", p: "The full thread with timestamps and sender roles. Your replies are marked as from you." },
      { h: "Replying", p: "Compose at the bottom of the thread. Internal threads can be linked to a patient chart." },
    ],
    body: `
    <div class="h1">Messages</div>
    <div class="tabbar" id="msg-channels" style="margin-top:12px"><div class="tab on">Patients (4)</div><div class="tab">Internal (2)</div></div>
    <div class="row" style="align-items:stretch;gap:0;margin-top:14px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;background:#fff;height:440px">
      <div style="width:300px;border-right:1px solid #e2e8f0;overflow:hidden">
        <div id="msg-urgent" style="padding:13px 15px;border-bottom:1px solid #f1f5f9;background:#fef2f2"><div class="row" style="gap:7px"><span class="dot" style="background:#ef4444"></span><b style="font-size:13px">Daniel Carter</b><svg class="ico" style="width:13px;height:13px;color:#ef4444;margin-left:auto"><use href="#i-alert"/></svg></div><div class="muted" style="font-size:12px;margin-top:2px">Feeling much worse this week</div></div>
        <div id="msg-unread" style="padding:13px 15px;border-bottom:1px solid #f1f5f9"><div class="row" style="gap:7px"><span class="dot" style="background:#05a99a"></span><b style="font-size:13px">James Holloway</b></div><div class="muted" style="font-size:12px;margin-top:2px">Nausea after starting Sertraline</div></div>
        <div id="msg-thread" style="padding:13px 15px;border-bottom:1px solid #f1f5f9;background:#f8fafc"><div class="row" style="gap:7px"><b style="font-size:13px;font-weight:500;color:#475569">Elena Vasquez</b></div><div class="muted" style="font-size:12px;margin-top:2px">Can we move next week's appointment?</div></div>
      </div>
      <div style="flex:1;display:flex;flex-direction:column">
        <div style="padding:14px 18px;border-bottom:1px solid #f1f5f9"><b style="font-size:14px">Elena Vasquez</b><div class="muted" style="font-size:12px">Can we move next week's appointment?</div></div>
        <div style="flex:1;padding:18px;font-size:13px;color:#475569">
          <div style="background:#f1f5f9;border-radius:10px;padding:10px 12px;max-width:70%">Something came up at work — is there any chance we could move Tuesday's follow-up a few days later?</div>
          <div class="muted" style="font-size:11px;margin-top:4px">Elena · 3h ago</div>
        </div>
        <div id="msg-reply" style="border-top:1px solid #f1f5f9;padding:12px 16px"><div class="fld" style="color:#94a3b8">Write a reply…</div></div>
      </div>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── PATIENTS ───────────────────────── */
  {
    file: "Patients.dc.html", active: "patients", name: "Patients", crumb: "Patients",
    welcome: { title: "Your patient panel", body: "Every patient you have an appointment with. Search, shape the columns, filter, and open a full 360° chart." },
    steps: [
      { id: "pt-search", title: "Find anyone fast", body: "Search by name, MRN, email or phone. Results narrow as you type." },
      { id: "pt-cols", title: "Choose your columns", body: "Show or hide optional columns — gender/age, clinic, insurance, last visit, next appointment — to fit how you work." },
      { id: "pt-filters", title: "Advanced filters", body: "Care coordinator, status, age range, upcoming appointment, insurance status. Active filters show as removable chips." },
      { id: "pt-name", title: "Open the 360° chart", body: "Click a name to open the full patient profile — overview, appointments, encounters, allergies, vitals, forms, timeline and more." },
      { id: "pt-refer", title: "Refer a patient", body: "Send a referral to another provider or an external clinic without leaving the list." },
      { id: "help-btn", title: "That's the patient list", body: "The ? opens the patients help guide and replays this tour.", isHelpBtn: true },
    ],
    helpIntro: "The patient list is your working panel — the patients you actually see — with a configurable table and a deep chart behind every name.",
    helpDoc: [
      { h: "Scope", p: "Patients with any appointment with you. Not the whole clinic's roster." },
      { h: "Columns", p: "A default set plus optional columns you toggle: gender/age, clinic, patient type, insurance, last visit, next appointment, status." },
      { h: "Filters", p: "Care coordinator, active/inactive, age range, has upcoming appointment, insurance status — surfaced as chips you can clear." },
      { h: "The 360° profile", p: "Name links to a sticky highlight bar plus a 16-section chart: overview, appointments, encounters, messages, tasks, allergies, vitals, forms, documents, PHR, timeline, emails and more." },
      { h: "Refer Patient", p: "Opens a modal to send a referral to an internal provider or external clinic with a reason and note." },
    ],
    body: `
    <div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="h1">My Patients</div><div class="sub">15 patients</div></div><button class="mini-btn" id="pt-refer" style="padding:8px 14px"><svg class="ico" style="width:13px;height:13px;display:inline;vertical-align:-2px"><use href="#i-refer"/></svg> Refer Patient</button></div>
    <div class="toolbar">
      <div class="fld" id="pt-search" style="width:280px;color:#94a3b8"><svg class="ico" style="width:13px;height:13px;display:inline;vertical-align:-2px"><use href="#i-search"/></svg> Search name, MRN, email or phone…</div>
      <span class="chip" id="pt-cols"><svg class="ico"><use href="#i-list"/></svg>Columns <svg class="ico"><use href="#i-chevd"/></svg></span>
      <span class="chip" id="pt-filters"><svg class="ico"><use href="#i-slid"/></svg>Filters</span>
    </div>
    <div class="card" style="overflow:hidden">
      <table class="t">
        <tr style="background:#f8fafc;font-size:11px;font-weight:600;color:#64748b;text-transform:uppercase;letter-spacing:.04em"><td>Patient</td><td>Full name</td><td>Date of birth</td><td>Mobile</td><td>Care coordinator</td><td></td></tr>
        <tr><td><div class="row" style="gap:9px"><div class="avatar" style="width:28px;height:28px;font-size:10px">JH</div><span class="muted" style="font-size:11px">MRN-00101</span></div></td><td id="pt-name"><a style="font-weight:600">James Holloway</a></td><td class="muted">Apr 12, 1985</td><td class="muted">(585) 412-0101</td><td class="muted">Jordan Lee</td><td style="text-align:right"><span class="chip" style="padding:5px 10px">View</span></td></tr>
        <tr><td><div class="row" style="gap:9px"><div class="avatar" style="width:28px;height:28px;font-size:10px">EV</div><span class="muted" style="font-size:11px">MRN-00102</span></div></td><td><a style="font-weight:600">Elena Vasquez</a></td><td class="muted">Jul 30, 1992</td><td class="muted">(315) 498-0202</td><td class="muted">Jordan Lee</td><td style="text-align:right"><span class="chip" style="padding:5px 10px">View</span></td></tr>
        <tr><td><div class="row" style="gap:9px"><div class="avatar" style="width:28px;height:28px;font-size:10px">MW</div><span class="muted" style="font-size:11px">MRN-00103</span></div></td><td><a style="font-weight:600">Marcus Webb</a></td><td class="muted">Jan 19, 1978</td><td class="muted">(585) 512-0303</td><td class="muted">Priya Shah</td><td style="text-align:right"><span class="chip" style="padding:5px 10px">View</span></td></tr>
      </table>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── TASKS ───────────────────────── */
  {
    file: "Tasks.dc.html", active: "tasks", name: "Tasks", crumb: "Tasks",
    welcome: { title: "Your task queue", body: "Chart reviews, prior authorisations, callbacks and admin work assigned to you — sorted so the pressing items sit on top." },
    steps: [
      { id: "tk-filters", title: "Slice the list", body: "Filter by type or status. Open tasks show first; done tasks move out of the way." },
      { id: "tk-priority", title: "Priority at a glance", body: "A coloured dot: red for overdue, amber for high priority, grey for routine." },
      { id: "tk-overdue", title: "Due dates that bite", body: "'Overdue by 1 day' turns red so nothing quietly slips." },
      { id: "tk-complete", title: "Close it out", body: "Mark a task done from its row — it drops off the open list immediately." },
      { id: "help-btn", title: "That's tasks", body: "The ? opens the tasks help guide and replays this tour.", isHelpBtn: true },
    ],
    helpIntro: "Tasks is the catch-all for non-visit work assigned to you — kept in one prioritised list rather than scattered across messages.",
    helpDoc: [
      { h: "Types", p: "Chart review, prior auth, callback, lab follow-up and admin. Each carries a patient link where relevant." },
      { h: "Priority", p: "Red dot = overdue, amber = high, grey = routine. The list sorts overdue first." },
      { h: "Due labels", p: "Due today / tomorrow / Friday, or 'Overdue by N days' in red." },
      { h: "Completing", p: "Mark done from the row. Completed tasks stay searchable under the Done filter." },
    ],
    body: `
    <div class="h1">Tasks</div><div class="sub">5 open · 1 overdue</div>
    <div class="toolbar" id="tk-filters"><div class="seg"><b class="on">Open</b><b>Done</b><b>All</b></div><span class="chip">All types <svg class="ico"><use href="#i-chevd"/></svg></span></div>
    <div class="card" style="overflow:hidden">
      <div class="row" style="gap:12px;padding:14px 18px"><span class="dot" style="background:#ef4444" id="tk-priority"></span><div style="flex:1"><b style="font-size:13px">Return call: medication side effects</b><div class="muted" style="font-size:12px">Robert Flynn · reported nausea after dose increase</div></div><span id="tk-overdue" style="font-size:12px;color:#ef4444;font-weight:600">Overdue by 1 day</span><span class="chip" id="tk-complete" style="padding:5px 10px"><svg class="ico"><use href="#i-check"/></svg>Done</span></div>
      <div class="row row-b" style="gap:12px;padding:14px 18px"><span class="dot" style="background:#f59e0b"></span><div style="flex:1"><b style="font-size:13px">Co-sign resident progress note</b><div class="muted" style="font-size:12px">Elena Vasquez · awaiting co-signature</div></div><span class="muted" style="font-size:12px">Due today</span><span class="chip" style="padding:5px 10px"><svg class="ico"><use href="#i-check"/></svg>Done</span></div>
      <div class="row row-b" style="gap:12px;padding:14px 18px"><span class="dot" style="background:#f59e0b"></span><div style="flex:1"><b style="font-size:13px">Prior authorization — Vyvanse 40mg</b><div class="muted" style="font-size:12px">Marcus Webb · Cigna requesting documentation</div></div><span class="muted" style="font-size:12px">Due today</span><span class="chip" style="padding:5px 10px"><svg class="ico"><use href="#i-check"/></svg>Done</span></div>
      <div class="row row-b" style="gap:12px;padding:14px 18px"><span class="dot" style="background:#cbd5e1"></span><div style="flex:1"><b style="font-size:13px">Review abnormal CMP before next visit</b><div class="muted" style="font-size:12px">David Okafor · flag before Thursday</div></div><span class="muted" style="font-size:12px">Due tomorrow</span><span class="chip" style="padding:5px 10px"><svg class="ico"><use href="#i-check"/></svg>Done</span></div>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── REPORTS ───────────────────────── */
  {
    file: "Reports.dc.html", active: "reports", name: "Reports", crumb: "Reports",
    welcome: { title: "Your numbers over time", body: "Volume, documentation timeliness and productivity for your own panel — pick a period and read the trend." },
    steps: [
      { id: "rp-range", title: "Set the period", body: "This month, last 90 days, year to date, or a custom range. Everything on the page follows it." },
      { id: "rp-kpi", title: "Headline metrics", body: "Visits, no-show rate, average days to sign a note, and encounters billed." },
      { id: "rp-chart", title: "See the trend", body: "Each metric expands into a chart so you can spot a drift before it becomes a problem." },
      { id: "rp-export", title: "Take it with you", body: "Export the current view to CSV or PDF for supervision or your own records." },
      { id: "help-btn", title: "That's reports", body: "The ? opens the reports help guide and replays this tour.", isHelpBtn: true },
    ],
    helpIntro: "Reports summarises your own clinical activity over a period you choose — for self-review and supervision, not clinic-wide analytics.",
    helpDoc: [
      { h: "Period", p: "A range selector drives every metric and chart on the page." },
      { h: "Headline metrics", p: "Completed visits, no-show rate, average time to sign a note, and encounters sent to billing." },
      { h: "Trend charts", p: "Each metric plots over the selected period so you can see direction, not just a single number." },
      { h: "Export", p: "CSV for a spreadsheet, PDF for a printable summary." },
    ],
    body: `
    <div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="h1">Reports</div><div class="sub">Your activity · Aug 1 – Aug 28, 2026</div></div><span class="chip" id="rp-export"><svg class="ico"><use href="#i-arrow"/></svg>Export</span></div>
    <div class="toolbar" id="rp-range"><div class="seg"><b class="on">This month</b><b>Last 90 days</b><b>Year to date</b><b>Custom</b></div></div>
    <div class="kpis" id="rp-kpi" style="grid-template-columns:repeat(4,1fr)">
      <div class="kpi"><div class="kl">Completed visits</div><div class="kv">142</div><div class="kd" style="color:#059669">▲ 6% vs last month</div></div>
      <div class="kpi"><div class="kl">No-show rate</div><div class="kv">4.2%</div><div class="kd muted">28 of 170</div></div>
      <div class="kpi"><div class="kl">Avg days to sign</div><div class="kv">1.8</div><div class="kd" style="color:#d97706">▲ 0.3 vs last month</div></div>
      <div class="kpi"><div class="kl">Encounters billed</div><div class="kv">138</div><div class="kd muted">$21,400</div></div>
    </div>
    <div class="card" id="rp-chart" style="margin-top:20px;padding:18px">
      <div style="font-size:13px;font-weight:600;margin-bottom:14px">Completed visits per week</div>
      <div class="bars" style="height:150px"><i style="height:60%"></i><i style="height:78%"></i><i style="height:52%"></i><i style="height:85%"></i><i class="on" style="height:100%"></i><i style="height:44%"></i></div>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── RECENTS ───────────────────────── */
  {
    file: "Recents.dc.html", active: "recents", name: "Recents", crumb: "Recents",
    welcome: { title: "Retrace your steps", body: "A running trail of what you've opened — patients, notes and appointments — so you can jump back without searching." },
    steps: [
      { id: "rc-groups", title: "Grouped by time", body: "Today, yesterday, earlier this week. The newest thing you touched is at the top." },
      { id: "rc-item", title: "One click back", body: "Every row links straight back to where you were — the same chart, note or appointment." },
      { id: "rc-clear", title: "Clear when you like", body: "Wipe the history if you're switching context or handing off your screen." },
      { id: "help-btn", title: "That's recents", body: "The ? opens the recents help guide and replays this tour.", isHelpBtn: true },
    ],
    helpIntro: "Recents is a personal, time-ordered trail of the records you've opened — a quick way back to work in progress.",
    helpDoc: [
      { h: "What's tracked", p: "Patient charts, encounter notes, and appointments you've viewed. Nothing you only hovered over." },
      { h: "Grouping", p: "Today, Yesterday, Earlier this week — most recent first." },
      { h: "Privacy", p: "The list is yours alone and can be cleared at any time." },
    ],
    body: `
    <div class="h1">Recents</div><div class="sub">Records you've opened lately</div>
    <div id="rc-groups" style="margin-top:16px">
      <div style="font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#64748b;margin:8px 0">Today</div>
      <div class="card" style="overflow:hidden">
        <div class="row" id="rc-item" style="gap:11px;padding:12px 16px"><span class="sec-ic" style="width:28px;height:28px;background:#cbfbf3"><svg class="ico" style="width:14px;height:14px;color:#0a827a"><use href="#i-users"/></svg></span><div style="flex:1"><b style="font-size:13px">Daniel Carter</b><span class="muted" style="font-size:12px"> · Patient chart</span></div><span class="muted" style="font-size:12px">9:12 AM</span></div>
        <div class="row row-b" style="gap:11px;padding:12px 16px"><span class="sec-ic" style="width:28px;height:28px;background:#e0f2fe"><svg class="ico" style="width:14px;height:14px;color:#0369a1"><use href="#i-note"/></svg></span><div style="flex:1"><b style="font-size:13px">Elena Vasquez</b><span class="muted" style="font-size:12px"> · SOAP note · Med Management</span></div><span class="muted" style="font-size:12px">9:05 AM</span></div>
      </div>
      <div style="font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#64748b;margin:16px 0 8px">Yesterday</div>
      <div class="card" style="overflow:hidden">
        <div class="row" style="gap:11px;padding:12px 16px"><span class="sec-ic" style="width:28px;height:28px;background:#eef2ff"><svg class="ico" style="width:14px;height:14px;color:#4338ca"><use href="#i-cal"/></svg></span><div style="flex:1"><b style="font-size:13px">Carmen Rivera</b><span class="muted" style="font-size:12px"> · Appointment · Crisis Visit</span></div><span class="muted" style="font-size:12px">4:40 PM</span></div>
      </div>
    </div>
    <div style="margin-top:18px"><span class="chip" id="rc-clear"><svg class="ico"><use href="#i-x"/></svg>Clear history</span></div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── MY AVAILABILITY ───────────────────────── */
  {
    file: "Availability.dc.html", active: "availability", name: "My Availability", crumb: "My Availability",
    welcome: { title: "Your working schedule", body: "Your standing hours, plus the requests that change them — leave, blocked time, and hours changes." },
    steps: [
      { id: "av-actions", title: "Request a change", body: "Apply for leave, block time for admin or CME, or ask for a change to your standing hours. Each routes for approval." },
      { id: "av-hours", title: "Your standing week", body: "Working days, hours and breaks by day of the week — your default before any leave or blocks." },
      { id: "av-cal", title: "See the month", body: "Working days, days off, approved leave, pending leave and blocked time laid out on a calendar." },
      { id: "av-requests", title: "Track approvals", body: "Every request you've made with its status — pending, approved, auto-approved or rejected — and who's approving it." },
      { id: "help-btn", title: "That's availability", body: "The ? opens the availability help guide and replays this tour.", isHelpBtn: true },
    ],
    helpIntro: "My Availability is where your schedule is defined and changed — standing hours plus leave, blocks and hours-change requests.",
    helpDoc: [
      { h: "Standing hours", p: "Your default working days, open/close times and breaks by weekday, plus your primary location." },
      { h: "Requests", p: "Apply for Leave, Block Time, and Request Change in Working Hours. Approval routing is set by the clinic — some auto-approve." },
      { h: "Monthly calendar", p: "Colour-coded: working day (with hours), off, approved leave, pending leave, blocked time." },
      { h: "My Requests", p: "A log of what you've submitted with status and approver. Rejected requests show the reason." },
    ],
    body: `
    <div class="h1">My Availability</div><div class="sub">Your working schedule, and requests to change it</div>
    <div class="toolbar" id="av-actions">
      <button class="mini-btn" style="padding:8px 14px"><svg class="ico" style="width:13px;height:13px;display:inline;vertical-align:-2px"><use href="#i-plane"/></svg> Apply for Leave</button>
      <button class="mini-btn" style="padding:8px 14px"><svg class="ico" style="width:13px;height:13px;display:inline;vertical-align:-2px"><use href="#i-ban"/></svg> Block Time</button>
      <button class="mini-btn" style="padding:8px 14px"><svg class="ico" style="width:13px;height:13px;display:inline;vertical-align:-2px"><use href="#i-clock"/></svg> Request Change in Working Hours</button>
    </div>
    <div class="card" style="padding:12px 16px;font-size:13px;display:flex;gap:20px;align-items:center"><b>Penfield Psychiatry</b><span class="muted">120 Oak Lane, Penfield, New York 14526</span><span class="muted" style="font-size:11px">America/New_York · Telehealth enabled</span></div>
    <div class="card" id="av-hours" style="margin-top:16px;padding:16px 18px">
      <div style="font-size:13px;font-weight:600;margin-bottom:12px">Weekly Working Hours</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px;text-align:center;font-size:11px">
        <div style="background:#ecfefb;border:1px solid #cbfbf3;border-radius:8px;padding:8px"><b>MON</b><div>9:00–17:00</div></div>
        <div style="background:#ecfefb;border:1px solid #cbfbf3;border-radius:8px;padding:8px"><b>TUE</b><div>9:00–17:00</div></div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;color:#94a3b8"><b>WED</b><div>Off</div></div>
        <div style="background:#ecfefb;border:1px solid #cbfbf3;border-radius:8px;padding:8px"><b>THU</b><div>9:00–17:00</div></div>
        <div style="background:#ecfefb;border:1px solid #cbfbf3;border-radius:8px;padding:8px"><b>FRI</b><div>9:00–15:00</div></div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;color:#94a3b8"><b>SAT</b><div>Off</div></div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:8px;color:#94a3b8"><b>SUN</b><div>Off</div></div>
      </div>
    </div>
    <div class="card" id="av-cal" style="margin-top:16px;padding:16px 18px">
      <div class="row" style="justify-content:space-between;margin-bottom:10px"><div style="font-size:13px;font-weight:600">August 2026</div><div class="legend" style="padding:0"><span><i style="background:#cbfbf3"></i>Working</span><span><i style="background:#e2e8f0"></i>Off</span><span><i style="background:#fecdd3"></i>Leave</span><span><i style="background:#fde68a"></i>Blocked</span></div></div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px" id="av-requests-anchor">
        <div style="aspect-ratio:1;border-radius:6px;background:#f1fefb;border:1px solid #cbfbf3;font-size:10px;padding:3px">3</div>
        <div style="aspect-ratio:1;border-radius:6px;background:#f1fefb;border:1px solid #cbfbf3;font-size:10px;padding:3px">4</div>
        <div style="aspect-ratio:1;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0;font-size:10px;padding:3px;color:#94a3b8">5</div>
        <div style="aspect-ratio:1;border-radius:6px;background:#f1fefb;border:1px solid #cbfbf3;font-size:10px;padding:3px">6</div>
        <div style="aspect-ratio:1;border-radius:6px;background:#fff7ed;border:1px dashed #fdba74;font-size:10px;padding:3px">7</div>
        <div style="aspect-ratio:1;border-radius:6px;background:#fef2f2;border:1px solid #fecaca;font-size:10px;padding:3px">8</div>
        <div style="aspect-ratio:1;border-radius:6px;background:#f8fafc;border:1px solid #e2e8f0;font-size:10px;padding:3px;color:#94a3b8">9</div>
      </div>
    </div>
    <div class="card" id="av-requests" style="margin-top:16px;overflow:hidden">
      <div class="sec-h"><div class="st">My Requests</div></div>
      <div class="row" style="gap:12px;padding:13px 18px"><span class="pill" style="background:#dbeafe;color:#1d4ed8">Leave</span><div style="flex:1;font-size:13px"><b>Aug 29 – Aug 31</b><div class="muted">Family vacation — planned travel</div></div><span class="pill" style="background:#fef3c7;color:#b45309">Pending approval</span></div>
      <div class="row row-b" style="gap:12px;padding:13px 18px"><span class="pill" style="background:#fef3c7;color:#b45309">Block Time</span><div style="flex:1;font-size:13px"><b>Sep 2 · 1:00 – 3:00 PM</b><div class="muted">CME conference session</div></div><span class="pill" style="background:#d1fae5;color:#047857">Approved</span></div>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── SETTINGS ───────────────────────── */
  {
    file: "Settings.dc.html", active: "settings", name: "Settings", crumb: "Settings",
    welcome: { title: "Make the portal yours", body: "Account details, notifications, scheduling defaults, documentation preferences, billing defaults and security — organised into tabs." },
    steps: [
      { id: "st-rail", title: "Seven areas", body: "Each tab is one area of configuration. Start with Notifications and Documentation — they shape your day the most." },
      { id: "st-notif", title: "Control the noise", body: "Turn each kind of notification on or off, set a reminder cadence for unsigned notes, and pick your channels." },
      { id: "st-panel", title: "Defaults that save clicks", body: "Default appointment length, check-in window, note template, required diagnosis before signing, favourite codes." },
      { id: "st-save", title: "Save to apply", body: "Changes take effect when you save. Nothing is committed until then." },
      { id: "help-btn", title: "That's settings", body: "The ? opens the settings help guide and replays this tour.", isHelpBtn: true },
    ],
    helpIntro: "Settings holds every per-provider preference. Most of it is set once; Notifications and Documentation are the ones worth revisiting.",
    helpDoc: [
      { h: "Account", p: "Name, credentials, contact details, timezone. NPI and licence are read-only." },
      { h: "Notifications", p: "Per-category toggles (booked, cancelled, checked in, messages, unsigned-note reminders, tasks, labs, refills), a reminder cadence, and channels." },
      { h: "Scheduling", p: "Default appointment length, buffer, check-in window, default visit type, double-booking, telehealth link, default view." },
      { h: "Documentation", p: "Default note template, autopopulate from last visit, require a diagnosis before signing, co-sign defaults, favourite diagnoses and procedure codes." },
      { h: "Billing & Security", p: "Default place of service and rendering provider; password, two-factor and active sessions." },
    ],
    body: `
    <div class="row" style="gap:12px;margin-bottom:6px"><span class="sec-ic" style="width:38px;height:38px;background:#f1f5f9"><svg class="ico" style="color:#475569"><use href="#i-set"/></svg></span><div><div class="h1">Settings</div><div class="sub">Account, notifications, scheduling, documentation, billing and security</div></div></div>
    <div class="row" style="align-items:flex-start;gap:24px;margin-top:16px">
      <div class="st-rail" id="st-rail">
        <div><svg class="ico"><use href="#i-users"/></svg>Account</div>
        <div class="on" id="st-notif"><svg class="ico"><use href="#i-bell"/></svg>Notifications</div>
        <div><svg class="ico"><use href="#i-cal"/></svg>Scheduling</div>
        <div><svg class="ico"><use href="#i-note"/></svg>Documentation</div>
        <div><svg class="ico"><use href="#i-chart"/></svg>Billing</div>
        <div><svg class="ico"><use href="#i-key"/></svg>Security</div>
        <div><svg class="ico"><use href="#i-spark"/></svg>Appearance</div>
      </div>
      <div style="flex:1">
        <div class="card" id="st-panel" style="padding:6px 18px">
          <div class="row row-b" style="justify-content:space-between;padding:14px 0;border-top:none"><div><b style="font-size:13px">New appointment booked</b><div class="muted" style="font-size:12px">When a patient or coordinator schedules a visit with you</div></div><div class="toggle"></div></div>
          <div class="row row-b" style="justify-content:space-between;padding:14px 0"><div><b style="font-size:13px">Patient checked in</b><div class="muted" style="font-size:12px">A patient arrives and enters your waiting room</div></div><div class="toggle"></div></div>
          <div class="row row-b" style="justify-content:space-between;padding:14px 0"><div><b style="font-size:13px">Unsigned note reminders</b><div class="muted" style="font-size:12px">Nudge me about encounter notes awaiting signature</div></div><div class="toggle"></div></div>
          <div class="row row-b" style="justify-content:space-between;padding:14px 0"><div><b style="font-size:13px">Refill requests</b><div class="muted" style="font-size:12px">Pharmacy refill requests routed to me</div></div><div class="toggle off"></div></div>
          <div style="padding:14px 0;border-top:1px solid #f1f5f9"><b style="font-size:13px">Reminder cadence</b><div style="margin-top:8px"><span class="fld" style="display:inline-block">Daily digest <svg class="ico" style="width:12px;height:12px;display:inline"><use href="#i-chevd"/></svg></span></div></div>
        </div>
        <button class="mini-btn" id="st-save" style="margin-top:16px;padding:9px 18px">Save changes</button>
      </div>
    </div>
    <div style="height:24px"></div>`,
  },

  /* ───────────────────────── PROFILE ───────────────────────── */
  {
    file: "Profile.dc.html", active: "profile", name: "Profile", crumb: "Profile",
    welcome: { title: "Your provider profile", body: "The details patients and staff see about you — and a preview of exactly how your public listing looks." },
    steps: [
      { id: "pf-toggle", title: "Two views", body: "'My Profile' is the full record you edit. 'View as Patient' shows the card patients see when they self-schedule." },
      { id: "pf-edit", title: "Edit in place", body: "Edit turns the bio and contact fields into inputs. Save writes them; Cancel drops the changes." },
      { id: "pf-accepting", title: "Accepting new patients", body: "This toggle controls whether you appear as bookable in self-scheduling and on your public listing." },
      { id: "pf-preview", title: "Check the patient view", body: "Before you publish a change, flip to the patient preview to see the result." },
      { id: "help-btn", title: "That's your profile", body: "The ? opens the profile help guide and replays this tour.", isHelpBtn: true },
    ],
    helpIntro: "Your profile is both an internal record and a public listing. What you enter here is what patients see when choosing a provider.",
    helpDoc: [
      { h: "My Profile vs View as Patient", p: "The editable record, and a live preview of your self-scheduling card." },
      { h: "Editable fields", p: "Bio, email and phone are editable inline. NPI, licence and credentials are managed by the clinic." },
      { h: "Accepting new patients", p: "Turns your bookability on or off in self-scheduling and on the public card." },
      { h: "Static sections", p: "Education, board certifications, practice locations, visit types and accepted insurance are drawn from your credentialing record." },
    ],
    body: `
    <div class="row" style="justify-content:space-between;align-items:center">
      <div class="row" style="gap:12px"><span class="sec-ic" style="width:38px;height:38px;background:#f1f5f9"><svg class="ico" style="color:#475569"><use href="#i-users"/></svg></span><div><div class="h1">Profile</div><div class="sub">Your provider profile and public listing</div></div></div>
      <div class="row" style="gap:8px"><span class="chip" id="pf-edit"><svg class="ico"><use href="#i-note"/></svg>Edit</span><div class="seg" id="pf-toggle"><b class="on">My Profile</b><b>View as Patient</b></div></div>
    </div>
    <div class="card" style="margin-top:16px;padding:20px;display:flex;gap:18px;align-items:flex-start">
      <div class="avatar" style="width:56px;height:56px;font-size:18px;background:#1a5c9e;color:#fff">SM</div>
      <div style="flex:1">
        <div style="font-size:17px;font-weight:700">Dr. Sarah Mitchell</div>
        <div class="sub">MD, FAPA · Psychiatrist</div>
        <div class="row muted" style="gap:12px;margin-top:6px;font-size:12px"><span>15+ yrs experience</span><span>English, Spanish</span><span style="color:#0a827a">Telehealth</span><span style="color:#059669">Accepting new patients</span></div>
        <div class="legend" style="padding:8px 0 0"><span class="pill" style="background:#cbfbf3;color:#0a827a">Adult Psychiatry</span><span class="pill" style="background:#cbfbf3;color:#0a827a">Mood Disorders</span><span class="pill" style="background:#cbfbf3;color:#0a827a">Anxiety</span></div>
      </div>
    </div>
    <div class="card" style="margin-top:16px;padding:18px"><div style="font-size:13px;font-weight:600;margin-bottom:6px">About</div><div class="muted" style="font-size:13px;line-height:1.55">Dr. Mitchell is a board-certified psychiatrist with over 15 years of experience specializing in adult mood disorders and anxiety.</div></div>
    <div class="card" style="margin-top:16px;padding:16px 18px;display:flex;justify-content:space-between;align-items:center" id="pf-accepting">
      <div><b style="font-size:13px">Accepting new patients</b><div class="muted" style="font-size:12px">Shows on your public listing and in self-scheduling</div></div>
      <div class="toggle"></div>
    </div>
    <div class="card" style="margin-top:16px;padding:18px" id="pf-preview"><div style="font-size:13px;font-weight:600;margin-bottom:6px">Education &amp; training</div><div class="muted" style="font-size:12.5px;line-height:1.7">· MD — University of Rochester School of Medicine (2004)<br>· Residency, Psychiatry — Massachusetts General Hospital (2008)<br>· Fellowship, Mood &amp; Anxiety Disorders — McLean Hospital (2009)</div></div>
    <div style="height:24px"></div>`,
  },
];
