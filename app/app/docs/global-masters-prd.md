# PRD: Global Masters

**Status:** Draft (reverse-documented from current implementation)
**Owner:** TBD
**Related:** [global-masters.md](./global-masters.md) (technical/architecture reference)

## 1. Summary

Global Masters is PractMD's centralized administration hub for organization-wide configuration. It replaces what would otherwise be configuration scattered across many disconnected screens with a single, predictable place — organized into 9 numbered sections — where an admin can manage lookup data (room types, genders, insurers…), behavioral policy (no-show windows, reschedule rules…), and integration/agent configuration (telehealth, AI scheduling agent…).

## 2. Problem Statement

A multi-clinic healthcare platform accumulates dozens of small configuration surfaces (patient demographics options, scheduling rules, billing codes, communication templates, etc.). Without a single home, these tend to end up:

- duplicated or inconsistently styled across the app,
- hard to discover ("where do I change the list of insurers?"),
- inconsistently governed (unclear who can edit what).

Global Masters exists to give every one of these settings the same navigation home, the same interaction pattern, and the same visual language, so admins learn the pattern once and can find/edit anything.

## 3. Goals

- **G1 — Single entry point.** One URL root (`/global-masters`) and one persistent, searchable nav surface every setting in the platform.
- **G2 — Discoverability.** An admin unfamiliar with the system can find a setting via the overview grid, the sidebar search, or by browsing the numbered sections.
- **G3 — Consistency.** Every setting screen follows one of two predictable interaction patterns (see §6), so users don't have to re-learn UI per screen.
- **G4 — Low-friction extensibility.** Adding a new setting should require editing one data file plus one new screen — not touching nav/layout code.

## 4. Non-Goals (current phase)

- Persisting changes to a backend/database. Today all screens hold data in local component state seeded from mock arrays — nothing survives a page refresh. This is a known gap, not a design decision (see §9).
- Enforcing role-based access to individual sections/settings. Users & Access lets admins *define* roles/permissions, but Global Masters itself does not yet gate its own pages by the viewer's role.
- Per-clinic overrides. Global Masters is explicitly organization-wide/global; clinic-level overrides of these masters are out of scope here.
- Audit history of who changed a setting and when.

## 5. Target Users

| Persona | Needs from Global Masters |
|---|---|
| **Practice/org administrator** | Primary user. Configures rooms, roles, scheduling policy, billing codes, communication templates for the org. |
| **Implementation/onboarding specialist** | Uses this during initial org setup to seed reference data (services, visit types, insurers, demographics options) before clinics go live. |
| **Support/ops staff (secondary)** | Occasionally adjusts operational settings (escalation timing, no-show windows) in response to a clinic's request. |

## 6. Functional Requirements

### 6.1 Navigation & Information Architecture

- FR1: The system shall present a landing page at `/global-masters` showing all sections as cards, each displaying: icon, section number, label, short description, total setting count, and up to 4 child labels as preview chips (with a "+N more" overflow indicator).
- FR2: Clicking a section card shall navigate to that section's first real setting page, never to a dead/non-actionable route.
- FR3: The system shall present a persistent left sidebar, available on every Global Masters page, listing all sections and their settings in a collapsible tree.
- FR4: The sidebar shall auto-expand and visually highlight the section (and the specific setting) matching the current page.
- FR5: The sidebar shall provide a text search that filters visible settings by label, auto-expanding any section with a match and hiding sections with none.
- FR6: Sections may organize their settings into labeled sub-groups (e.g., "Demographics", "Locations") for readability; sub-groups are a display concept only and are not independently navigable.

### 6.2 Setting screen behavior — Master Data (lookup lists)

Applies to reference/lookup data such as Room Types, Equipment Types, Country/State/City, Holidays, Roles, Provider Types, Specializations, Services, Visit Types, Document Types, Referral Source, Cancellation/Reschedule Reasons, Demographics options, Patient Classification, Recall Management, Insurers, Procedure Codes.

- FR7: Each list screen shall display existing records in a table with, at minimum, a name/label column and a status (active/inactive) indicator.
- FR8: Users shall be able to search/filter the visible list by text.
- FR9: Users shall be able to add a new record via a side panel form, edit an existing record via the same form pre-filled, and delete a record after an inline confirmation step.
- FR10: Users shall be able to toggle a record's active/inactive status directly from the list without opening the edit form.
- FR11: The add/edit form shall validate required fields before allowing save and surface errors inline next to the offending field.
- FR12: List and form UI shall be visually consistent across all master-data screens (same table chrome, same drawer, same toggle control), per G3.

### 6.3 Setting screen behavior — Configuration/Policy screens

Applies to behavior/policy configuration such as Appointment Settings, No-Show Setting, Reschedule Setting, Appointment Cancellation Setting, Waitlist Setting, Appointment Preferences, Self Scheduling, Web Embeds, Provider Schedule Rules, SMS/Email/Voice/Phone Calls, Message Templates, Telehealth Provisions/Settings, Google Calendar, AI Agent, Appointment Agent, Escalations.

- FR13: Each configuration screen shall present its settings grouped into labeled panels by theme (e.g., "Check-In Settings").
- FR14: Each control (toggle, stepper, select, text field) shall be paired with a short description of its effect.
- FR15: Changes shall be applied via an explicit Save action; the screen shall confirm a successful save with transient visual feedback.

### 6.4 Extensibility

- FR16: Adding a new setting shall require only: (a) one new entry in the central nav data source, (b) one new screen component, (c) one new thin route file. No changes to the sidebar, overview page, or layout should be necessary.

## 7. Non-Functional Requirements

- NFR1: All Global Masters screens shall support light and dark mode.
- NFR2: The overview grid shall be responsive (1 column on small screens, up to 3 on wide screens); tables and forms shall remain usable down to standard laptop widths.
- NFR3: The sidebar shall remain independently scrollable from the content pane so long setting lists don't push navigation out of view.
- NFR4: Interaction affordances (edit/toggle/delete) shall be discoverable on hover without permanently cluttering the row.

## 8. Current Scope (the 9 sections)

| # | Section | Settings |
|---|---|---|
| 1 | Organization | Room Types, Equipment Types, Country, State, City, Holidays |
| 2 | Users & Access | Administrative Roles, Staff Roles, Provider Permissions, Provider Types, Specializations |
| 3 | Clinical | Services, Visit Types, Form Preferences, Document Types, Referral Source |
| 4 | Scheduling | Cancellation Reasons, Reschedule Reasons, Appointment Settings, No Show Setting, Reschedule Setting, Appointment Cancellation Setting, Waitlist Setting, Appointment Preferences, Provider Schedule Rules, Self Scheduling, Web Embeds, Appointment Agent |
| 5 | Patient Communication | SMS, Email, Voice, Phone Calls, Message Templates |
| 6 | Patient Management | Gender, Pronoun, Marital Status, Relationship to Patient, Contact Methods, Patient Type, Patient Stage, Registration, Recall Types, Recall Status, Recall Preference |
| 7 | Billing & Coding | Insurers, Procedure Codes |
| 8 | Tasks | Escalations |
| 9 | PractMD Connect | Telehealth Provisions, Telehealth Settings, Google Calendar, AI Agent |

## 9. Open Issues / Risks

- **No persistence layer (blocking for production use).** Every screen seeds from an in-memory mock array; all edits are lost on refresh. Before this ships to real admins, each screen needs a backing API/database integration. This is the single largest gap between current state and a usable product.
- **Orphaned routes.** `organization/business-hours`, `organization/timezone`, `scheduling/scheduling-rules`, `scheduling/provider-rules`, and `scheduling/appointment-masters` exist as built screens/routes but are not linked from the nav data (`GM_SECTIONS`), so they're unreachable in normal use. Decide per-route whether to wire them in, or remove them.
- **No access control.** Anyone who can reach `/global-masters` can currently edit anything on it; there's no enforcement tying the Roles/Permissions defined in Users & Access back to Global Masters itself.
- **No audit trail.** Changes to org-wide settings (e.g., billing codes, scheduling policy) have no history of who changed what/when — worth prioritizing given the compliance sensitivity of healthcare data.

## 10. Future Considerations (explicitly out of scope for now)

- Backend persistence + optimistic UI / error states for save failures.
- Field-level permissions (e.g., only Super Admin can edit Procedure Codes).
- Bulk import/export for large lookup lists (e.g., Procedure Codes, Insurers).
- Change history / audit log per setting.
- Per-clinic override of select global masters, if a future requirement emerges.
