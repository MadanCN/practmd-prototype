# PRD: Patient Onboarding & Insurance Eligibility Verification Workflow

**Status:** Draft
**Owner:** TBD
**Related:** [Global Masters PRD](./global-masters-prd.md), [Global Masters Jira Backlog](./global-masters-jira-backlog.md)

## 1. Summary

A guided, six-step self-service flow that takes a new patient (or their guardian/caregiver) from "who is this account for" through insurance submission and intake forms — and, behind the scenes, automatically routes the resulting work to the right staff: a Care Coordinator is assigned as soon as account-holder identity is captured, and a new **Revenue Management** role picks up insurance eligibility verification through a defined state machine. Once eligibility is resolved, the result surfaces back to the patient and prompts the Care Coordinator to book the first appointment.

## 2. Problem Statement

Today, new-patient intake, insurance collection, and eligibility verification are disconnected steps with no defined handoff: nothing automatically tells staff a new patient has started onboarding, nothing routes insurance information to whoever verifies coverage, and nothing tells a Care Coordinator when it's actually safe to book the patient's first visit (i.e., once payment/coverage is understood). This creates delay and manual chasing between front-desk/coordinator staff and billing, and risks booking a visit before insurance is confirmed — which is a direct source of billing surprises and claim denials.

## 3. Goals

- **G1 — Self-service onboarding.** A patient or their guardian can complete account setup, patient demographics, care intent, insurance, and required intake forms in one guided flow, on their own device, without staff involvement for data entry.
- **G2 — Automatic staff handoff.** The moment there's enough information to act on (an identified account holder; submitted insurance), the right internal team is automatically notified and given a trackable unit of work — no manual routing.
- **G3 — Governed eligibility verification.** Insurance eligibility is verified through an explicit, auditable state machine owned by a new Revenue Management function, instead of an ad hoc/manual check.
- **G4 — Close the loop back to the patient and care team.** Once eligibility is known, the patient sees their real coverage status, and the Care Coordinator is explicitly prompted to book the appointment — rather than either side having to check in.

## 4. Non-Goals (this phase)

- Real payer connectivity (clearinghouse/EDI 270/271 integration) — the eligibility check is staff-driven (RCM manually verifies "via portal/phone/clearing house" per the state machine) rather than automated in this phase.
- Real OCR/extraction from uploaded insurance card images — card upload is captured but not parsed.
- Real identity verification / KBA for the "responsible adult" — captured as declared information only.
- Automated appointment booking — the Care Coordinator is prompted to book, but booking itself uses the existing scheduling flow.

## 5. Actors & Roles

| Actor | Involvement |
|---|---|
| **Patient** | Completes onboarding if seeking care for themselves. Views eligibility status once resolved. |
| **Guardian / Caregiver** | Completes onboarding on behalf of a minor or dependent adult; provides their own contact/consent details in addition to the patient's. |
| **Care Coordinator** (existing role) | Auto-assigned and notified once the account holder's info is captured (end of Step 2); receives a task at that point, and a second task once eligibility resolves, prompting them to book the first appointment. |
| **Revenue Management** (**new role**) | Owns the eligibility-verification worklist. Picks up submitted insurance, verifies coverage, and drives the case through the eligibility state machine to a resolved outcome. |

## 6. The Six-Step Onboarding Flow

Each step shows progress ("Step X of 6") and supports back navigation except where noted.

### Step 1 — Who is this account for?
Choice between "I'm seeking care for myself" (adult managing their own care) and "I'm a guardian or caregiver" (parent, legal guardian, POA, or authorized caregiver for someone else). This choice determines the framing of Step 2 and whether Step 3 collects a second, distinct identity.

### Step 2 — Your information
Captures the responsible adult on the account: first/last name, relationship to patient (when acting as guardian), and mobile number for appointment reminders and secure-message alerts. Notes that the patient's own details are collected next, and that signed consent/POA can be uploaded to Records → Documents after onboarding rather than blocking progress here.

**This is the trigger point for care-team assignment — see §7.1.**

### Step 3 — About the patient
Captures the patient's legal identity exactly as it appears on a government-issued ID: first/last name, optional preferred name, date of birth (required), sex at birth, and optional pronouns. When Step 1 was "myself," this duplicates/confirms the Step 2 identity as the formal patient record; when Step 1 was "guardian," this is a distinct second identity.

### Step 4 — What brings you here?
Optional, skippable. Multi-select "type of care" pills (e.g. Talk Therapy, Medication Management, ADHD Services, Spravato Treatment, Assessments & Tests) and a preferred-location choice (Telehealth or a specific clinic location). Explicitly reversible later ("You can skip and edit any time").

### Step 5 — Insurance
Two-part step:
1. **Choose insurance** — search/select from a payer list.
2. **Add insurance card** — scan/upload front and back of the card, relationship to the cardholder, cardholder first/last name and DOB, and member ID.

**Completing this step is the trigger point for eligibility-verification routing — see §7.2.**

### Step 6 — A few quick forms
A list of intake forms with estimated completion time; one (Patient Health Information) is marked required, the rest optional and resumable later ("You can save and return any time"). Opening a form (e.g. Patient Health Information) presents the actual intake questionnaire (services of interest, primary care provider, pharmacy information, etc.). Completing/submitting the required form finishes onboarding.

## 7. Automation & Workflow Triggers

### 7.1 Step 2 completion → Care Coordinator assignment

The instant the account holder's information (Step 2) is submitted — before the patient has even finished the remaining steps — the system:
1. Assigns a Care Coordinator to the case (round-robin or team default).
2. Notifies that Care Coordinator.
3. Creates a task in the Care Coordinator's task queue (e.g. "New patient onboarding started — <name> — prep for intake").

**Why this early:** the account holder's contact info alone is enough for a coordinator to start preparing — confirming clinic/location fit, flagging anything about the guardian relationship that needs follow-up — well before insurance or forms are done. Waiting until full completion would delay staff awareness of a new patient in progress.

### 7.2 Insurance submission → Revenue Management worklist

When Step 5 is submitted, the system:
1. Creates a **worklist item** in the Revenue Management queue, carrying the uploaded insurance information (payer, member ID, card images, cardholder details) plus a reference to the patient/case.
2. The item enters the eligibility-verification state machine at **Pending** (see §7.3).

This is a distinct queue from the Care Coordinator's — insurance/billing verification is Revenue Management's job, not the coordinator's, and shouldn't clutter their task list until there's a booking-relevant outcome (§7.4).

### 7.3 Eligibility Verification State Machine

States and transitions (see the state diagram provided):

- **Pending** — task created in the Revenue Management queue, unclaimed.
- **In-Progress** — an RCM staff member picks the task (self-pick or round robin) and verifies coverage via the payer portal, phone, or clearinghouse.
- From In-Progress, the RCM staff member resolves to one of:
  - **Verified – Active** (policy covers the requested service(s))
  - **Verified – Inactive** (policy is not active)
  - **Verified – Not Covered** (policy is active but the specific service is excluded)
  - **Unable to Verify** (payer unreachable, or conflicting information) → the patient is offered **Self-Pay**, moving the case to **Self-Pay Confirmed**
  - **On-Hold** (more information needed from the patient) — returns to **In-Progress** once the missing information is received
- **Verified – Active** transitions to **Expired** once its termination date passes (system-driven, not manual).
- **Expired** and **Verified – Inactive** can both be resubmitted for **re-verification**, returning to **In-Progress**.
- A patient who declares self-pay at onboarding (rather than submitting insurance) goes directly to **Self-Pay Confirmed**, bypassing verification entirely.

**Carve-out redirect (operational note, not a state):** some payers don't administer behavioral-health benefits themselves — they contract that entire service line to a specialty vendor (a Managed Behavioral Health Organization, e.g. Optum Behavioral Health sitting behind United Healthcare). When this applies, RCM staff need to verify against the carve-out vendor's own network, payer ID, and authorization rules rather than the medical payer on the card. This should be surfaced as guidance/context on the worklist item, not modeled as a separate state.

### 7.4 Eligibility resolved → patient view updates + Care Coordinator prompted to book

Once an eligibility case reaches a resolved state (Verified – Active, Verified – Inactive, Verified – Not Covered, or Self-Pay Confirmed):
1. The patient's own insurance/coverage view reflects the new status immediately (no staff-side action needed for the patient to see it).
2. The originally assigned Care Coordinator receives a second, distinct task: book the patient's first appointment, now that coverage (or self-pay) is confirmed.

This is the loop-closing step that today doesn't exist — a coordinator currently has no reliable signal that it's "safe" to book because billing hasn't confirmed coverage.

## 8. New Role: Revenue Management

A role distinct from Care Coordinator, Provider, and Admin, scoped to the insurance-eligibility worklist (and, longer-term, other revenue-cycle work — claims, denials, payment posting — which is explicitly out of scope for this phase but the role should be named/structured to accommodate it later).

**Minimum capabilities for this phase:**
- View and self-pick (or receive via round robin) items in the eligibility worklist.
- Move a worklist item through the state machine in §7.3, including recording which verification channel was used (portal/phone/clearinghouse) and free-text notes (e.g. carve-out vendor details).
- See patient/insurance details needed to perform verification (payer, member ID, cardholder info, uploaded card images).

## 9. Data Model Additions (conceptual)

- **OnboardingSubmission** — one per onboarding attempt: account-holder identity, patient identity, care-intent selections, insurance selection + card details, form-completion state, and current step reached.
- **EligibilityWorklistItem** — one per submitted insurance: linked submission/patient, current state (per §7.3), assigned RCM user (if picked), verification channel/notes, carve-out flag/notes, timestamps per transition.
- **Task** — generic task record usable by both Care Coordinator triggers (§7.1 and §7.4), carrying type, assignee, linked patient/submission, and status.
- **Role: Revenue Management** — new role definition alongside the existing Admin / Care Coordinator / Provider / Patient roles.

## 10. Non-Functional Requirements

- **NFR1 — Traceability:** every state transition in the eligibility workflow should be attributable to a user and timestamped, given its billing/compliance sensitivity.
- **NFR2 — No blocking on optional steps:** Steps 4 and 6 (beyond the one required form) must be skippable/resumable without blocking account creation or insurance submission — onboarding should not stall waiting on non-essential information.
- **NFR3 — PHI handling:** government-ID-level identity data (Step 3) and insurance card images (Step 5) are sensitive; access to the worklist and submissions should be limited to Care Coordinator/Revenue Management/Admin roles, not general staff.
- **NFR4 — Mobile-first UI:** the onboarding flow is designed mobile-first (per the provided screens) and should remain usable on small viewports end to end.

## 11. Open Questions

- What happens if a patient abandons onboarding after Step 2 (Care Coordinator already notified) but never submits insurance or finishes forms? Does the Care Coordinator's task need a follow-up/reminder SLA?
- Round-robin vs. self-pick assignment for Care Coordinators and Revenue Management — same mechanism for both, or different?
- Should "Unable to Verify" have a retry limit before it's forced toward a Self-Pay conversation, or can RCM retry indefinitely?
- Is there a required SLA on how long a worklist item can sit in Pending/In-Progress before it's escalated (this may want to reuse the existing Escalations master from Global Masters rather than inventing a separate mechanism)?
- Does Verified – Not Covered need its own distinct patient-facing messaging/next-step (e.g. self-pay offer), or does it behave like Verified – Inactive from the patient's point of view?
