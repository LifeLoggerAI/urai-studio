# URAI Studio Deployment Runbook

Production target: https://www.uraistudio.com

## Local verification

Run from the repository root:

```bash
corepack enable
pnpm install
pnpm --filter studio typecheck
pnpm --filter studio lint
pnpm --filter studio build
```

Optional runtime check:

```bash
pnpm --filter studio dev
```

Open http://localhost:3000 and verify the homepage, demo, waitlist, contact, settings, status, and module routes.

## Required environment variables

Start from `apps/studio/.env.example` and configure production values in the hosting provider dashboard. Never commit real secrets.

Required for public URL behavior:

```txt
NEXT_PUBLIC_SITE_URL=https://www.uraistudio.com
```

Firebase server credentials are only required for server-side Firebase Admin paths. Keep them out of browser-exposed variables.

## Vercel deployment

Recommended project settings:

```txt
Framework Preset: Next.js
Root Directory: apps/studio
Install Command: pnpm install
Build Command: pnpm build
Output Directory: .next
Node Version: 20+
```

Domains:

```txt
www.uraistudio.com -> production
uraistudio.com -> redirect to www.uraistudio.com
```

## Launch checklist

- Verify `pnpm --filter studio build` passes.
- Confirm `NEXT_PUBLIC_SITE_URL` is set to `https://www.uraistudio.com`.
- Confirm `/robots.txt` resolves.
- Confirm `/sitemap.xml` resolves.
- Confirm Open Graph preview renders using `/og` or replace it with final branded imagery.
- Confirm all header/footer links resolve.
- Confirm forms and waitlist flows either work or show safe fallback states.
- Confirm Firebase and Stripe credentials are only configured in provider secrets.
- Confirm analytics, if enabled, uses consent-safe behavior.

## Known follow-ups

- Add final favicon and app icon assets.
- Add final Open Graph image or dynamic OG route.
- Decide whether legacy `uraistudio-app/hosting` files should be archived or removed.
- Run accessibility testing on the deployed preview.
