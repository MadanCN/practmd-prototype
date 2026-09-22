# Provider workflow rework — invite provider to organization (PRM-105)

Scope of this pass: the schema, the full-page Add/Edit form, the View page, and the invitation flow.
**Not in this pass** (next work): dependent master updates, full offboarding panel-resolution.

## Fifth pass — capability model merge, admin Approval page, onboarding simplification, design pass

A large batch: merge the two capability models into one real permission gate; restructure admin
approvals around a new Approval page (Leave Approvals + Change Requests tabs); simplify the account-
setup/activation sequence per an exact spec (no DOB/phone step, optional MFA, no step numbering, no
tour, a channel-based notification matrix); trim the limited portal's nav; a design-canvas pass on
Add/Edit/View. Full to-do list and the clarifying questions asked before starting are earlier in this
conversation; this is what shipped.

**Capability model merge** (`data/provider-record.ts`, `data/provider-credentialing.ts`,
`lib/provider-session.ts`, `lib/provider-permissions.ts`, `components/provider/layout/DevProviderSwitcher.tsx`,
`app/provider/telehealth/[id]/page.tsx`): `AccessCapabilities` (the newer, admin-editable model on
`ProviderRecord`) is now the one real permission gate — `provider-session.ts`'s `capabilities` derives
live from the record instead of a frozen type-based seed, same pattern as the earlier `clinicalStatus`
fix. Added `can_sign_notes` (a real gate in `signaturePaths()` that had no home in the new model);
dropped `can_diagnose`/`can_view_full_note` (defined in the old model but never actually read anywhere —
confirmed by grep before removing). `can_telehealth`→`telehealth_license`, `can_bill`→`can_be_billed`
renamed at their one remaining call site each. `data/provider-credentialing.ts`'s `ProviderCapabilities`/
`defaultCapabilities()` still exist, now purely as internal seed-data generation for realistic demo
profiles — no longer read by any permission check.

**Old onboarding flow retired**: `/provider/welcome` no longer renders the old `ProviderOnboarding`
component (DOB/phone check → password → full MFA enrollment → terms) — that component and its
`CodeInput`/`FakeQrCode` helpers are deleted. The route now finds or sends a live invite for the
session's provider and forwards to `/invite/[token]` (`ensureLiveInvite()` in `provider-store.ts`), so
there is exactly one account-setup flow. This is also what Settings' "Replay account activation" hits.

**Activation wizard** (`app/provider/activate/page.tsx`, `lib/provider-activation.ts`): "Step N of 8"
labels removed; the Product Tour step deleted (`ACTIVATION_STEPS` is now 3 items, not 4); notification
preferences reworked into an In App / Email / SMS matrix — SMS is disabled everywhere ("Soon"),
"Unsigned note escalation"'s In App toggle is locked on. Submitting a profile or hours correction now
shows the provider an explicit confirmation ("N changes to your profile were sent to your clinic admin
for review") before advancing to the next step.

**Readiness page** (`app/provider/readiness/page.tsx`): simplified from 5 granular rows (license/NPI/
payer-enrolment detail) to exactly 3 — Profile confirmed, Working hours confirmed, Pending verification
— per spec. The granular credentialing detail this removed is still fully tracked in `ProviderClinicalProfile`
for anyone who needs it later; this page just no longer surfaces it.

**Limited-portal nav** (`lib/provider-nav.ts`, `components/provider/layout/ProviderLayout.tsx`'s
`LIMITED_ALLOWED`): Messages and My Availability no longer show (or route-guard-allow) at the `limited`
portal level — only Account Readiness, plus the always-shown Profile/Settings/Support in the sidebar's
bottom section. Both the nav-visibility list and the route-guard allow-list needed the edit — they're
two independent lists (a pre-existing drift risk the earlier pass on this feature had already flagged);
verified with Playwright that navigating straight to `/provider/availability` or `/provider/messages/internal`
by URL while `under-verification` now redirects to readiness, not just that the links are hidden.

**Admin Approval page** (`app/admin/approvals/page.tsx`, new; `components/admin/LeaveApprovalsPanel.tsx`
and `components/admin/ChangeRequestsPanel.tsx`, new): "Leave Approvals" nav item renamed "Approval",
now a tabbed page. Leave Approvals tab is the existing leave-request logic, moved out of its own page
into a panel component unchanged. Change Requests tab is new — every provider's pending profile/hours
corrections org-wide (not just the one on that provider's own page, which still exists too), with the
same Approve/Revise/Deny per request and the same exact field diffs the provider submitted.
`/admin/leave-approvals` now redirects to `/admin/approvals?tab=leave` in case anything still links it.

**Admin sidebar branding** (`components/layout/Sidebar.tsx`): the placeholder blue square with a plain
"P" is now the real `PractMdLockup` logo — this was the one place in the app still using it, confirmed
by grep before changing.

**Link-state switcher** (`components/provider-staff/InviteStateSwitcher.tsx`, new): a flask-icon button
(same convention as the provider portal's existing `DevProviderSwitcher`) on every `/invite/[token]`
screen, to jump between the seeded demo states (live, expired, deactivated, used) without hunting for
tokens. Doesn't cover the "replaced" state — there's no static seeded token for a superseded link.

**Text-to-speech indicator** (`components/provider/encounters/EncounterNoteEditor.tsx`): a disabled
"Dictate" button in the note toolbar, styled "Soon" — a UI affordance only, no Web Speech API
integration (explicitly scoped that way).

**Design pass on Add/Edit/View**: a Design-canvas Artifact was built first showing the target direction
(elevated `practmd-card-pop` section cards, brand-teal "done" states and navy active-state in the
Add/Edit rail instead of emerald/blue, brand-colored tabs on View instead of blue) —
https://claude.ai/artifact/SVwBNK8JAbQGUEFQC4Vo4g — then implemented into the real components
(`form/fields.tsx`'s `SectionCard`, `AddEditProvider.tsx`'s rail, `ProviderDetail.tsx`'s tabs). The
mockup's flat-gradient avatar was deliberately **not** copied into the real View page — the real avatar
uses the provider's own assigned color, meaningful data used for identification elsewhere (calendars,
lists); replacing it with a fixed gradient would have thrown that away for a cosmetic match.

**Scoping notes:**
- Both `LeaveApprovalsPanel` and the per-provider `CorrectionsPanel` on a provider's own page still
  exist alongside the new global Change Requests tab — kept both since they serve different moments
  (triage across the org vs. context while already looking at one provider), and they share the same
  underlying `resolveCorrection`/`markCorrectionForRevision` calls so acting from either stays in sync.
- `EncounterNoteEditor.tsx` has 4 pre-existing `react-hooks/set-state-in-effect` lint errors (lines 129,
  132, 140, 606 — none near the Dictate-button edit) discovered while touching this file for the first
  time this session. Not fixed — out of scope for a UI indicator; flagged here for whoever picks up that
  file next.

## Real activation-wizard corrections + admin approval, UI uniformity, MFA step (added)

The user gave the exact post-invitation sequence (Welcome+password → MFA skip → provider reviews and
can correct the admin-entered profile/hours → no change leads straight to the portal, a change raises
an approval task) and asked for a real Approve/Deny/Revise workflow in the admin app, plus a UI pass on
Add/Edit/View for uniformity, plus a wording recheck. This pass:

- **MFA step**: `InviteLanding.tsx` gained an actual "Set up two-factor authentication" screen between
  password and policies (previously `enrol-mfa` was marked done silently, with no screen). Always
  skippable — there's no per-clinic "MFA required" flag in this prototype, unlike the terms step.
- **Real correction/approval data model** (`lib/provider-store.ts`): a `Correction` — provider id,
  source (`profile`/`hours`), a list of human-readable field diffs, a forward `patch` and a `revertPatch`.
  `submitCorrection()` applies the patch immediately (so the provider isn't blocked on their own edit)
  and raises the correction as `pending`. `resolveCorrection(id, "approve"|"deny")`: approve is a no-op
  besides marking it resolved (the value's already live); deny re-applies `revertPatch`, restoring what
  the admin originally entered. `markCorrectionForRevision()` closes the task out when the admin instead
  chooses to set their own value from the Edit page. This replaces the earlier, simpler "apply + just log
  it" approach from the previous pass.
- **`app/provider/activate/page.tsx` "Confirm profile" step, rebuilt**: previously only 4 fields
  (display name, preferred name, suffix, NPI, bio). Now shows and lets the provider correct the *actual*
  `ProviderRecord` — photo, name parts, suffix, phone, DOB, every credential row (NPI + licenses),
  provider type, visit types, specializations, and (when self-scheduling is on) bio/education/years/
  services — matching the field list the spec calls out for this step. Email, clinic access are shown
  read-only (the provider's login and admin-owned access grants, not theirs to edit here). EIN, fax,
  taxonomy code and capabilities are **not shown at all** — clinic-billing/permission fields a provider
  has no reason to see. On Continue, every changed field is diffed against the record snapshot taken
  when the wizard loaded and submitted as one `Correction`.
- **"Confirm working hours" step**: now uses the shared `WorkingHoursEditor` (multi-location, multi-
  segment — the real schema) instead of the wizard's old single-segment-per-day stand-in, so what the
  provider confirms is what the admin actually entered. (It doesn't have the admin Edit form's one-click
  "Add break" / "Copy to all days" shortcuts — same underlying data, less polish; see below.)
- **Admin approval UI** (`components/provider-staff/CorrectionsPanel.tsx`, wired into `ProviderDetail.tsx`):
  a "N changes from the provider need review" panel showing the exact field-by-field diffs (the same
  values the provider saw and edited), with Approve / Revise / Deny per correction. Revise links to the
  Edit page and closes the task (the admin's own save is the resolution). Resolved corrections move to a
  quieter list near the full audit history.
- **"Active — Limited" status**: already existed in the data (`STATUS_META`), but every status badge in
  the app (`ProviderStaffList`, `ProviderDetail` header) rendered it in the same amber bucket as the
  pending/in-progress statuses, so a bookable-but-scope-restricted provider looked identical to one still
  going through verification. New shared `components/provider-staff/StatusBadge.tsx`, driven by a `tone`
  field added to `STATUS_META`, gives every clinical status its own accurate color (active-limited and
  offboarding both read as a distinct "limited" navy tone, separate from full-amber "pending" and
  full-emerald "active").
- **UI uniformity pass**: the View page's primary "Edit" action, the Add/Edit form's "Save", and every
  dialog's primary button (Resend, Change status, Deactivate/Reactivate, the email-changed prompt) now
  share the same brand-gradient treatment and `rounded-xl` corners — previously View used plain
  `blue-600` while the invite dialogs used the brand gradient, so the three screens didn't visually agree
  on what a "primary action" looks like.
- **Wording recheck**: the Change-status dialog's info callout was still describing status permissions as
  future work ("arrive with the status-lifecycle work") — stale, since that lifecycle is now real
  (`STATUS_META.permits` gates the portal). Reworded to state what's actually true: status controls
  portal access now, but transition *order* still isn't validated. Also fixed a "not required by [clinic]
  yet" on the MFA screen that implied a future requirement that isn't tracked anywhere.

**Scoping decisions (please review):**
- `submitCorrection`/`resolveCorrection` don't distinguish a Credentialing-Admin queue from a Clinic-Admin
  queue — reference.md calls out NPI/licence corrections as going to Credentialing specifically. This
  prototype has one admin persona, so all corrections land in one queue on the provider's page.
- The confirm-hours step uses the generic `WorkingHoursEditor` rather than the admin Edit form's richer,
  purpose-built `ScheduleSection` editor (one-click break insertion, copy-to-all-days, per-clinic
  optgroups, overlap validation) — same `WorkingHour`/segment data, so nothing is lost, just less editing
  polish. `WorkingHoursEditor`'s own doc comment already named this exact reuse as its purpose.
- The UI-uniformity pass targeted the highest-visibility shared elements (status badges, primary-action
  buttons, corner radii) across Add/Edit/View and the invite dialogs specifically — it did not recolor
  the rest of the admin app (Global Masters, Clinic Management, etc.), which still uses plain `blue-600`
  throughout. Making Provider screens match the *rest of the admin app* and making them match *the new
  brand-gradient invite/onboarding screens* are two different, mutually exclusive "uniformity" goals; this
  pass chose the latter since that's where all the new work in this feature actually lives.

## Visual rebuild to the "Provider Invitation — Email & Link States" design (added)

The user shared a Claude Design-canvas artifact (12 artboards: the invitation email + its resend
variant, the combined welcome+password screen, a clinic-policies screen, an account-ready hand-off,
four link-state screens — Expired, Replaced, Already-used→Sign-in, Deactivated — and three admin
boards: the invitation status card + history table, the resend dialog, and Add/Edit's invite
checkboxes/duplicate-email/email-changed dialogs) and asked for a full rebuild to match it, states and
new behaviour included, not just a restyle.

It turned out the app's existing brand CSS (`app/globals.css` — `--color-brand-*`, `--color-navy-*`,
`.practmd-gradient`, `.practmd-gradient-vivid`, `.practmd-card-pop`) is the *exact* palette and card
treatment the design canvas was built from, so the rebuild reuses those utility classes rather than
hardcoding the mockup's hex values — the provider-portal onboarding screens built earlier already used
the same system, so this stays visually consistent with them.

**`components/provider-staff/InviteLanding.tsx`** — rewritten:
- Welcome + create-password merged into one split-panel screen (form card left, brand-gradient
  marketing panel with feature pills right) instead of two separate steps.
- Password rules changed to match the design: 8+ chars, uppercase, lowercase, number, **special
  character** (previously 10 chars, upper+lower combined, number — no special-char rule).
- Clinic-policies (terms) screen redesigned with a document list and a recorded-acceptance note.
- "Account ready" hand-off screen redesigned as its own step.
- **New distinct screen:** a superseded/invalidated link ("A newer invitation was sent") with the
  email masked (`n•••@clinic.com`) — previously this fell through to the generic expired copy.
- Expired / deactivated-before-accepting screens gained a real admin contact card (avatar initials,
  name, role, mailto/tel), sourced from `CLINICS[].admins` matched by the invitation's `sentBy`.
- An already-used link now renders a full (non-functional) sign-in screen in place, instead of
  `router.replace("/")` bouncing the visitor away before they see anything.

**`components/provider-staff/InviteDialogs.tsx`**:
- `InviteEmailPreview` rewritten to match the design's email layout (From/To/Subject/Preview card,
  clinic-branded header, CTA, expiry, link fallback, "need help", security notice, footer address) and
  gained an `isResend` variant (amber "this is a new invitation" banner, different subject/headline) —
  `ProviderDetail` now passes `isResend={invs.length > 1}`.
- `ResendInviteDialog` rewritten with the design's default / editing-email (with an "Available" check)
  / rate-limited states, plus a new **"sent" confirmation state inside the dialog itself** (a navy toast
  card with Done) instead of closing straight back to a plain page-level banner.
- New `InviteHistoryTable` — a compact Event/When/Address/By grid, filtered to invite-related audit
  events, shown above the existing full audit list on the provider detail page.

**`components/provider-staff/ProviderDetail.tsx`** — the invitation status card restyled to the
design's icon-circle + title/subtitle + action-button layout, with "Bounced" now a distinct visual/copy
state from a generic "couldn't be delivered" (same underlying `delivery: "failed"` outcome — see
scoping note below).

**`components/provider-staff/AddEditProvider.tsx`** — invite checkboxes' accent color and the primary
Save / "Send to new address" buttons switched to the brand gradient; the email-changed-after-send
dialog gained the design's explanatory note box.

**Scoping decisions (please review):**
- The design's Admin-Invite-Panel board is a *style-guide showcase* of every possible invitation state
  side-by-side (its own canvas title says so), not a literal "all states visible at once" requirement —
  a real provider's invitation is in exactly one state at a time, so the rebuild makes the single status
  card correctly render *whichever* state applies, rather than building a static swatch gallery into
  the app.
- The design's "Sending…" / "Send failed — retrying (attempt 2 of 3)" / "Send failed — gave up" states
  were **not** built as real automatic background retries — there's no backend to retry against in this
  prototype, and the resend button already *is* the retry mechanism. "Bounced" is real (the existing
  `isUndeliverable()` heuristic), just relabelled/restyled to match; the multi-attempt auto-retry
  choreography was judged to be simulated theater with no functional payoff and was skipped.
- The duplicate-email inline error ("email already used by a provider in another clinic" /
  "non-provider account", with an "Open existing provider" link) was **not** rebuilt to match the
  design's red-alert-box + deep-link treatment — `lib/provider-form.ts` only carries a pre-formatted
  string per issue today, and widening that to a structured, linkable conflict object felt like too
  much risk to a validation engine memory already flags as tested/verified, for a cosmetic nicety. The
  existing plain-text conflict message (already correct and distinguishes provider/staff/admin
  conflicts) is unchanged.
- Verified end-to-end with Playwright against the real dev server: account setup → policies (briefly
  flipped `CLINIC_TERMS_REQUIRED` to true for this, then reverted) → account ready → activation wizard;
  expired, deactivated/not-active, and used→sign-in link states; the admin email preview, resend dialog
  (default/editing/rate-limited/sent-toast) and status card. Zero console errors; `tsc`/`eslint` clean
  on every touched file (one pre-existing, unrelated `WorkingHour`/`BusinessHour` type error remains at
  `ProviderDetail.tsx:205` — see Known issues below).

## Post-invitation onboarding (added — spec source: the flowcharts + tables pasted into this session)

The activation wizard, readiness/limited-portal screens, `ClinicalStatus` lifecycle and permission
gates (`data/provider-credentialing.ts`, `app/provider/{welcome,activate,readiness}`,
`lib/provider-{session,activation}.ts`, `lib/provider-permissions.ts`) were already built in an earlier
session for the Provider Portal PRD — but they ran on a hardcoded demo provider (`p1`) and a frozen
status snapshot, completely disconnected from the invite/`ProviderRecord` system built in this pass.
This session wired the two together:

- **`InviteLanding.finish()`** now calls `setSessionProvider(inv.providerId)` and marks the account-setup
  steps done, so `/provider/activate` resumes as the *real* just-invited provider, not whichever provider
  the session last remembered.
- **`lib/provider-session.ts`** now derives `clinicalStatus` from the live `ProviderRecord.status`
  (`lib/provider-store.ts`) instead of the frozen `CLINICAL_PROFILES` seed, and re-renders on provider-store
  changes too — so admin-side status (Provider & Staff) and provider-side status (portal banners/gating)
  agree. The dev switcher's status override still wins, for demoing any status on any provider.
- **`app/provider/activate/page.tsx`**: finishing "Confirm working hours" now calls the real
  `changeStatus(id, "under-verification", …)` (was a session-only override, invisible to the admin side)
  and logs the wizard completion to the provider's audit trail. Field corrections at "Confirm profile"
  (display name / suffix / NPI) are still tracked locally for the readiness page's own list, and now also
  written to the audit trail via the new `logCorrection()` so the admin sees them — applied immediately,
  no separate approve/deny queue (see assumption below).
- **`"rejected"`** added to `ClinicalStatus` (Pending Review → Rejected, per the lifecycle flowchart) —
  terminal, no login, alongside `offboarded`.

**New assumption (please review):** the spec says NPI/licence corrections at account-setup are "applied
and a task is raised to the Credentialing Admin" with Approve/Revise/Deny options. This prototype has one
admin persona and no separate Credentialing-Admin queue UI, so — consistent with how `ChangeStatusDialog`
already treats status changes ("any status can be set and it is logged") — corrections are applied
immediately and simply logged to the audit trail for the admin to see, rather than held pending a
three-way decision. The Under Verification → Pending Review ("Credentialing verifies") and Pending Review
→ Clinically Active/Rejected ("Clinic Admin approves") transitions are made through the existing generic
*Change status* dialog on the provider detail page, which now includes every status in the lifecycle.

**Still not built:** Suspended/Offboarding transitions aren't guarded by the "no open encounters, unsigned
notes or future appointments" rule the spec calls for on Offboarded — `lib/provider-impact.ts` has the
appointment/co-sign counts this would need, but the guard itself isn't wired into `ChangeStatusDialog` yet.
Capability defaults-by-provider-type exist (`data/provider-credentialing.ts`) but the newer
`AccessCapabilities` shape on `ProviderRecord` (`data/provider-record.ts`) is still a second, unmerged
capability model — the portal's permission gates (`lib/provider-permissions.ts`) read the older
`ProviderCapabilities`/`CLINICAL_PROFILES` shape, not the admin-editable one on the record.

## What was built

| Area | Where |
|---|---|
| Provider record schema (Identity & Credentials, Access & Services, Schedule, Profile & Bio) | `data/provider-record.ts` |
| Country → State → City data | `data/geo.ts` |
| Validators / formatters (NPI Luhn, EIN, fax, zip, phone, expiry) | `lib/provider-validation.ts` |
| Form model + validation + Edit guardrails engine | `lib/provider-form.ts` |
| "What would this break?" counts (future appts, hours conflicts, co-sign queue) | `lib/provider-impact.ts` |
| Persisted store: records, invitations, audit, resend rate limit, duplicate-email check, legacy mirror | `lib/provider-store.ts` |
| Unsaved-changes guard | `lib/use-unsaved-guard.ts` |
| Add/Edit page (rail, sticky footer, save flows) | `components/provider-staff/AddEditProvider.tsx` + `form/*` |
| View page (header, actions, 4 tabs, invitation card, audit) | `components/provider-staff/ProviderDetail.tsx` |
| Resend dialog, email preview, change status, deactivate, audit list | `components/provider-staff/InviteDialogs.tsx` |
| What the provider sees on the link | `components/provider-staff/InviteLanding.tsx` → `/invite/[token]` |
| Routes | `/provider-staff/add`, `/provider-staff/[id]` (view), `/provider-staff/[id]/edit` (new) |

Verified in a real browser (Playwright): full Add → save → invite; duplicate email (provider + staff);
all Edit guardrails; resend + rate limit + delivery failure; every invite-link state; discard prompt;
no hydration/console errors; `tsc` and `eslint` clean on the changed files.

## Demo guide

Seed providers are lifted into the new schema automatically. Four are pre-set to walk the invite paths
(links: `/invite/<token>`):

| Provider | State | Token |
|---|---|---|
| p6 | Invited, live invitation | `demo-live-p6` |
| p7 | Invited, invitation expired | `demo-expired-p7` |
| p8 | Deactivated before accepting | `demo-deactivated-p8` |
| p9 | Invitation accepted (used link → redirects to sign-in) | `demo-used-p9` |

- **Failed delivery:** use an email containing `bounce` (or ending `.invalid`) — the simulated mail server rejects it.
- **Expiring / Expired badges:** p1 has a DEA expiring in ~52 days; p12 has an expired licence, p13 an expiring one.
- **Clinic-removal / hours blockers:** p1 (Dr. Mitchell) has confirmed appointments today at Penfield.
- State is persisted in `localStorage` key `practmd.v2.provider-records`; clear it to reset.

## Decisions and assumptions (please review)

**Spec ambiguities**
1. **NPI value.** The spec says the NPI row is required *and* that ticking Clinically Active makes the NPI row required.
   Read together: the NPI row is always present and fixed, but its **value is optional at invite** and required when
   Clinically Active is ticked (or once the provider is past invite/account-setup) — same rule as DOB. Any value entered must pass the check digit.
2. **Taxonomy code:** spec says "Number (15 digit limit)"; real taxonomy codes are alphanumeric (e.g. `2084P0800X`), so I accept up to 15 letters/digits.
3. **Required beyond the spec's table:** Clinic Access (≥1), Provider Type, and at least one working day (schedule is "required" by default), plus Country/State/City (City is required, so its parents must be).
4. **Capability defaults on Add:** everything off except *Can Be Billed*. Coming-soon capabilities (E-Prescribing, Can Order Labs) are disabled and show their stored value.
5. **Add with both boxes unticked** is allowed: provider is created *Invited*, no email; use *Send invite* later.
6. **Telehealth licences:** the org's purchased count isn't defined anywhere, so it is 50 (44 used by seed data). The spec's "3 of 10" is just the display format.

**Data / behaviour**
7. **Seed NPIs were regenerated** as check-digit-valid numbers (`data/providers.ts`, `data/provider-credentialing.ts`), otherwise Edit on every existing provider would fail NPI validation. Existing seed EIN/fax come from the primary clinic's TIN/fax.
8. **Status field** is read-only in the form (auto-derived on Add; on Edit changed via *Change status*). *Change status* currently allows any status → any status and logs it — transition rules come with the lifecycle work.
9. **Deactivate / Reactivate** toggles `isActive`. A deactivated, not-yet-accepted provider can still set a password from the link and then sees "Your account is not active".
10. **Breaks** reuse the existing segment model: a break is the gap between two segments at the same location (so Care Coordinator / Provider portal availability keeps working unchanged). *Add break* splits a block; the amber chip edits or removes it.
11. **"Appointments affected by an hours change"** = confirmed appointments on/after *Apply from* that fit the **current** hours but not the **new** ones (location-aware when the appointment has a location). Appointments already outside the old hours (bad seed data) are not counted.
12. **One scheduled hours change per provider.** It is applied automatically on read once its date arrives. There is no "cancel scheduled change" (not in the spec).
13. **Removing a clinic** is blocked while confirmed future appointments exist there; the list of appointments is shown with a link to the appointment list.
14. **Email change:** not-yet-accepted → old link is invalidated and you're asked whether to send to the new address. Already accepted → the record is flagged *Email unverified* and a re-verification is logged; the real re-verification flow is a separate ticket and is not built.
15. **Resend limits** (1 per 10 min, 5 per day) count *resends* only — not the first send — and **failed deliveries don't count**, so a typo doesn't lock the admin out.
16. **Reminders** (day 3 and 6) are recorded on the invitation and shown, but nothing sends them.
17. **Invitation journey:** Welcome → set password → optional MFA (skippable) → done → `/provider/activate`. The terms step is now driven by Global Masters → Users & Access → Providers → **Provider Terms & Conditions** (`lib/provider-terms-store.ts`) instead of a hardcoded constant: off by default, and when switched on it shows that master's actual configured content and logs a `terms_accepted` audit entry against the provider. Unknown and superseded links show the same "This invitation has expired." screen (no error screens).
18. **Actor** for audit entries is a fixed "Sarah Kowalski (Clinic Admin)" — there is no real auth in the prototype.

**Removed / changed from the old screens**
19. Old View "Credentialing & Readiness" tab (milestones, payer enrolment) is gone: the spec lists four tabs and says Enrollment must **not** be included now. Old Add fields not in the new schema (gender, pronouns, languages, permission role, licence number/state, licensed states) are no longer edited here; legacy values are preserved when saving.
20. The list's *Deleted* tab is now *Inactive* (deactivated providers) and the Status column shows the clinical status.
21. Old `?edit=true` links replaced by the `/edit` route.

**Cross-portal**
22. Saved providers are mirrored into the legacy `PROVIDERS` array, so they appear in the Care Coordinator and Provider portals **within the session**. Status does not yet gate bookability there (that's lifecycle work) — e.g. an *Invited* provider is currently bookable in the CC calendar.
23. Photos are downscaled to 256px JPEG before being stored in `localStorage`.
24. Unsaved-changes guard covers Cancel/Back, in-app link clicks (sidebar, breadcrumbs) and tab close/reload; it does **not** intercept the browser Back button.

## Known issues / not verified
- Project-wide `tsc` currently reports pre-existing errors unrelated to this work: a `WorkingHour` shape
  mismatch across several files (`provider/availability`, care-coordinator appointment components,
  `AvailabilityCalendar.tsx`, `ProviderDetail.tsx`'s business-hours grid) left over from an earlier working-hours
  restructure, plus two missing Global Masters screens (Business Hours / Timezone) whose pages weren't removed
  when the components were. None of this touches the files this pass changed; `tsc`/`eslint` are clean on those.
- The invite → activation → readiness → admin-status loop was verified end-to-end with Playwright against
  the real dev server (p6's invite link through to "Under Verification" showing on both sides, zero console
  errors) — screenshots aren't kept, but the flow is repeatable via the demo tokens below.
- Dark mode and phone-width layouts were not visually checked (the section rail hides below the `md` breakpoint).
- Suspend/Offboarding impact-guard and the capability-model merge noted above are still open.
- **Note for anyone touching this repo:** `app/` (this Next.js project) contains its own separate, stale
  nested git repository (`app/.git`, diverged history, unrelated uncommitted changes) in addition to the
  real repo rooted one level up. Run git commands from the outer root (or with `git -C`), never with a bare
  `cd app && git ...` — it silently operates on the wrong repo.
