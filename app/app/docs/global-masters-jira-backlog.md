# Global Masters — Jira Work Breakdown

Backlog to take Global Masters from its current front-end prototype (all data is local mock state — see [PRD §9](./global-masters-prd.md)) to a fully backed, production-ready module. Structured as **Epic → Feature → Story → Task → Sub-task**.

**Mapping to Jira issue types:** create the Epic as a Jira *Epic*. If your Jira instance doesn't have a "Feature" level (Advanced Roadmaps only), create each Feature below as its own *Epic* instead, and drop the Epic down to a *label* (`global-masters`) applied across all of them. Stories map to Jira *Story*, Tasks to Jira *Task* (linked to their Story), Sub-tasks to Jira *Sub-task* (under their Task).

---

## EPIC: GM-0 — Global Masters Module

**Description:** Deliver Global Masters as a production module: every one of the 9 sections / 51 individual settings persists to a real backend, is enforced by the workflows it's supposed to govern (scheduling, billing, communications, etc.), and is access-controlled and audited. The front-end UI/UX already exists as a working prototype (navigation, screens, forms) — this epic is primarily about the data, integration, and enforcement layer behind it, plus resolving known gaps the prototype surfaced.

**Business value:** Removes scattered, inconsistent configuration surfaces; gives every org a single governed place to configure clinical, scheduling, billing, and communication policy.

**In scope:** Backend persistence for all 51 settings; RBAC; audit logging; wiring each setting's stored value into the workflow it's meant to control; resolving orphaned/duplicate routes and known data-integrity gaps.

**Out of scope (this epic):** Per-clinic overrides of global settings; bulk import/export tooling; anything not already represented in the existing prototype's 9 sections.

**Definition of Done:** Every setting listed in [the settings reference](./global-masters-settings-reference.md) reads/writes from a real API, survives a refresh, is gated by RBAC, is audit-logged on change, and — where the reference doc says "should affect X" — actually affects X in the relevant workflow.

---

## Feature: GM-F0 — Platform Foundation (cross-cutting, build first)

Everything else in this backlog depends on this feature. Build it before or alongside the first section feature.

### Story GM-F0-S1: Persistent data layer & schema design
As a platform engineer, I need a database schema covering all Global Masters entities so settings survive beyond a browser session.
**Acceptance Criteria:** Schema exists for every entity in the [settings reference](./global-masters-settings-reference.md); lookup-type masters (Pattern A) use a shared table shape (id, name, org_id, display_order, is_active, timestamps) with entity-specific extension columns; config-type masters (Pattern B) use a shared "one row per org per setting group" shape.
**Tasks:**
- T1 Design shared schema conventions for Pattern A (lookup lists) vs Pattern B (config panels)
  - Define common columns (org_id, is_active, display_order, created_at, updated_at, created_by, updated_by)
  - Define soft-delete vs hard-delete policy for lookup records referenced elsewhere (e.g. a Room Type used on past appointments)
- T2 Write migrations for all Pattern A entities (28 lookup-list settings)
- T3 Write migrations for all Pattern B entities (23 config-panel settings)
- T4 Seed scripts porting each screen's current mock `SEED` data as default org data

### Story GM-F0-S2: Generic CRUD API framework for lookup-type masters
As a backend engineer, I need one reusable API pattern for all Pattern A ("Master Data List") settings so I'm not hand-building 28 near-identical CRUD APIs.
**Acceptance Criteria:** A single generic list/create/update/toggle-active/delete API contract (mirroring the front end's shared `GmSimpleTable` component) that any lookup entity can register against, with support for entity-specific extra fields (mirrors the front end's `extraFields`/`extraColumns` extension already used by Referral Source).
**Tasks:**
- T1 Design generic REST/GraphQL contract: `GET /masters/:entity?search=&active=`, `POST`, `PATCH /:id`, `PATCH /:id/toggle-active`, `DELETE /:id`
- T2 Implement server-side search/filter/sort/pagination
- T3 Implement extension-field support for entities with non-standard columns (Insurers, Procedure Codes, Services, Visit Types, Specializations' parent/child, Country's default-flag exclusivity)
- T4 Implement dependency-check-before-delete (block deleting a Room Type/Visit Type/etc. still referenced by existing appointments; return a clear conflict error)

### Story GM-F0-S3: Config/settings API framework for policy-panel masters
As a backend engineer, I need one reusable "single settings object per org" API pattern for all Pattern B settings.
**Acceptance Criteria:** A generic `GET /settings/:group` / `PUT /settings/:group` contract with server-side schema validation per settings group, used by all 23 config-panel entities.
**Tasks:**
- T1 Design generic settings-group contract and versioning approach (so a future field addition to e.g. Appointment Settings doesn't break existing stored rows)
- T2 Implement per-group JSON-schema validation
- T3 Implement change history (previous value + who + when) at the settings-group level, feeding audit logging (GM-F0-S5)

### Story GM-F0-S4: RBAC enforcement across Global Masters
As a compliance/security stakeholder, I need Global Masters screens and their underlying APIs to respect the roles/permissions defined in Users & Access, so that the permission matrices being configured actually mean something.
**Acceptance Criteria:** A user without "Edit" on the relevant module cannot call the corresponding write API even if they reach the page; nav/UI hides actions the current user can't perform.
**Tasks:**
- T1 Define the mapping from each Global Masters section to a permission-matrix module (e.g. "Billing & Coding" → "Billing & Payments" module)
- T2 Implement middleware/guard enforcing View/Create/Edit/Delete per request
- T3 Update front-end screens to hide/disable actions the current user's role doesn't grant
- T4 Write tests covering at least one denied case per section

### Story GM-F0-S5: Audit logging service
As a compliance stakeholder, I need every create/update/delete/toggle on any Global Masters setting logged with who/when/old-value/new-value.
**Acceptance Criteria:** Every write API call from GM-F0-S2/S3 emits an audit record; a read API/UI exists to review audit history per entity (can reuse the existing "Audit Log" module referenced in the permission matrix).
**Tasks:**
- T1 Define audit event schema (entity, entity_id, org_id, actor, action, before, after, timestamp)
- T2 Implement audit-write hook shared by both API frameworks (GM-F0-S2, GM-F0-S3)
- T3 Build a basic audit viewer (can be minimal — filterable table)

### Story GM-F0-S6: Resolve orphaned & duplicate routes
As a product owner, I need the known navigation gaps from the prototype resolved before this ships, so the module doesn't ship with dead links or confusing duplicates.
**Acceptance Criteria:** Each item below has an explicit decision (keep+wire-in, or remove) and is implemented accordingly.
**Tasks:**
- T1 Decide fate of `organization/business-hours` and `organization/timezone` (orphaned — not in nav data; note Timezone is already used elsewhere, e.g. Clinic Management)
- T2 Decide fate of `scheduling/scheduling-rules`, `scheduling/provider-rules`, `scheduling/appointment-masters` (orphaned, appear superseded by Provider Schedule Rules)
- T3 Resolve the "AI Agent" (PractMD Connect) vs. "Appointment Agent" (Scheduling) duplication — currently identical screens under two nav entries. Either merge into one setting or scope AI Agent as a genuinely distinct, broader assistant.
- T4 Remove or wire up the dead `holdMusic` field on the Phone Calls screen

### Story GM-F0-S7: Cross-master referential integrity
As a data-quality owner, I need the address hierarchy and other cross-referenced masters to actually reference each other, since several currently don't.
**Acceptance Criteria:** State's country filter and City's state filter read live from the Country/State masters (GM-F1-S3/S4) instead of hardcoded lists; Procedure Codes' discount field either drives the displayed/billed charge or is removed; Provider Types gets a description field for consistency with other lookup lists, or the omission is confirmed intentional.
**Tasks:**
- T1 Wire City's state dropdown to State master data (org-scoped)
- T2 Wire State's country dropdown to Country master data
- T3 Resolve Procedure Codes `discount` field (apply to charge math, or remove)
- T4 Confirm/align field parity across all "plain lookup list" masters (name/description/order/active)

---

## Feature per Section

Each Story below follows one of two templates. **Only entity-specific fields, acceptance criteria, and extra tasks are listed per story** — apply the referenced template for the standard Tasks/Sub-tasks (this avoids repeating ~250 near-identical sub-task rows; clone the template in Jira per story).

### Template — Pattern A: "Manage `<Entity>`" (Master Data List)
**Story description:** As an org admin, I want to create, search, edit, activate/deactivate, and delete `<Entity>` records, so that [org-specific list] stays accurate and available wherever it's referenced in the product.
**Generic acceptance criteria:** List loads from the API with search; add/edit uses the same validated form; toggling active/inactive doesn't delete the record; delete is blocked (with a clear message) if the record is referenced elsewhere; empty and loading states are handled.
**Tasks (apply per entity):**
- TA1 Backend: confirm/extend schema for `<Entity>` beyond the shared Pattern A columns (entity-specific fields)
  - Add entity-specific migration columns
  - Seed reference data from current mock `SEED`
- TA2 Backend: register `<Entity>` against the generic CRUD API (GM-F0-S2)
  - Wire entity-specific extra fields/validation rules
  - Wire delete dependency-check rule specific to this entity
- TA3 Frontend: connect `<Entity>` screen to the live API
  - Replace `useState(SEED)` with data fetching + loading/error states
  - Wire add/edit/toggle/delete actions to API calls with optimistic UI and rollback on failure
- TA4 QA: validate `<Entity>` end-to-end
  - Required-field and format validation cases
  - Duplicate-name / uniqueness behavior (define & test the rule)
  - RBAC-denied case (GM-F0-S4)

### Template — Pattern B: "Configure `<Entity>` Settings" (Policy Panel)
**Story description:** As an org admin, I want to configure `<Entity>` policy for my organization, so that the platform enforces it in [the relevant workflow] instead of using a hardcoded default.
**Generic acceptance criteria:** Settings load current org values on page open; Save persists and confirms; invalid values are rejected with inline errors; the stored value is actually read and enforced by the workflow it governs (not just stored).
**Tasks (apply per entity):**
- TB1 Backend: confirm/extend schema for `<Entity>` settings group
- TB2 Backend: register `<Entity>` against the generic settings API (GM-F0-S3), including validation rules
- TB3 Frontend: connect `<Entity>` screen to the live API
  - Replace local `useState` defaults with fetched org values
  - Wire Save to the API with loading/success/error states (replacing the current fake `setTimeout` "saved" toast)
- TB4 **Enforcement:** wire the stored setting into the actual workflow it's meant to control (see "Enforcement target" per story below) — this is the step that turns a stored value into a real product behavior
- TB5 QA: validate `<Entity>` end-to-end, including at least one test proving the enforcement target actually respects the setting

---

### GM-F1 — Organization

| Story | Pattern | Notes / entity-specific extras |
|---|---|---|
| GM-F1-S1 Manage Room Types | A | Extra field: `capacity` (int ≥1). Extra AC: capacity should be checked against attendee count when a room is assigned to an appointment. |
| GM-F1-S2 Manage Equipment Types | A | Standard lookup fields only. |
| GM-F1-S3 Manage Countries | A | Extra: `isDefault` exclusivity (setting one default must clear all others — enforce server-side, not just client-side). Downstream: feeds GM-F0-S7 (State/City linkage). |
| GM-F1-S4 Manage States | A | Depends on GM-F0-S7-T2 (live country linkage) rather than the hardcoded filter in the prototype. |
| GM-F1-S5 Manage Cities | A | Depends on GM-F0-S7-T1 (live state linkage). |
| GM-F1-S6 Manage Holidays | A (hybrid) | Extra tasks: model the 4 recurrence types (none/daily/weekly/monthly/annually) and their distinct sub-configs; TB4-equivalent enforcement task: block/flag scheduling slots on computed holiday occurrences org-wide. |

### GM-F2 — Users & Access

| Story | Pattern | Notes / entity-specific extras |
|---|---|---|
| GM-F2-S1 Manage Administrative Roles | B (matrix, not simple panel) | Model: role × 12 modules × 4 actions. Extra task: implement "duplicate role" as a first-class API action, not just a client-side deep clone. Enforcement (TB4): this is the primary input to GM-F0-S4 RBAC enforcement — build this story before/alongside GM-F0-S4. |
| GM-F2-S2 Manage Staff Roles | B (matrix) | Same model as Administrative Roles; confirm whether Admin and Staff roles should share one table (with a `tier` column) or stay separate — currently identical schemas, separate seed sets. |
| GM-F2-S3 Configure Provider Permissions | B | Flat 10-capability toggle set. Enforcement (TB4): gate provider-facing clinical actions (prescribe, diagnose, sign notes, order labs, bill, view-all-patients, manage-staff, view-reports) per this config. High priority — several of these are licensure/compliance-relevant. |
| GM-F2-S4 Manage Provider Types | A | Note: currently has no `description` field, inconsistent with sibling lists — decide via GM-F0-S7-T4. |
| GM-F2-S5 Manage Specializations | A (hierarchical) | Extra: parent/child (2-level max) relationship. Extra task: decide/enforce max nesting depth server-side, and cascade-delete-children behavior explicitly (currently silent in the prototype). |

### GM-F3 — Clinical

| Story | Pattern | Notes / entity-specific extras |
|---|---|---|
| GM-F3-S1 Manage Services | A | Extra fields: category, CPT billing code, duration, billable/telehealth flags. Downstream: duration should default the calendar slot length when a service is selected. |
| GM-F3-S2 Manage Visit Types | A | Extra fields: color, duration, buffer, mode, self-scheduling eligibility, CPT code. Downstream: feeds Provider Schedule Rules (GM-F4-S9) and Self Scheduling (GM-F4-S10) pickers. |
| GM-F3-S3 Configure Form Preferences | A/mapping | Not a plain list — a (Provider × Visit Type) → forms[] mapping. Extra task: build the dependent-dropdown "load forms" UX server-side; enforcement task: auto-attach mapped forms to intake packet at booking time. |
| GM-F3-S4 Manage Document Types | A | Standard lookup fields only. |
| GM-F3-S5 Manage Referral Source | A | Extra field: category (enum). Downstream: feeds acquisition-channel reporting — confirm reporting consumer before/while building. |

### GM-F4 — Scheduling

| Story | Pattern | Notes / entity-specific extras |
|---|---|---|
| GM-F4-S1 Manage Cancellation Reasons | A | Standard. |
| GM-F4-S2 Manage Reschedule Reasons | A | Standard. |
| GM-F4-S3 Configure Appointment Settings | B | Fields: check-in buffer, auto-eligibility check, no-show window, waitlist confirm time. **Blocking dependency:** resolve the waitlist-confirm-time duplication with GM-F4-S6 (Waitlist Setting) before building enforcement — decide single source of truth first. |
| GM-F4-S4 Configure No Show Setting | B | Enforcement (TB4): auto-generate a billing line item / charge when a visit is marked no-show and the fee is enabled. |
| GM-F4-S5 Configure Reschedule Setting | B | Enforcement (TB4): block patient-initiated reschedule inside the configured window. |
| GM-F4-S6 Configure Appointment Cancellation Setting | B | Same shape as No Show Setting — consider a shared "fee policy" component (GM-F0-S1-T1 note) instead of duplicate implementations. Enforcement: charge on late cancellation. |
| GM-F4-S7 Configure Waitlist Setting | B | See GM-F4-S3 duplication note. Enforcement: govern whether waitlist is offered at all and the offer-confirmation timeout. |
| GM-F4-S8 Configure Appointment Preferences | B | Fields: staff/patient booking windows, cancellation-policy notice, note/insurance-check/confirmation toggles. Enforcement: bound the booking calendar's open window; gate booking-flow steps. |
| GM-F4-S9 Configure Provider Schedule Rules | A (hybrid wizard) | Model: (Clinic, Provider, Visit Type) × 7 days × {enabled, maxAppts}. This is the core scheduling capacity control — prioritize its enforcement task: the booking engine must consult this before allowing a new appointment. |
| GM-F4-S10 Configure Self Scheduling | B (large) | ~15 fields across eligibility, required steps, windows, disclosure, forms. Enforcement (TB4): gate the entire patient self-booking surface; break into sub-tasks per field group (eligibility, required-steps, disclosure, forms) given its size. |
| GM-F4-S11 Manage Web Embeds | A + generator | Not pure CRUD — includes a widget-code generator. Extra tasks: move `embedId` generation server-side (currently a client-side `btoa` hash — needs a real unique/stable ID scheme); serve the generated `<script>` from a real, versioned embed endpoint. |
| GM-F4-S12 Configure Appointment Agent | B | See GM-F4/GM-F9 duplication note (GM-F0-S6-T3) before building — don't build this twice under two names. |

### GM-F5 — Patient Communication

| Story | Pattern | Notes / entity-specific extras |
|---|---|---|
| GM-F5-S1 Configure SMS Notifications | B (matrix) | Model: tab × event → {required/not_required/disabled}, with "core" events locked to Required. Enforcement: the actual SMS send pipeline must check this matrix before sending each event type. |
| GM-F5-S2 Configure Email Notifications | B (matrix) | Same model, Patient/Provider/Admin tabs. Same enforcement note for the email send pipeline. |
| GM-F5-S3 Configure Voice | B | Fields: voice persona, caller ID, templated greeting, per-event toggles. Extra task: implement `{{variable}}` template interpolation server-side against real patient/clinic data. |
| GM-F5-S4 Configure Phone Calls | B + read-only flows | IVR flows are currently hardcoded/read-only — decide whether this phase makes them editable or keeps them fixed; either way, wire recording/transcription/hold-time settings to the actual telephony provider config. |
| GM-F5-S5 Manage Message Templates | A (card list) | Standard CRUD, category field. Downstream: expose via whatever staff chat/messaging interface exists, as a quick-insert list. |

### GM-F6 — Patient Management

| Story | Pattern | Notes / entity-specific extras |
|---|---|---|
| GM-F6-S1 Manage Gender | A | Standard. |
| GM-F6-S2 Manage Pronoun | A | Standard. |
| GM-F6-S3 Manage Marital Status | A | Standard. |
| GM-F6-S4 Manage Relationship to Patient | A | Standard. |
| GM-F6-S5 Manage Contact Methods | A | Downstream: should tie to which channel actually gets used per patient — cross-check against GM-F5 (Communication) once both are backend-integrated. |
| GM-F6-S6 Manage Patient Type | A | Standard. |
| GM-F6-S7 Manage Patient Stage | A | Extra decision: whether to enforce a lifecycle state machine (Lead→...→Discharged) or keep it a free list — currently free. |
| GM-F6-S8 Configure Registration | B (complex) | Fields: record-ID format generator + a required/visible matrix per field. Enforcement (TB4): the patient-creation form must (a) generate IDs per this format server-side and (b) enforce required/visible per this config — both currently only simulated client-side. |
| GM-F6-S9 Manage Recall Types | A | Standard. |
| GM-F6-S10 Manage Recall Status | A | Standard. |
| GM-F6-S11 Configure Recall Preference | B (cadence engine) | Fields: max attempts, stop-on-booking/decline, ordered touch-point list (channel + timing). **Resolve the ambiguous day-offset sign convention (see settings reference note) before implementing the enforcement task** — get explicit product sign-off on what "3 days before due date" means numerically. Enforcement: drives the actual recall-campaign scheduler. |

### GM-F7 — Billing & Coding

| Story | Pattern | Notes / entity-specific extras |
|---|---|---|
| GM-F7-S1 Manage Insurers | A | Extra fields: payer ID, plan type, logo. Extra task: implement real logo upload/storage (currently a non-functional placeholder). Downstream: payer ID should be validated against/used by the claims/clearinghouse integration once that exists. |
| GM-F7-S2 Manage Procedure Codes | A | Extra fields: CPT code, category, charge, discount, modifier, place-of-service, taxable. Resolve GM-F0-S7-T3 (discount math) as part of this story, not separately. |

### GM-F8 — Tasks

| Story | Pattern | Notes / entity-specific extras |
|---|---|---|
| GM-F8-S1 Configure Escalations | A (tiered list) | Fields: label, time value + unit, priority order (currently implied by list order, not an explicit field — consider making priority an explicit sortable field rather than array position). Enforcement: the task/queue system must check elapsed time against the matching tier and trigger escalation/notification. |

### GM-F9 — PractMD Connect

| Story | Pattern | Notes / entity-specific extras |
|---|---|---|
| GM-F9-S1 Manage Telehealth Provisions | A (per-provider, edit-in-place) | No add/delete in the prototype (providers presumably created elsewhere) — confirm whether this story should add provider creation or stay edit-only against an existing provider table. |
| GM-F9-S2 Configure Telehealth Settings | B | Fields: join window, waiting room + branding, password, consent form, link delivery channel, recording + retention. Enforcement: the video-session service must read and apply these at session-creation time — high compliance sensitivity (consent, retention) so prioritize accuracy over speed here. |
| GM-F9-S3 Manage Google Calendar Connections | A (per-provider) + real OAuth | The prototype's "Connect" flow is a non-functional stub. Extra tasks: implement real Google OAuth (consent screen, token storage/refresh), implement actual two-way calendar sync (push/pull/both) and conflict handling (block/warn) against real Google Calendar API — this is the single largest build item in this feature, budget it separately from the other stories' size. |
| GM-F9-S4 "AI Agent" | — | **Do not build as a separate story.** Resolve via GM-F0-S6-T3 first; this row exists only to flag it so it isn't accidentally scheduled as independent work. |

---

## Known Issues / Tech-Debt Backlog

Non-blocking cleanups surfaced while cataloguing the prototype; each is already cross-referenced above but listed here as a flat checklist for backlog grooming:

- [ ] State/City filters hardcoded instead of reading Country/State masters (GM-F0-S7-T1/T2)
- [ ] "AI Agent" and "Appointment Agent" are the same component under two nav entries (GM-F0-S6-T3)
- [ ] 5 orphaned routes not reachable from nav: `business-hours`, `timezone`, `scheduling-rules`, `provider-rules`, `appointment-masters` (GM-F0-S6-T1/T2)
- [ ] Appointment Settings and Waitlist Setting both store "waitlist confirm time" independently (GM-F4-S3/S7)
- [ ] No Show Setting and Appointment Cancellation Setting are near-duplicate fee-toggle implementations (GM-F4-S4/S6)
- [ ] Procedure Codes' `discount` field isn't applied to the displayed/billed charge (GM-F7-S2)
- [ ] Phone Calls' `holdMusic` field has no UI control (GM-F0-S6-T4)
- [ ] Provider Types lacks a `description` field, inconsistent with sibling lookup lists (GM-F2-S4)
- [ ] Recall Preference's day-offset sign convention is ambiguous between UI copy and seed data (GM-F6-S11)
- [ ] Web Embeds' `embedId` is generated client-side via `btoa` — not guaranteed unique/stable (GM-F4-S11)
- [ ] Google Calendar "Connect" is a non-functional OAuth stub (GM-F9-S3)
