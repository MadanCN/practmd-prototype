// Mock data backing the Provider "Today" dashboard and its supporting screens
// (Tasks, Messages, Results, Refills, Notes). All records are scoped to
// provider p1 (Dr. Sarah Mitchell) via patientId/providerId conventions
// matching data/cc-patients.ts and data/cc-appointments.ts.

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString();
}

// ── Tasks ─────────────────────────────────────────────────────────────────

export type TaskType = "chart-review" | "prior-auth" | "callback" | "lab-followup" | "admin";
export type TaskPriority = "high" | "normal" | "low";

export interface ProviderTask {
  id: string;
  title: string;
  description: string;
  type: TaskType;
  patientId?: string;
  patientName?: string;
  dueLabel: string;
  overdue?: boolean;
  priority: TaskPriority;
  status: "open" | "done";
  createdAt: string;
}

export const PROVIDER_TASKS: ProviderTask[] = [
  { id: "task01", title: "Co-sign resident progress note", description: "Progress note for Elena Vasquez awaiting co-signature", type: "chart-review", patientId: "pt02", patientName: "Elena Vasquez", dueLabel: "Due today", priority: "high", status: "open", createdAt: hoursAgo(3) },
  { id: "task02", title: "Prior authorization — Vyvanse 40mg", description: "Cigna is requesting additional documentation for renewal", type: "prior-auth", patientId: "pt03", patientName: "Marcus Webb", dueLabel: "Due today", priority: "high", status: "open", createdAt: hoursAgo(5) },
  { id: "task03", title: "Return call: medication side effects", description: "Patient reported nausea after dose increase, requested callback", type: "callback", patientId: "pt07", patientName: "Robert Flynn", dueLabel: "Overdue by 1 day", overdue: true, priority: "high", status: "open", createdAt: hoursAgo(30) },
  { id: "task04", title: "Review abnormal CMP before next visit", description: "Flag lab result needs acknowledgement before Thursday's appointment", type: "lab-followup", patientId: "pt05", patientName: "David Okafor", dueLabel: "Due tomorrow", priority: "normal", status: "open", createdAt: hoursAgo(20) },
  { id: "task05", title: "Complete quarterly QA chart audit", description: "5 charts selected for the Q on medication reconciliation review", type: "admin", dueLabel: "Due Friday", priority: "low", status: "open", createdAt: hoursAgo(48) },
  { id: "task06", title: "Sign discharge summary", description: "Carmen Rivera discharged from group program last week", type: "chart-review", patientId: "pt14", patientName: "Carmen Rivera", dueLabel: "Completed", priority: "normal", status: "done", createdAt: hoursAgo(72) },
];

// ── Messages ──────────────────────────────────────────────────────────────
// Two channels: "patient" (direct patient correspondence) and "internal"
// (staff, pharmacy, lab — anyone who isn't the patient themselves).

export type MessageChannel = "patient" | "internal";
export type MessageFromRole = "patient" | "staff" | "pharmacy" | "lab";

export interface ThreadMessage {
  id: string;
  fromMe: boolean;
  senderName: string;
  body: string;
  timestamp: string;
}

export interface ProviderMessageThread {
  id: string;
  channel: MessageChannel;
  patientId?: string;
  participantName: string;
  participantRole: MessageFromRole;
  subject: string;
  unread: boolean;
  urgent?: boolean;
  messages: ThreadMessage[];
}

function lastOf(messages: ThreadMessage[]) {
  return messages[messages.length - 1];
}

const RAW_THREADS: ProviderMessageThread[] = [
  // ── Patient channel ──
  {
    id: "msg01", channel: "patient", patientId: "pt01", participantName: "James Holloway", participantRole: "patient",
    subject: "Nausea after starting Sertraline", unread: true,
    messages: [
      { id: "msg01a", fromMe: false, senderName: "James Holloway", body: "Hi Dr. Mitchell, I started the Sertraline 3 days ago and I'm experiencing some nausea in the morning. Is this normal?", timestamp: hoursAgo(26) },
      { id: "msg01b", fromMe: true, senderName: "Dr. Sarah Mitchell", body: "That's a common adjustment reaction in the first couple of weeks. Try taking it with food, and let's check in again at your next visit.", timestamp: hoursAgo(25) },
    ],
  },
  {
    id: "msg02", channel: "patient", patientId: "pt11", participantName: "Daniel Carter", participantRole: "patient",
    subject: "Feeling much worse this week", unread: true, urgent: true,
    messages: [
      { id: "msg02a", fromMe: false, senderName: "Daniel Carter", body: "I wanted to flag that my mood has dropped significantly since our last visit and I'm having trouble sleeping.", timestamp: hoursAgo(4) },
    ],
  },
  {
    id: "msg05", channel: "patient", patientId: "pt07", participantName: "Robert Flynn", participantRole: "patient",
    subject: "Question about dosage timing", unread: false,
    messages: [
      { id: "msg05a", fromMe: false, senderName: "Robert Flynn", body: "Should I be taking the new medication in the morning or evening? The pharmacy label wasn't clear.", timestamp: hoursAgo(50) },
      { id: "msg05b", fromMe: true, senderName: "Dr. Sarah Mitchell", body: "Evening is best for this one — it can be a little sedating. Let me know if you notice any grogginess in the morning.", timestamp: hoursAgo(49) },
    ],
  },
  {
    id: "msg06", channel: "patient", patientId: "pt02", participantName: "Elena Vasquez", participantRole: "patient",
    subject: "Can we move next week's appointment?", unread: true,
    messages: [
      { id: "msg06a", fromMe: false, senderName: "Elena Vasquez", body: "Something came up at work — is there any chance we could move next Tuesday's follow-up a few days later?", timestamp: hoursAgo(3) },
    ],
  },
  {
    id: "msg07", channel: "patient", patientId: "pt14", participantName: "Carmen Rivera", participantRole: "patient",
    subject: "Thank you", unread: false,
    messages: [
      { id: "msg07a", fromMe: false, senderName: "Carmen Rivera", body: "Just wanted to say thank you for the extra time at my last visit — I'm feeling a lot more hopeful.", timestamp: hoursAgo(96) },
      { id: "msg07b", fromMe: true, senderName: "Dr. Sarah Mitchell", body: "That means a lot to hear, Carmen. Keep up the great work — see you at your next visit.", timestamp: hoursAgo(95) },
    ],
  },

  // ── Internal channel ──
  {
    id: "msg03", channel: "internal", patientId: "pt03", participantName: "CVS Pharmacy — East Rochester", participantRole: "pharmacy",
    subject: "Prior auth needed — Vyvanse 40mg (Marcus Webb)", unread: true,
    messages: [
      { id: "msg03a", fromMe: false, senderName: "CVS Pharmacy", body: "Cigna requires prior authorization documentation before this refill can be processed for Marcus Webb.", timestamp: hoursAgo(9) },
    ],
  },
  {
    id: "msg04", channel: "internal", patientId: "pt02", participantName: "Hannah Reyes", participantRole: "staff",
    subject: "Chart ready for co-signature — Elena Vasquez", unread: true,
    messages: [
      { id: "msg04a", fromMe: false, senderName: "Hannah Reyes", body: "Resident note for today's 2pm visit (Elena Vasquez) is ready for your review and co-signature.", timestamp: hoursAgo(2) },
    ],
  },
  {
    id: "msg08", channel: "internal", participantName: "Quest Diagnostics", participantRole: "lab",
    subject: "New results posted — 3 patients", unread: false,
    messages: [
      { id: "msg08a", fromMe: false, senderName: "Quest Diagnostics", body: "New lab results have been posted for 3 of your patients. Review them from the Results Requiring Review queue.", timestamp: hoursAgo(14) },
    ],
  },
  {
    id: "msg09", channel: "internal", participantName: "Bianca Ramos", participantRole: "staff",
    subject: "Thursday clinic hours — heads up", unread: false,
    messages: [
      { id: "msg09a", fromMe: false, senderName: "Bianca Ramos", body: "Just a heads up — the front office will be short-staffed Thursday morning, check-in may run a few minutes behind.", timestamp: hoursAgo(30) },
      { id: "msg09b", fromMe: true, senderName: "Dr. Sarah Mitchell", body: "Thanks for the heads up, I'll plan around it.", timestamp: hoursAgo(29) },
    ],
  },
  {
    id: "msg10", channel: "internal", patientId: "pt11", participantName: "Ebony Earley", participantRole: "staff",
    subject: "Vitals flagged before Daniel Carter's visit", unread: true,
    messages: [
      { id: "msg10a", fromMe: false, senderName: "Ebony Earley", body: "Daniel Carter's BP was elevated at intake today (148/94) — flagging before you see him.", timestamp: hoursAgo(1) },
    ],
  },
];

export const PROVIDER_MESSAGE_THREADS: ProviderMessageThread[] = RAW_THREADS;

export function threadPreview(t: ProviderMessageThread) {
  return lastOf(t.messages).body;
}

export function threadLastActivity(t: ProviderMessageThread) {
  return lastOf(t.messages).timestamp;
}

// ── Results requiring review ─────────────────────────────────────────────

export type ResultFlag = "critical" | "abnormal" | "normal";

export interface LabResult {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  flag: ResultFlag;
  summary: string;
  resultedAt: string;
  reviewed: boolean;
}

export const PROVIDER_RESULTS: LabResult[] = [
  { id: "res01", patientId: "pt05", patientName: "David Okafor", testName: "Comprehensive Metabolic Panel", flag: "abnormal", summary: "Elevated liver enzymes (ALT 68, AST 54) — monitor given current medication regimen", resultedAt: hoursAgo(14), reviewed: false },
  { id: "res02", patientId: "pt11", patientName: "Daniel Carter", testName: "Lithium Level", flag: "critical", summary: "Serum lithium 1.6 mEq/L — above therapeutic range, patient contact recommended", resultedAt: hoursAgo(6), reviewed: false },
  { id: "res03", patientId: "pt01", patientName: "James Holloway", testName: "Comprehensive Metabolic Panel", flag: "normal", summary: "All values within normal limits", resultedAt: hoursAgo(30), reviewed: false },
  { id: "res04", patientId: "pt14", patientName: "Carmen Rivera", testName: "TSH Panel", flag: "abnormal", summary: "TSH 6.2 mIU/L, mildly elevated — consider endocrinology referral", resultedAt: hoursAgo(60), reviewed: true },
];

// ── Refill requests ───────────────────────────────────────────────────────

export interface RefillRequest {
  id: string;
  patientId: string;
  patientName: string;
  medication: string;
  dosage: string;
  pharmacy: string;
  requestedAt: string;
  status: "pending" | "approved" | "denied";
  urgent?: boolean;
}

export const PROVIDER_REFILLS: RefillRequest[] = [
  { id: "ref01", patientId: "pt07", patientName: "Robert Flynn", medication: "Sertraline", dosage: "100mg, once daily", pharmacy: "Walgreens — Penfield", requestedAt: hoursAgo(8), status: "pending" },
  { id: "ref02", patientId: "pt03", patientName: "Marcus Webb", medication: "Vyvanse", dosage: "40mg, once daily", pharmacy: "CVS — East Rochester", requestedAt: hoursAgo(9), status: "pending", urgent: true },
  { id: "ref03", patientId: "pt02", patientName: "Elena Vasquez", medication: "Buspirone", dosage: "15mg, twice daily", pharmacy: "Wegmans Pharmacy", requestedAt: hoursAgo(20), status: "pending" },
  { id: "ref04", patientId: "pt01", patientName: "James Holloway", medication: "Sertraline", dosage: "50mg, once daily", pharmacy: "CVS — Penfield", requestedAt: hoursAgo(72), status: "approved" },
];

// ── Encounter notes (Pending = still needs documentation, Historical = signed) ──

export type EncounterNoteType = "progress" | "intake" | "discharge";

export interface EncounterNote {
  id: string;
  patientId: string;
  patientName: string;
  appointmentId?: string;
  visitType: string;
  visitDate: string;
  noteType: EncounterNoteType;
  status: "pending" | "historical";
  daysOverdue?: number;
  signedAt?: string;
}

export const PROVIDER_ENCOUNTER_NOTES: EncounterNote[] = [
  // Pending — still needs documentation
  { id: "note01", patientId: "pt11", patientName: "Daniel Carter", visitType: "Med Management", visitDate: hoursAgo(28), noteType: "progress", status: "pending", daysOverdue: 1 },
  { id: "note02", patientId: "pt05", patientName: "David Okafor", visitType: "Follow-Up", visitDate: hoursAgo(76), noteType: "progress", status: "pending", daysOverdue: 3 },
  { id: "note03", patientId: "pt14", patientName: "Carmen Rivera", visitType: "Crisis Visit", visitDate: hoursAgo(150), noteType: "discharge", status: "pending", daysOverdue: 6 },
  // Historical — signed and complete
  { id: "note04", patientId: "pt01", patientName: "James Holloway", visitType: "Initial Consultation", visitDate: hoursAgo(200), noteType: "intake", status: "historical", signedAt: hoursAgo(196) },
  { id: "note05", patientId: "pt02", patientName: "Elena Vasquez", visitType: "Med Management", visitDate: hoursAgo(340), noteType: "progress", status: "historical", signedAt: hoursAgo(338) },
  { id: "note06", patientId: "pt07", patientName: "Robert Flynn", visitType: "Follow-Up", visitDate: hoursAgo(500), noteType: "progress", status: "historical", signedAt: hoursAgo(495) },
  { id: "note07", patientId: "pt03", patientName: "Marcus Webb", visitType: "Follow-Up", visitDate: hoursAgo(670), noteType: "progress", status: "historical", signedAt: hoursAgo(668) },
  { id: "note08", patientId: "pt14", patientName: "Carmen Rivera", visitType: "Initial Consultation", visitDate: hoursAgo(900), noteType: "intake", status: "historical", signedAt: hoursAgo(895) },
];

// ── Alerts ────────────────────────────────────────────────────────────────

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertCategory = "lab" | "refill" | "message" | "safety" | "note";

export interface ProviderAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  message: string;
  patientId?: string;
  patientName?: string;
  refId?: string;
  createdAt: string;
}

export const PROVIDER_ALERTS: ProviderAlert[] = [
  { id: "alert01", severity: "critical", category: "lab", message: "Critical lithium level for Daniel Carter — 1.6 mEq/L", patientId: "pt11", patientName: "Daniel Carter", refId: "res02", createdAt: hoursAgo(6) },
  { id: "alert02", severity: "warning", category: "message", message: "Daniel Carter reports worsening mood and sleep disturbance", patientId: "pt11", patientName: "Daniel Carter", refId: "msg02", createdAt: hoursAgo(4) },
  { id: "alert03", severity: "warning", category: "refill", message: "Urgent refill request for a controlled substance (Vyvanse) — Marcus Webb", patientId: "pt03", patientName: "Marcus Webb", refId: "ref02", createdAt: hoursAgo(9) },
  { id: "alert04", severity: "info", category: "note", message: "Discharge summary for Carmen Rivera is 6 days overdue", patientId: "pt14", patientName: "Carmen Rivera", refId: "note03", createdAt: hoursAgo(24) },
];
