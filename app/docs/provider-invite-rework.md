# Provider workflow rework — invite provider to organization (PRM-105)

Scope of this pass: the schema, the full-page Add/Edit form, the View page, and the invitation flow.
**Not in this pass** (next work): configurable capabilities / permission overrides, dependent master
updates, full offboarding panel-resolution.

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
17. **Invitation journey:** Welcome → set password → done → `/provider/activate`. MFA is skipped (deferred). The terms step is switched off (`CLINIC_TERMS_REQUIRED` in `data/provider-record.ts`), as "not active" in the spec. Unknown and superseded links show the same "This invitation has expired." screen (no error screens).
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
