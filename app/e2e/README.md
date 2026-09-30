# Product smoke tests

Plain Playwright (the `playwright` library already in the repo) against a running app and the
real Supabase project. Each suite deletes whatever it created, and restores the scoring weights.

## Setup

In `.env` or `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...        # generates sign-in links and cleans up; never shipped
E2E_EMAIL=you@accessionhealthtech.com # an editor or admin in app_users
E2E_BASE_URL=http://localhost:3000    # optional; point at a deploy to test it
```

Sign-in skips the inbox: the service role generates a magic link and the browser opens it through
the app's real `/product/auth/callback` route.

## Run

```
npm run dev              # in one terminal
npm run test:e2e         # both suites
npm run test:e2e -- roadmap
npm run test:e2e -- challenges
```

## What they check

**roadmap** — an adjustment without a reason is rejected by the form and by the database; a new
(4,4,4,4) item scores 75 and ranks #3; dragging its card to Next on Workstreams updates the Horizon
on Priorities; dragging it from the Timeline tray onto the grid schedules it in its workstream
colour; changing a weight re-ranks in under 300 ms and reaches a second browser within 2 s; a viewer
gets no edit controls; a signed-in user who isn't in `app_users` reads nothing and can't insert.

**challenges** — the seeded board loads; quick add creates a challenge and opens it; "Capture
Prasanna's input" focuses the composer with the source filled in; saving Advice moves the card to
Discussing with an advice count of 1, and a second browser sees it within 2 s; an Action moves it
to Action agreed; a pinned note is quoted on the card; the recap lists the advice with its source
and the action with owner and due date.

`node --env-file=.env e2e/screens.mjs [tab ...]` saves screenshots to `e2e/.screens/` (git-ignored).
