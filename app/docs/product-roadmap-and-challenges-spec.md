# Product section — Roadmap & Priorities and Challenges (build spec)

Reference copy of the two build briefs for the **Product** section of the PractMD prototype
(the sixth card on the role selector at `/`). Both apps live under `/product` in this Next.js
project and share one Supabase project.

## Adaptations to this codebase

The briefs were written for a standalone app. Inside this repo they are adapted as follows:

| Brief says | Here |
|---|---|
| Routes `/priorities`, `/workstreams`, `/timeline`, `/challenges` | `/product/priorities`, `/product/workstreams`, `/product/timeline`, `/product/challenges` (landing at `/product`) |
| `src/lib/...` | `lib/product/...` (this project has no `src/`; `@/*` maps to the project root) |
| `src/lib/database.types.ts` | `lib/product/database.types.ts` |
| `supabase/` | `app/supabase/` (next to `package.json`) |
| Next.js 14+ | Next.js 16 (already in the repo; `middleware.ts` is called `proxy.ts` in 16) |
| shadcn/ui | Not installed: `shadcn init` rewrites `globals.css` for the whole prototype. Product UI uses small local primitives in `components/product/ui/` styled with the brand tokens instead |
| Inter font | Loaded only for the Product section (the rest of the prototype keeps Geist) |

---

# Part 1 — PractMD Roadmap and Priorities

You are building **PractMD Roadmap and Priorities**, an internal web app the PractMD product team uses to rank, plan and track roadmap work. It replaces the "Roadmap and priorities" tab of a static HTML workshop pack. Data must live in **Supabase**, and several people must be able to edit it at once during a live workshop.

Work in the milestone order at the end of this prompt. After each milestone, run the app, run the tests, and tell me what you built before moving on. Ask me before adding any dependency not listed here.

## 1. Tech stack

- **Next.js 14+ (App Router) with TypeScript (strict)**, deployed to Vercel.
- **Tailwind CSS** and **shadcn/ui** for components. Use **lucide-react** for icons.
- **@supabase/supabase-js** and **@supabase/ssr** for data, auth and realtime.
- **@tanstack/react-table** for the priorities table, and **@tanstack/react-query** for data fetching and optimistic updates.
- **zod** and **react-hook-form** for forms and validation.
- **date-fns** for dates.
- **@dnd-kit/core** for drag and drop (workstream board and timeline).
- **Vitest** for unit tests and **Playwright** for one end-to-end smoke test.
- The timeline is a **custom component built on CSS grid**, not a Gantt library, so the colours and layout stay under our control.

## 2. Brand and look

- Colours: navy `#001A57`, ink `#0B1D3F`, ocean `#026280`, teal `#02979D`, aqua `#03EECD`, page background `#F4F8FA`, card `#FFFFFF`, border `#D5E0E7`, muted text `#52627A`, warning `#B63B26`.
- Font: Inter from Google Fonts. Support light and dark mode.
- Layout: a top bar with the PractMD wordmark (text is fine) and the signed-in user, then three tabs: **Priorities**, **Workstreams**, **Timeline**. Keep the selected tab in the URL (`/priorities`, `/workstreams`, `/timeline`).
- The app must work on a 1280px laptop projected on a screen. Tables scroll horizontally on small screens, and the page itself never does.

## 3. Supabase setup (write these steps into README.md as well)

1. Create a Supabase project at supabase.com. Save the **Project URL**, the **anon public key** and the **service role key**.
2. In the repo, run `npx supabase init`, then `npx supabase link --project-ref <ref>`.
3. Create `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only, used by the seed script, never shipped to the browser
   ```
   Add `.env.local` to `.gitignore`. Add `.env.example` with empty values.
4. Put the schema in `supabase/migrations/0001_roadmap.sql` and the seed in `supabase/seed.sql` (both below). Apply them with `npx supabase db push`. For the seed, run `psql` against the connection string or add an `npm run seed` script that uses the service role key.
5. Auth: enable **Email OTP (magic link)** under Authentication → Providers. Under URL configuration, set the Site URL to the Vercel URL and add `http://localhost:3000` to the redirect URLs.
6. Realtime: the migration adds the tables to the `supabase_realtime` publication. Confirm they are listed under Database → Replication.
7. Generate types with `npx supabase gen types typescript --linked > src/lib/database.types.ts`. Regenerate after every migration.
8. On Vercel, set the same three environment variables. `SUPABASE_SERVICE_ROLE_KEY` is only needed if a server action uses it.

## 4. Database schema (`supabase/migrations/0001_roadmap.sql`)

Implement exactly this, then adjust only if something fails and tell me why.

(The SQL lives in `app/supabase/migrations/0001_roadmap.sql` — that file is the authoritative copy.)

## 5. Seed data (`supabase/seed.sql`)

(The SQL lives in `app/supabase/seed.sql` — that file is the authoritative copy. Items with null scores are deliberately unscored: score them live in the workshop.)

## 6. How the score works (show this in an info popover on the Priorities tab)

Each item gets four ratings from 1 to 5:

| Criterion | Column | Meaning | Default weight |
|---|---|---|---|
| Revenue impact | `revenue_impact` | Brings in or protects revenue | 3 |
| Operational efficiency | `operational_efficiency` | Removes manual work at the practice | 3 |
| Unlocks | `unlocks` | Other items depend on it | 2 |
| Ease | `ease` | Higher means less effort | 2 |

**Formula**

```
weighted = (R·wR + O·wO + U·wU + E·wE) / (wR + wO + wU + wE)      → between 1 and 5
base     = round( (weighted − 1) / 4 × 100 )                        → between 0 and 100
score    = clamp(base + adjustment, 0, 100)
```

- Round half away from zero. Use Postgres `numeric`, and mirror it in TypeScript with integer maths so the UI never disagrees with the database: `base = Math.round(((sumSW - sumW) * 100) / (4 * sumW))`, where `sumSW = R·wR + O·wO + U·wU + E·wE` and `sumW = wR + wO + wU + wE`. The database view is the source of truth. The TypeScript function exists only for instant feedback while the user drags a slider.
- If any of the four ratings is empty, or all weights are 0, the score is **empty** and the row shows a "Not scored" chip.

**Adjustments**

1. **Weights (global).** Four sliders from 0 to 5, stored in `scoring_weights`. Changing a weight re-ranks every item live for everyone, through realtime. Add three presets: *Balanced* (3,3,2,2, the default), *Revenue first* (5,2,2,1) and *Relief first* (2,5,2,1), plus a "Reset to default" button.
2. **Per-item adjustment.** A value from −20 to +20 for judgement the four criteria miss, such as a contractual commitment. It needs a written reason of at least 5 characters, which the database enforces. Show it as a small `+5` or `−10` badge next to the score, with the reason in a tooltip.
3. **Tie-breaks.** For equal scores, sort by unlocks (descending), then ease (descending), then name.
4. **Dependency warning.** This never changes the score. If an item ranks above an item in its `depends_on_codes`, show an amber warning icon: "Ranks above something it depends on: <name>."

**Unit tests (Vitest)** must cover at least these:

- (5,4,4,3) at default weights → 78
- (1,3,5,4) → 50
- (5,5,5,5) → 100
- (1,1,1,1) → 0
- One rating missing → null
- All weights 0 → null
- Base 95 + adjustment 10 → 100 (clamped)

The HTML workshop pack showed 77 for the first case because of floating-point rounding. The app should show 78.

## 7. Tab 1: Priorities (the list)

**Columns, in order:**

`#` (rank) · **Item** (name, with MVP and AI tags; click opens the detail drawer) · **Workstream** (coloured chip) · **Revenue impact** · **Operational efficiency** · **Unlocks** · **Ease** · **Score** (number plus a thin bar coloured by value, with the adjustment badge) · **From** · **To** · **Horizon**

**Behaviour**

- **Inline edit.** Editors click a rating cell and pick 1 to 5 from a compact select. From and To use a month picker that stores the first day of the month for From and the last day for To. Horizon is a select. Saves are optimistic through React Query, roll back on error, and show a toast.
- **Sorting.** Any column header sorts. Shift-click adds a secondary sort. The default is Score descending with the tie-breaks above. Keep the sort in the URL query string.
- **Filters.** Workstream (multi-select), horizon (multi-select), "AI only", "MVP only", "Unscored only", and a text search on name and description.
- **Weights panel.** A collapsible panel above the table holds the four sliders, the presets, and the formula popover.
- **Add item.** The **+ Add item** button opens a sheet with name (required), code (auto-suggested from the workstream letter plus the next number, editable, unique), workstream (required), description, outcome, the four ratings, adjustment and reason, From and To, horizon, depends on (multi-select of existing items), MVP toggle and owner. Validate with zod to match the database checks. A newly added item appears at its ranked position with a short highlight.
- **Detail drawer.** Shows every field, editable. It also shows "Depended on by", a reverse lookup, and a **History** list from `roadmap_item_history` that shows who changed what and when, as a readable diff of changed fields.
- **Archive** replaces delete. It sets `archived_at`, and a **Show archived** toggle brings archived items back with a restore action.
- **Export CSV** of the current view.
- **Realtime.** Subscribe to `roadmap_items` and `scoring_weights`. When someone else changes a row, update it in place and flash it briefly. Show the avatars or initials of who is online using Supabase Presence.
- **Empty and loading states,** plus a clear read-only mode for viewers (no edit affordances).

## 8. Tab 2: Workstreams (table of workstreams)

- A grid with **rows = workstreams** in `sort_order`, each with its colour swatch, and **columns = Done · Now · Next · Later · Not now**.
- Each cell lists compact item cards showing the name, a score badge, and MVP and AI tags. Sort cards by score within a cell.
- Drag a card to another column to change its horizon. Use @dnd-kit, save optimistically, and support the keyboard as well.
- Each workstream row has a summary cell: number of items, average score of scored items, and how many are in Now and Next.
- A **Manage workstreams** dialog (admins only) edits name, colour (with a contrast check against white text), description and order. Changing a colour updates the Timeline.
- Clicking a card opens the same detail drawer as Tab 1.

## 9. Tab 3: Timeline

- A Gantt-style view built on CSS grid, with **one column per month**. The default range runs from the current month to 18 months ahead. Zoom switches between Month and Quarter, and a range picker changes the window.
- **Swimlanes by workstream**, each labelled with its colour. Every item with both From and To is a bar in its workstream colour, with the item name inside the bar (or beside it when the bar is short). Show the score in the tooltip. Put a small MVP diamond on MVP items.
- A **legend** of the workstream colours with their names, so it is clear what each colour represents. Clicking a legend entry toggles that workstream.
- A **today** marker, and an optional **MVP line** marker read from `settings.mvp_line` (label and date, editable by admins).
- **Unscheduled tray.** Items without dates sit in a side tray grouped by workstream. Dragging one onto the grid sets From to the drop month and To to From plus 1 month. Dragging a bar's edges resizes it, and dragging the bar moves it. Everything snaps to months and saves optimistically.
- **Dependency lines (optional toggle).** Draw a thin line from the end of each dependency to the start of the item. Colour it red when the item starts before its dependency ends.
- Clicking a bar opens the detail drawer.
- Horizon filter chips across the top.

## 10. Non-functional requirements

- **Accessibility.** Every control is keyboard reachable, colour never carries meaning alone (horizon and status also appear as text), text contrast is at least 4.5:1, and the timeline bars have aria-labels.
- **Performance.** Handles 500 items smoothly. Memoize the table and virtualize rows above 200.
- **Security.** Only the anon key reaches the browser. All access goes through RLS. The service role key is used only in the seed script.
- **Code quality.** Keep Supabase queries in `src/lib/data/*`, keep the score maths in `src/lib/score.ts`, and generate types from the database. No `any`.

## 11. Milestones (stop after each and report)

1. **Scaffold.** Next.js, Tailwind, shadcn, the brand theme, the layout with tabs, and the Supabase client helpers (browser and server).
2. **Database.** The migration, seed, generated types and README steps, plus `score.ts` with its Vitest tests passing.
3. **Auth.** Magic-link sign-in and sign-out, access limited to `app_users`, a clear "You don't have access" page otherwise, and a read-only view for the viewer role.
4. **Priorities tab.** Table, sorting, filters, inline edit, weights panel, add item, detail drawer with history, archive, CSV export, and realtime.
5. **Workstreams tab.** Grid, drag between horizons, summaries, and manage workstreams.
6. **Timeline tab.** Grid, swimlanes, bars, legend, markers, unscheduled tray, drag and resize, and dependency lines.
7. **Polish and ship.** Dark mode, empty states, a Playwright smoke test (sign in with a test user, add an item, see it ranked), and deployment to Vercel with the environment variables.

## 12. Acceptance checklist

- [ ] With default weights, the seeded list's top items are Insurance verification (manual) (78) and Office Ally clearinghouse connection (78), then Quill: scribe and coding (75).
- [ ] Changing a weight re-ranks the list in under 300 ms and shows up in a second browser within 2 seconds.
- [ ] A new item with ratings (4,4,4,4) scores 75 and appears in the right position.
- [ ] An adjustment without a reason is rejected, both in the form and by the database.
- [ ] Moving a card to Next on the Workstreams tab updates the Horizon column on the Priorities tab.
- [ ] Giving an item dates moves it from the unscheduled tray onto the timeline in its workstream colour.
- [ ] A user not in `app_users` can read nothing, which I can check by querying with that user's token.

---

# Part 2 — Challenges

You are adding Challenges to the PractMD internal workshop app. It replaces the static "Challenges" tab of our HTML workshop pack. The product team uses it to record the challenges we face, discuss them with Prasanna Gopalakrishnan (visiting investor and likely Head of Product), and capture his advice, the decisions we make, and the resulting actions against each challenge. Everything is stored in Supabase and updates live for everyone in the room.

Work in the milestone order at the end. After each milestone, run the app and the tests, and tell me what you built. Ask before adding dependencies not listed here.

## 1. Stack and conventions

If the Roadmap and Priorities app exists, reuse its stack, theme, layout, Supabase helpers, `app_users`, `is_member()` and `can_edit()`, and add a fourth tab, **Challenges** (`/challenges`).

If it doesn't exist, use Next.js 14+ (App Router, TypeScript strict), Tailwind with shadcn/ui, lucide-react, @supabase/supabase-js and @supabase/ssr, @tanstack/react-query, zod with react-hook-form, date-fns, @dnd-kit/core, Vitest and Playwright. Brand colours: navy `#001A57`, teal `#02979D`, ocean `#026280`, aqua `#03EECD`, background `#F4F8FA`, border `#D5E0E7`, warning `#B63B26`. Font: Inter. Then create the `app_users` table and the `current_email()`, `is_member()` and `can_edit()` functions, exactly as in section 3a.

Keep queries in `src/lib/data/challenges.ts` and generate types with `npx supabase gen types typescript --linked`.

## 2. Supabase setup (add to README)

- Use the existing Supabase project, or create one and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` (server and seed only) in `.env.local` and on Vercel.
- Add `supabase/migrations/0002_challenges.sql` (below) and apply it with `npx supabase db push`.
- Add the seed (below) to `supabase/seed.sql`, or to a separate `supabase/seed_challenges.sql`, and run it.
- Enable Email OTP auth if it isn't already on, and add Prasanna's email to `app_users` with the editor role before the session.
- Confirm that `challenges` and `challenge_notes` appear under Database → Replication (realtime).

## 3. Schema

- **3a. Only if building standalone** — `app_users`, `current_email()`, `is_member()`, `can_edit()` and the "members read users" policy (identical to Part 1 §4; not needed here because Part 1 exists).
- **3b.** `supabase/migrations/0002_challenges.sql` — the authoritative copy is `app/supabase/migrations/0002_challenges.sql`.
- **3c. Seed** — the authoritative copy is `app/supabase/seed_challenges.sql`.

## 4. Screens

### 4a. Board view (default)

- One column per category in `sort_order`, each headed with its colour and a count. This matches the layout of the workshop pack.
- Each challenge card shows the title, a one-line description, the Ask in ocean colour prefixed with "Ask:", a status chip (with text, never colour alone), a priority dot, the owner, counts of notes, advice and open actions, and any pinned note (usually Prasanna's key advice) quoted in a callout.
- Each column has a quick-add input at the bottom: type a title and press Enter to create a challenge in that category. The drawer then opens so you can add the rest.
- Drag cards within a column to reorder (saves `sort_order`) or across columns to change category, using @dnd-kit with keyboard support.
- Filters across the top: status (multi), priority, owner, "Has advice", "Has open actions", and a text search over titles, descriptions and notes.

### 4b. List view

A sortable table with columns for title, category, status, priority, owner, raised by, notes, advice, open actions, last activity and created date. Offer it as a toggle next to the board.

### 4c. Challenge drawer (the heart of the feature)

- Editable fields: title, description, category, Ask, status, priority, owner, raised by, and related roadmap item (a searchable select over `roadmap_items` when that table exists, otherwise a free-text code).
- Notes timeline, newest first, with a coloured tag per note type:
  - **Advice** (from Prasanna or another adviser). Show the source name prominently.
  - **Decision**: what we agreed.
  - **Action**: owner and due date, with a checkbox to mark it done.
  - **Question**: an open question to follow up on.
  - **Comment**: general discussion.
- Composer at the bottom: a type selector (default Advice), a body textarea with markdown bold, italics and lists, a source field (default "Prasanna Gopalakrishnan" when the type is Advice, remembered per browser), plus owner and due date fields when the type is Action. Cmd/Ctrl+Enter saves.
- A **"Capture Prasanna's input"** button in the drawer header focuses the composer, set to Advice with the source pre-filled. This is the one-click path during the live session.
- Pin or unpin a note to show it on the card. Authors can edit or delete their own notes, and the timeline shows "edited" when a note has changed.
- The status changes automatically through the trigger, and can still be set by hand.

### 4d. Recap export

A Recap button builds a markdown summary. For each category, it lists each challenge with its status, the ask, all Advice notes (with source), Decisions, and Actions (owner, due date, done or not). Offer Copy to clipboard and Download .md. I paste this into the post-workshop recap.

### 4e. Realtime and presence

Subscribe to `challenges` and `challenge_notes`. New notes appear in open drawers and on cards within 2 seconds, with a brief highlight. Show who is viewing the board with Supabase Presence.

## 5. Validation and permissions

- zod schemas that mirror the database checks. Action fields appear only for Action notes.
- Viewers see everything read-only. Editors create and edit challenges and notes, and can edit or delete only their own notes. Admins manage categories (name, colour, order) in a small settings dialog.
- Archive rather than delete a challenge, with a "Show archived" toggle and a restore action.

## 6. Tests

- Vitest: the recap builder (given fixture challenges and notes, it produces the expected markdown), and the zod schemas (an Action note needs no owner, but a non-Action note must not have one).
- Playwright smoke test: sign in, quick-add a challenge, open it, click "Capture Prasanna's input", save an Advice note, and see the card's advice count go to 1 and the status change to Discussing.

## 7. Milestones (stop after each and report)

1. Migration, seed, types and README steps.
2. Board view with cards, quick add, drag and drop, and filters.
3. Drawer with editable fields and the notes timeline and composer, including "Capture Prasanna's input".
4. List view, recap export, realtime and presence.
5. Tests, dark mode, empty states, and deployment.

## 8. Acceptance checklist

- [ ] The seeded board shows 16 challenges across three categories, with asks on the cards that have one.
- [ ] Adding an Advice note to an Open challenge moves it to Discussing, and adding an Action moves it to Action agreed.
- [ ] A pinned advice note appears on the card.
- [ ] The recap markdown lists every Advice note with its source and every Action with its owner and due date.
- [ ] A second browser sees a new note within 2 seconds.
- [ ] A user not in `app_users` gets nothing back from `challenges` or `challenge_notes`.

---

## Build progress

All milestones for both parts are built, and verified against the live Supabase project on
2026-09-30 (`npm test`, and `npm run test:e2e` against a production build).

| Milestone | Status |
|---|---|
| Roadmap M1 — Scaffold | Done |
| Roadmap M2 — Database, types, `score.ts` tests | Done (types generated from the linked project) |
| Roadmap M3 — Auth (magic link, `app_users` gate, no-access page, viewer read-only) | Done |
| Roadmap M4 — Priorities tab | Done |
| Roadmap M5 — Workstreams tab | Done |
| Roadmap M6 — Timeline tab | Done |
| Roadmap M7 — Polish (dark mode, empty states, Playwright smoke test) | Done; Vercel deploy picks it up from `main` once the env vars are set |
| Challenges M1–M5 | Done |

### Where things live

| What | Where |
|---|---|
| Routes | `app/product/(app)/{priorities,workstreams,timeline,challenges}`, `app/product/{login,no-access,auth}` |
| Session refresh + sign-in redirect | `proxy.ts` → `lib/product/supabase/proxy.ts` |
| Supabase queries | `lib/product/data/{roadmap,challenges}.ts` |
| Score maths | `lib/product/score.ts` (mirrors the `roadmap_items_scored` view) |
| zod schemas | `lib/product/schemas.ts` |
| Recap builder | `lib/product/recap.ts` |
| Shared realtime channels | `lib/product/realtime.ts` |
| UI | `components/product/{roadmap,challenges,ui}/` |
| Unit tests | `lib/product/*.test.ts` (`npm test`) |
| Smoke tests | `e2e/` (`npm run test:e2e`, see `e2e/README.md`) |

### Decisions and deviations

- **No new dependencies beyond the brief.** `@hookform/resolvers` is replaced by a 20-line
  resolver in `lib/product/zod-resolver.ts`. The smoke tests use the `playwright` library already in
  the repo, not `@playwright/test`. Row virtualisation above 200 rows is a small built-in windowing
  in the Priorities table, not `@tanstack/react-virtual`.
- **Scores:** the table shows the database's score (`roadmap_items_scored`). `score.ts` is used only
  while a weight slider moves and for optimistic edits, and the two agree by construction (tests).
- **Timeline:** dropping an unscheduled item sets From to the drop month and To to the end of that
  month (a one-month bar). Keyboard: space picks up a bar, arrows move it a month at a time.
- **Workstreams board:** a card can only move between horizons within its own workstream row.
- **Challenge notes — schema limit:** the brief's RLS lets only a note's author update it, so
  pinning a note and ticking an Action as done are available to the note's author only (others see
  the state read-only). Relax the "authors update own notes" policy if anyone should be able to do this.
- **Challenge counts** (notes, advice, open actions, last activity) are computed in the app from the
  loaded notes, with the same definitions as the `challenges_summary` view; the notes are loaded
  anyway for search and pinned callouts.
