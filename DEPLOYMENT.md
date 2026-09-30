# Deployment

The Next.js app lives in `app/`, not at the repo root. The repo root has no
`package.json`, so any host must be pointed at `app/`.

## Vercel

Project → Settings → Build and Deployment:

| Setting          | Value                         |
| ---------------- | ----------------------------- |
| Root Directory   | `app`                         |
| Framework Preset | Next.js                       |
| Build Command    | default (`npm run build`)     |
| Output Directory | default (`.next`)             |
| Node.js Version  | 20.x or 22.x                  |

Root Directory can only be set in the dashboard. `vercel.json` cannot set it,
and Vercel only reads `app/vercel.json` once the root is `app`. After changing
it, redeploy.

If the root is left as `./`, the build "succeeds" but produces no pages, and
every URL returns `404 NOT_FOUND`.

A healthy build log shows `next build` followed by a route table (`○ /`, …).

### Environment variables

Only the Product section (`/product`) needs these; the rest of the prototype builds and runs
without them. Project → Settings → Environment Variables:

| Name | Value | Environments |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the anon public key | Production, Preview, Development |

`NEXT_PUBLIC_` values are baked in at build time, so **redeploy** after adding or changing them.

Do not add `SUPABASE_SERVICE_ROLE_KEY` to Vercel for now: nothing deployed uses it (it is only
for local seeding). If a server action ever needs it, add it without the `NEXT_PUBLIC_` prefix and
mark it Sensitive.

Then in Supabase → Authentication → URL Configuration, set the Site URL to the production URL and
add `https://<your-app>.vercel.app/**` (and the preview wildcard) to Redirect URLs. Full setup:
`app/README.md` → "Product section — Supabase setup".

## Netlify

Configured by `netlify.toml` (`base = "app"`).
