# Global Masters — Individual Settings Reference

Detail on every individual master/setting inside [Global Masters](./global-masters.md): what it is, why the platform needs it, and what it actually affects once configured. Grounded in the current prototype's code (fields, seed data, and logic actually implemented) — see the **Note** under an entry where the code does something inconsistent, incomplete, or worth flagging before this ships.

All 51 settings currently store data in local component state only (no backend yet) — "effect" below describes intended/eventual effect on the platform, not something enforced by the prototype today unless stated otherwise.

---

## 1. Organization

### Room Types
- **What it is:** A list of physical room categories (e.g. Consultation Room, Group Therapy Room, Telehealth Station), each with a description, default capacity, display order, and active flag.
- **Why it's needed:** Clinics have physically distinct spaces with different valid uses and occupancy limits; scheduling and facilities need a shared vocabulary for "what kind of room is this."
- **What it affects:** Feeds the room-selection dropdown when booking/assigning appointments; capacity should prevent over-booking a room beyond its physical limit; inactive room types drop out of scheduling pickers without deleting history tied to them.

### Equipment Types
- **What it is:** A simple named list of clinical equipment categories (e.g. EEG Machine, Pulse Oximeter) with description, order, and active flag.
- **Why it's needed:** Lets scheduling/resource-planning know which equipment a visit type requires and whether it's available.
- **What it affects:** Would gate appointment types that require specific equipment to rooms/times where that equipment is available; today it's a standalone list not yet cross-linked to Visit Types or Rooms.

### Country
- **What it is:** Reference list of countries with ISO code, phone dialing code, flag, and a single "default" flag enforced to be exclusive to one country.
- **Why it's needed:** Every address field (patient, clinic, insurer) and phone number format in the system needs a controlled country vocabulary rather than free text.
- **What it affects:** Populates country dropdowns platform-wide (patient registration, clinic locations, insurers); the default country pre-fills new-record forms; phone code is intended to drive phone-number formatting/validation.
- **Note:** State and City masters do **not** currently read from this list — their own country/state filters are separately hardcoded, so adding a country here does not yet extend the State/City pickers.

### State / Province
- **What it is:** States/provinces, each tagged with a country, code, and display order.
- **Why it's needed:** Second tier of the address hierarchy, needed for patient/clinic address forms and any state-specific business rules (e.g. licensure).
- **What it affects:** Populates state dropdowns in address forms; intended to filter by the Country master.
- **Note:** The country filter on this screen is a hardcoded shortlist (US/CA/GB), not sourced from the Country master above — a data-integrity gap to close before go-live.

### City
- **What it is:** Cities, each tagged with a state and country, with display order.
- **Why it's needed:** Third tier of the address hierarchy for precise clinic/patient location data.
- **What it affects:** Populates city dropdowns in address forms, cascading from State.
- **Note:** Like State, the state-filter dropdown here is a hardcoded list rather than reading live from the State master — same integrity gap, same fix needed.

### Holidays
- **What it is:** An organization-wide holiday calendar supporting one-off dates and four recurrence types (daily/weekly/monthly/annually), each with its own recurrence sub-configuration (specific weekday, ordinal weekday-of-month, specific date, date ranges).
- **Why it's needed:** Clinics close or run reduced hours on holidays; the scheduling engine needs a single authoritative calendar rather than every provider tracking this individually.
- **What it affects:** Should block or flag appointment slots on configured dates across all providers/locations; recurrence rules mean a holiday only needs to be configured once (e.g. "3rd Monday of January" for MLK Day) rather than re-entered every year.

---

## 2. Users & Access

### Administrative Roles
- **What it is:** Named roles (Super Admin, Practice Manager, Billing Admin, Read-Only Auditor, …) each carrying a full permission matrix — 12 platform modules × 4 actions (View/Create/Edit/Delete) — plus role duplication ("Copy") for fast variant creation.
- **Why it's needed:** Different admin staff need different breadth of system access; a matrix makes exactly what a role can do auditable at a glance instead of scattered flags.
- **What it affects:** Should gate what an administrative user can see and do across the entire platform, module by module. Today this matrix is authored here but is **not enforced anywhere else in the app** (see [PRD §9](./global-masters-prd.md)) — it's a definition without a runtime effect yet.

### Staff Roles
- **What it is:** Same permission-matrix mechanism as Administrative Roles, seeded instead with front-line roles (Front Desk, Medical Assistant, …).
- **Why it's needed:** Separates administrative-tier roles from operational staff roles, since the two are typically owned/reviewed by different people and change at different cadences.
- **What it affects:** Same as Administrative Roles — defines, does not yet enforce, staff-level module access.

### Provider Permissions
- **What it is:** A single flat set of 10 capability toggles that apply to the "Provider" role platform-wide (can prescribe, can diagnose, can sign notes, can order labs, can self-schedule, can do telehealth, can bill, can view all patients, can manage staff, can view reports).
- **Why it's needed:** Clinical capabilities (like prescribing or diagnosing) are regulatory/licensure-sensitive and need a single organization-wide switch distinct from the module-level admin/staff permission matrices.
- **What it affects:** Intended to gate provider-facing features (e.g. hide the prescribe action if `can_prescribe` is off) across the clinical workflow; not yet wired to any enforcement point.

### Provider Types
- **What it is:** A plain named list of clinical roles (Psychiatrist, LCSW, Psychiatric NP, Behavioral Health Coach), with display order and active flag — no description field.
- **Why it's needed:** Standardizes how a provider's clinical role is labeled across scheduling, directories, and reporting.
- **What it affects:** Populates the "provider type" field wherever a provider profile is created/edited; used for filtering/searching providers.

### Specializations
- **What it is:** A two-level hierarchy of clinical specialties (e.g. Mental Health → Psychiatry → Child & Adolescent Psychiatry), each with a short code, optional parent, and active flag.
- **Why it's needed:** Lets patients/staff find or filter providers by clinical focus area, and supports more granular reporting than Provider Type alone.
- **What it affects:** Populates specialization tags on provider profiles and, eventually, provider-search/matching (e.g. self-scheduling by specialty).
- **Note:** The UI only allows nesting two levels deep (a specialization's parent must itself be top-level); deleting a parent silently deletes its direct children.

---

## 3. Clinical

### Services
- **What it is:** Billable/clinical service definitions — name, internal code, category, CPT billing code, default duration, and billable/telehealth flags.
- **Why it's needed:** Ties a clinical offering to the billing code and duration the scheduling and billing systems need to process it correctly.
- **What it affects:** Drives default appointment duration when a service is selected at booking, and supplies the CPT code claims would need at billing time; telehealth flag should determine whether the service is offered as a virtual visit.

### Visit Types
- **What it is:** Appointment categories (Initial Consultation, Follow-Up, Crisis Visit, Group Session, …) with a color, duration, buffer time, delivery mode (in-person/telehealth/both), self-scheduling eligibility, and CPT code.
- **Why it's needed:** Scheduling needs a category that's calendar-oriented (color, duration, buffer) rather than purely billing-oriented like Services — this is what actually renders on the calendar.
- **What it affects:** Determines calendar slot length and color, whether patients can self-book this visit type, and whether it's offered virtually; feeds directly into Provider Schedule Rules ("All Types" vs. a specific visit type) and Self Scheduling configuration.

### Form Preferences
- **What it is:** A mapping from a (Provider, Visit Type) pair to the set of intake/consent forms that should be attached, chosen from a fixed library of 12 forms.
- **Why it's needed:** Different visit types (e.g. Telehealth vs. Initial Consultation) legally/operationally require different paperwork; this avoids hard-coding form logic per visit type in the booking flow.
- **What it affects:** Should determine which forms get auto-attached to a patient's intake packet when they book a given provider + visit type combination.

### Document Types
- **What it is:** A plain named list of clinical document categories (Intake Form, Progress Note, Discharge Summary, Treatment Plan) with description, order, active flag.
- **Why it's needed:** Every uploaded/generated patient document needs a controlled category for filing, search, and retention policy.
- **What it affects:** Populates the document-type selector wherever a file is uploaded or a clinical document is generated in a patient's chart.

### Referral Source
- **What it is:** A categorized list (digital / provider / word-of-mouth / insurance / community / other) of where new patients say they heard about the practice.
- **Why it's needed:** Marketing/ops need to measure which channels actually bring in patients to justify spend and outreach effort.
- **What it affects:** Populates the referral-source field at patient registration; feeds acquisition-channel reporting.

---

## 4. Scheduling

### Cancellation Reasons
- **What it is:** A simple ordered, activatable list of reasons a staff member selects when cancelling an appointment (Patient Request, Provider Unavailable, Scheduling Conflict, …).
- **Why it's needed:** Structured reasons (vs. free text) make cancellation patterns reportable — e.g. spotting a provider with unusually high "Provider Unavailable" cancellations.
- **What it affects:** Populates the reason dropdown shown at the point of cancelling an appointment; feeds cancellation-analytics reporting.

### Reschedule Reasons
- **What it is:** Same mechanism as Cancellation Reasons, for the reschedule action specifically (Patient Request, Provider Conflict, Travel, …).
- **Why it's needed:** Reschedules and cancellations have different operational causes and are tracked separately for reporting.
- **What it affects:** Populates the reason dropdown at the point of rescheduling; feeds reschedule-pattern reporting.

### Appointment Settings
- **What it is:** A grouped policy panel covering check-in buffer time, automatic insurance-eligibility checking, no-show grace window, and waitlist confirmation time.
- **Why it's needed:** These are cross-cutting scheduling behaviors that don't belong to any single appointment type — they apply org-wide.
- **What it affects:** Should govern how early a patient can check in, whether eligibility is auto-verified before the visit, how long after a missed start time a visit is marked no-show, and how long a waitlisted patient has to confirm an offered slot.
- **Note:** This screen's "waitlist confirm time" field duplicates the same concept on the standalone Waitlist Setting screen below — the two are not currently linked, so admins could set them inconsistently. Worth consolidating to one source of truth.

### No Show Setting
- **What it is:** A toggle to enable a no-show fee, plus the dollar amount charged when enabled.
- **Why it's needed:** Practices commonly charge a fee to discourage missed appointments and recover lost provider time.
- **What it affects:** Should drive an automatic charge (or at least a flagged billing line item) when a patient is marked no-show, if enabled.

### Reschedule Setting
- **What it is:** A single numeric policy — how many hours before an appointment a patient is still allowed to reschedule it themselves.
- **Why it's needed:** Prevents last-minute self-service reschedules that leave a provider's slot empty with too little notice to refill it.
- **What it affects:** Should gate the patient-facing reschedule action (portal, self-scheduling, agent) once an appointment is inside this window.

### Appointment Cancellation Setting
- **What it is:** A toggle to enable a late-cancellation fee, plus its dollar amount — structurally identical to No Show Setting but for cancellations.
- **Why it's needed:** Mirrors the no-show fee rationale for cancellations made too close to the appointment time.
- **What it affects:** Should drive an automatic late-cancellation charge when enabled.
- **Note:** This screen and No Show Setting are near-duplicate implementations of the same fee pattern (enable toggle + currency field). Consider whether they should share one underlying policy engine with per-scenario fee amounts, rather than two independently-coded screens.

### Waitlist Setting
- **What it is:** A toggle to enable the waitlist feature, plus how many hours a waitlisted patient has to confirm an opened slot before it moves to the next person.
- **Why it's needed:** When a slot opens from a cancellation, practices want to backfill it automatically rather than leave it empty, but need a bounded confirmation window so the process doesn't stall.
- **What it affects:** Should control whether the waitlist feature is active at all, and the timeout used when an offer is made to a waitlisted patient.
- **Note:** See the duplication note under Appointment Settings — this is the second place the same "waitlist confirm time" value is configured.

### Appointment Preferences
- **What it is:** Booking-window policy (how far in advance staff vs. patients can book), a cancellation-policy notice period, and three feature toggles: allow notes at booking, require insurance check at booking, require confirmation.
- **Why it's needed:** Controls how far out the calendar is "open" for booking (commonly different for staff vs. self-service patients) and which extra steps are mandatory during booking.
- **What it affects:** Should bound how far into the future appointments can be created, and turn on/off insurance verification and note-collection steps in the booking flow.

### Provider Schedule Rules
- **What it is:** Per (Clinic, Provider, Visit Type) capacity rules — for each day of the week, whether that provider/visit-type combination is bookable that day, and the maximum number of appointments allowed.
- **Why it's needed:** Providers don't have uniform capacity every day (e.g. fewer Friday slots, no weekend telehealth); this is the mechanism to encode that.
- **What it affects:** Should directly cap how many appointments the scheduling engine will allow to be booked for a given provider/visit-type/day combination — the core capacity-control master for the whole scheduling module.

### Self Scheduling
- **What it is:** The full patient-self-booking policy: master on/off, which patient segments can use it (new/existing/guest), required steps (auth, insurance, credit card, referral), lead-time and advance-booking windows, confirmation mode (instant vs. manual review), UI disclosure toggles (show provider bio, availability count, etc.), a custom message, and which consent/cancellation-policy forms get linked during booking.
- **Why it's needed:** Self-scheduling is only safe to expose once an org has decided who can use it and what safeguards (insurance check, credit card on file, manual review) apply.
- **What it affects:** Should directly control the entire patient-facing self-booking experience — whether it's available at all, to whom, how far out, and what confirmation/consent steps are enforced.

### Web Embeds
- **What it is:** A wizard that configures (visit type, provider, location, branding) and generates an embeddable booking-widget `<script>` snippet for a clinic's external website, keeping a list of previously generated embeds.
- **Why it's needed:** Practices want a "Book Now" widget on their own marketing site without building custom integration — this generates the drop-in code.
- **What it affects:** Each generated embed is scoped to a specific visit type/provider/location combination and carries its own branding; embedding the snippet on an external page should surface that scoped booking flow to website visitors.

### Appointment Agent
- **What it is:** Configuration for an AI/automated scheduling assistant handling booking, rescheduling, and cancellation via chat/SMS — identity-verification method, an escalation turn-count (after which it hands off to a human Care Coordinator with context), greeting/fallback scripts, and confirmation-channel toggles.
- **Why it's needed:** Automates routine scheduling conversations while guaranteeing a bounded, predictable handoff to a human when the bot can't resolve something, rather than leaving patients stuck in a loop.
- **What it affects:** Should govern the automated agent's entire conversational policy — how it verifies identity, what it's allowed to do (cancel/reschedule), what it says, and exactly when it stops trying and pages a human.
- **Note:** See "AI Agent" under PractMD Connect — that route currently renders this exact same screen/component. The two are presently indistinguishable in the UI even though they're presented as separate settings.

---

## 5. Patient Communication

### SMS
- **What it is:** A tabbed (Patient / Provider / Two-Way / Booking Assistant) matrix of notification events, each set to Required, Not Required, or Disabled; certain "core" events (e.g. appointment confirmation) can't be downgraded below Required.
- **Why it's needed:** Different stakeholders need different SMS touchpoints, and some (like appointment confirmations or the STOP opt-out handler) are compliance-critical and shouldn't be fully turned off by an admin.
- **What it affects:** Should control which SMS messages the platform actually sends and to whom — including two-way behaviors like opt-out handling and the booking assistant's own escalation trigger.

### Email
- **What it is:** Same tabbed required/optional/disabled matrix pattern as SMS, covering Patient, Provider, and Admin event tabs (reminders, invoices, welcome emails, audit/security alerts, capacity alerts).
- **Why it's needed:** Mirrors SMS's need for per-event control, with an Admin tab specifically for operational/security alerting that SMS doesn't have.
- **What it affects:** Should control which system/administrative emails go out — including security-sensitive ones like audit alerts and payment-failure notices.

### Voice
- **What it is:** Configuration for an AI voice used in outbound calls — voice persona selection, caller ID, a templated greeting script (supporting variables like `{{clinic_name}}`), and per-event toggles (appointment reminder, recall outreach, no-show follow-up, balance due).
- **Why it's needed:** Voice calls are a channel some patient populations respond to better than text/email, particularly for reminders and recall outreach.
- **What it affects:** Should determine which automated voice calls go out, in what voice, from what caller ID, and with what scripted content.

### Phone Calls
- **What it is:** Read-only display of the inbound IVR call flows (General, Existing Patient, After Hours) plus global call-handling settings: recording, transcription, caller ID, and max hold time before forwarding after-hours.
- **Why it's needed:** Documents and configures how inbound calls are routed and handled, and whether they're recorded (which carries a disclosure obligation).
- **What it affects:** Should govern the actual phone tree patients hear when calling in, and whether calls are recorded/transcribed.
- **Note:** The `holdMusic` setting exists in the underlying state but has no input control in the current UI — a dead field to either wire up or remove.

### Message Templates
- **What it is:** A library of canned chat/SMS snippets (Standard Greeting, Appointment Confirmation, Co-Pay Reminder, …) organized by category, each copyable to clipboard.
- **Why it's needed:** Care Coordinators fielding patient chats/texts need consistent, pre-approved wording rather than composing every reply from scratch.
- **What it affects:** Should be available inside whatever staff-facing messaging/chat interface Care Coordinators use, as a quick-insert library — not patient-facing on its own.

---

## 6. Patient Management

### Gender
- **What it is:** A plain, editable list of gender options (Male, Female, Non-binary, Transgender Male/Female, Genderqueer, Gender Fluid, Prefer Not to Say, Other).
- **Why it's needed:** Patient demographics need an inclusive, org-controlled option set rather than a hardcoded binary or free text.
- **What it affects:** Populates the gender field on patient registration/profile forms.

### Pronoun
- **What it is:** A plain editable list of pronoun sets (He/Him, She/Her, They/Them, …).
- **Why it's needed:** Correct pronoun usage in patient-facing and clinical documentation is both a care-quality and compliance concern.
- **What it affects:** Populates the pronoun field on patient profiles; should propagate into any personalized correspondence/forms that reference the patient by pronoun.

### Marital Status
- **What it is:** A plain editable list (Single, Married, Domestic Partner, Separated, Divorced, Widowed, Unknown).
- **Why it's needed:** Standard demographic field required by many intake and insurance forms.
- **What it affects:** Populates the marital status field on patient registration.

### Relationship to Patient
- **What it is:** A plain editable list (Self, Spouse, Parent, Child, Sibling, Guardian, Emergency Contact, …).
- **Why it's needed:** Used anywhere the system needs to describe a second person's relation to the patient — emergency contacts, guarantors, guardians for minors.
- **What it affects:** Populates relationship dropdowns wherever emergency-contact, billing-responsible-party, or guardian information is captured.

### Contact Methods
- **What it is:** A plain editable list of ways a patient can be reached (Mobile Phone, Home Phone, Work Phone, Email, SMS Text, Patient Portal, Mail — Mail ships inactive by default).
- **Why it's needed:** Patients have channel preferences and legal consent requirements differ by channel (e.g. SMS opt-in); the system needs a controlled vocabulary to record preference against.
- **What it affects:** Should populate a patient's preferred-contact-method selection, which in turn should determine which communication channel (SMS/Email/Voice/Phone Calls masters above) is actually used to reach them.

### Patient Type
- **What it is:** A plain editable classification list (New Patient, Established Patient, Referral, Walk-in, Self-Pay, Insurance).
- **Why it's needed:** Different patient types often follow different intake, billing, or scheduling paths.
- **What it affects:** Populates the patient-type field at registration; feeds segmentation/reporting and could drive different intake-form sets (see Form Preferences).

### Patient Stage
- **What it is:** A plain editable list representing a patient's lifecycle position (Lead, Prospect, Pending Intake, Active, On Hold, Discharged, Inactive).
- **Why it's needed:** Practices need to track where a prospective or existing patient sits in the acquisition/care lifecycle for follow-up and reporting.
- **What it affects:** Should drive which patients show up in different work queues (e.g. "Pending Intake" needing follow-up) and stage-based reporting.
- **Note:** The stage list is presented in a lifecycle order but nothing in the code enforces valid transitions (e.g. a patient could be set from "Discharged" straight to "Lead") — worth deciding whether transition rules are needed.

### Registration
- **What it is:** Configuration for the patient record ID format (prefix, separator, zero-padding length, starting number, whether year/month are embedded, auto-increment) plus a table of which registration fields are required vs. merely visible.
- **Why it's needed:** Every patient needs a unique, human-readable record identifier in a format the org chooses, and intake forms need to declare which fields are mandatory vs. optional per org policy.
- **What it affects:** Should directly determine the record ID assigned to every new patient (e.g. "PT-2025-01001") and which fields the registration form actually requires before it will let staff save a new patient.

### Recall Types
- **What it is:** A plain editable list of reasons a patient is flagged for recall/outreach (Annual Wellness Check, Follow-up Required, Medication Review, Lab Results, Preventive Care, Care Plan Review).
- **Why it's needed:** Recall/outreach campaigns need a structured reason so staff and reporting know why a given patient is being contacted.
- **What it affects:** Populates the recall-type field wherever a recall record is created; feeds recall-reporting.

### Recall Status
- **What it is:** A plain editable list of states a recall can be in (Pending, Contacted, Appointment Booked, Completed, No Response, Declined, Cancelled).
- **Why it's needed:** Recall outreach is a workflow with a lifecycle; status tracking is what lets staff work a recall queue instead of re-contacting the same patient repeatedly.
- **What it affects:** Should drive recall work-queue views and completion reporting.

### Recall Preference
- **What it is:** The outreach cadence engine — max contact attempts, whether to auto-stop on booking or decline, and a configurable list of touch points (channel + timing relative to the due date, each individually enabled).
- **Why it's needed:** Encodes the actual recall campaign logic (how many times to try, through which channels, on what schedule) as configuration rather than hardcoded process.
- **What it affects:** Should drive the automated recall/reminder sequence sent to patients due for follow-up — e.g. "SMS on the due date, email 3 days prior, another SMS a week prior."
- **Note:** The touch-point timing convention (positive/negative days relative to due date) is inconsistently labeled in the current UI copy vs. the seed data — confirm the intended convention with engineering before relying on the displayed "Xd before/after" text.

---

## 7. Billing & Coding

### Insurers
- **What it is:** A directory of accepted insurance payers — name, abbreviation, payer ID, plan type (commercial/Medicare/Medicaid/Tricare/workers' comp/self-pay/other), phone, website, and a (currently non-functional) logo upload.
- **Why it's needed:** Claims and patient insurance selection need a controlled, billing-system-recognized payer list rather than free text payer names.
- **What it affects:** Populates the insurance-payer selector at patient registration and on claims; payer ID is what a clearinghouse/claims system would use to route a claim correctly.

### Procedure Codes
- **What it is:** The CPT code master — code, description, category, standard charge, discount percentage, billing modifier, place-of-service code (including telehealth POS values), and taxable flag.
- **Why it's needed:** Every billable clinical service needs to resolve to a standard CPT code and charge amount for claims submission and patient invoicing.
- **What it affects:** Should determine what a visit/service bills at, and which place-of-service code accompanies the claim (relevant for telehealth reimbursement rules).
- **Note:** The `discount` field is stored but not currently applied anywhere in the displayed charge — confirm whether discount logic still needs to be built before this goes live.

---

## 8. Tasks

### Escalations
- **What it is:** A prioritized list of escalation tiers (Critical/Immediate, High, Medium, Low, Routine) each with a time value and unit (minutes/hours/days) before a task at that tier escalates.
- **Why it's needed:** Staff tasks (patient messages, urgent clinical follow-ups, billing issues) need an SLA so nothing time-sensitive silently sits unaddressed.
- **What it affects:** Should drive automatic escalation/notification of overdue tasks based on their assigned priority tier — e.g. a "Critical" task unresolved after 15 minutes should trigger an alert.

---

## 9. PractMD Connect

### Telehealth Provisions
- **What it is:** A per-provider view of telehealth enablement — whether telehealth is on for that provider, which platform they use (integrated PractMD video vs. an external tool like Zoom), NPI, and licensed states.
- **Why it's needed:** Not every provider is licensed or willing to do virtual visits, and platform choice affects how a visit link is generated; this is the provider-level source of truth for that.
- **What it affects:** Should determine whether a given provider can be booked for a telehealth Visit Type, and which video platform the visit link uses.

### Telehealth Settings
- **What it is:** Global video-visit policy — join window before start time, waiting room on/off with custom branding, password requirement, which consent form is required, how the join link is delivered (SMS/email/both), and recording with its own consent flag and retention period.
- **Why it's needed:** Telehealth carries specific compliance obligations (consent to record, data retention) and UX decisions (waiting room, join timing) that apply across all telehealth visits org-wide.
- **What it affects:** Should govern the actual video-session experience and compliance posture for every telehealth visit — when a patient can join, whether they wait, what consent they must accept, and how long any recording is retained.

### Google Calendar
- **What it is:** A per-provider Google Calendar connection manager — connect/disconnect, sync direction (push/pull/both), conflict handling (block vs. warn), and last-sync timestamp.
- **Why it's needed:** Many providers manage availability partly outside PractMD; two-way calendar sync avoids double-booking and manual reconciliation.
- **What it affects:** Should keep a provider's PractMD schedule and personal Google Calendar mutually consistent, and should block or warn on conflicting events depending on the chosen conflict-handling mode.
- **Note:** The "Connect Google Account" flow is currently a UI stub — no real OAuth integration exists yet. This is core scope for the eventual build, not a cosmetic gap.

### AI Agent
- **What it is:** Per the current build, this route renders the identical "Appointment Agent" screen documented under Scheduling above (chat/SMS booking-agent configuration) — there is no separate general-purpose AI assistant configuration.
- **Why it's needed:** (See Appointment Agent above.)
- **What it affects:** (See Appointment Agent above.)
- **Note:** This is very likely unintentional duplication rather than a deliberate design choice — flagged as a backlog item in the [Jira breakdown](./global-masters-jira-backlog.md) to either merge the two nav entries into one, or build a genuinely distinct "AI Agent" (e.g. a broader assistant covering more than scheduling) if that was the actual intent.
