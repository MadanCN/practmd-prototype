This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Product section — Supabase setup

The **Product** card on the role selector (`/product`) holds the Roadmap & Priorities tabs
(Priorities, Workstreams, Timeline) and Challenges. Unlike the rest of the prototype, it stores
data in Supabase. The full build spec is in [docs/product-roadmap-and-challenges-spec.md](docs/product-roadmap-and-challenges-spec.md).

Without the environment variables below, the rest of the prototype works as before and the
Product pages show a "Supabase not configured" notice.

Run every command from this folder (`app/`).

1. **Create the project.** At [supabase.com](https://supabase.com) → New project. Name it
   (for example `practmd-product`), set a database password and save it, and pick the region
   closest to the team. Wait for it to finish provisioning.
2. **Copy the keys.** Project Settings → API Keys. Save the **Project URL**, the **anon public**
   key and the **service_role** key (on newer dashboards these are under the "Legacy API keys"
   tab; the `sb_publishable_…` key also works in place of the anon key). The project **ref** is
   the `<ref>` in `https://<ref>.supabase.co`.
3. **Environment.** Copy `.env.example` to `.env.local` and fill it in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only; never NEXT_PUBLIC_
   ```
   `.env.local` is git-ignored.
4. **Link the CLI.** `supabase init` has already been run (`supabase/config.toml` is committed).
   ```
   npx supabase login
   npx supabase link --project-ref <ref>        # asks for the database password
   ```
5. **Add the team.** Edit `supabase/seed.sql` and add everyone to `app_users` (role `viewer`,
   `editor` or `admin`), including Prasanna as `editor`. Only listed emails can see anything.
6. **Create the schema and seed it.**
   ```
   npm run db:push        # = npx supabase db push --include-seed
   ```
   This applies `migrations/0001_roadmap.sql` and `0002_challenges.sql`, then runs `seed.sql`
   and `seed_challenges.sql`. (Alternative: paste the four files, in that order, into the
   dashboard's SQL Editor.) To add people later, insert into `app_users` from the SQL Editor.
7. **Auth.** Authentication → Sign In / Providers → **Email**: enabled (magic link / OTP).
   Authentication → URL Configuration: **Site URL** = the Vercel production URL; **Redirect URLs**:
   `http://localhost:3000/**`, `https://<your-app>.vercel.app/**`, and for preview deploys
   `https://*-<your-vercel-team>.vercel.app/**`.
   Supabase's built-in email sender has a very low hourly limit — before the workshop, set up
   custom SMTP (Authentication → Emails → SMTP settings) so a room full of people can sign in.
8. **Realtime.** Database → Publications → `supabase_realtime` should list `roadmap_items`,
   `scoring_weights`, `workstreams`, `challenges` and `challenge_notes` (the migrations add them).
9. **Types.** `npm run db:types` regenerates `lib/product/database.types.ts` from the linked
   project. Run it after every migration.
10. **Check.** In the SQL Editor:
    ```sql
    select code, name, score from roadmap_items_scored order by score desc nulls last, unlocks desc, ease desc, name limit 3;
    -- r1 Insurance verification (manual) 78 · r2 Office Ally clearinghouse connection 78 · a1 Quill: scribe and coding 75
    select count(*) from challenges;   -- 16
    ```
    And confirm RLS blocks outsiders — with only the anon key this returns `[]`:
    ```
    curl "https://<ref>.supabase.co/rest/v1/roadmap_items?select=code" -H "apikey: <anon key>"
    ```

**Vercel:** see "Environment variables" in `../DEPLOYMENT.md`.

### Using it

- Sign in at `/product/login` with an email that is in `app_users`. Others get a
  "You don't have access" page, and RLS returns nothing to them.
- Roles: `viewer` (read-only), `editor` (edit items, challenges and notes), `admin` (also manages
  workstreams, challenge categories and the Timeline's MVP line).
- To add someone, in the SQL Editor:
  `insert into app_users (email, display_name, role) values ('name@example.com', 'Name', 'editor');`

### Tests

- `npm test` — Vitest unit tests (score maths, schemas, recap builder, history diff, CSV).
- `npm run test:e2e` — Playwright smoke tests against a running app and the real database. They
  create and then delete their own rows. See [e2e/README.md](e2e/README.md).
