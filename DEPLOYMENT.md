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

## Netlify

Configured by `netlify.toml` (`base = "app"`).
