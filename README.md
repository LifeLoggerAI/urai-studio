# URAI Studio

Production website and studio control surface for URAI Studio at `www.uraistudio.com`.

## Active app

This repository is a pnpm monorepo. The public production website lives in:

- `apps/studio`

The root workspace includes `apps/*` and `packages/*` from `pnpm-workspace.yaml`.

## Local setup

```bash
pnpm install
pnpm --filter studio dev
```

Open `http://localhost:3000`.

## Validation

Run these before deployment:

```bash
pnpm --filter studio typecheck
pnpm --filter studio lint
pnpm --filter studio test
pnpm --filter studio build
```

From the repo root, the aggregate workspace commands are:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

## Environment variables

Copy the example file and fill only the values needed for the deployment target:

```bash
cp apps/studio/.env.example apps/studio/.env.local
```

Required for a plain marketing launch:

- `NEXT_PUBLIC_SITE_URL=https://www.uraistudio.com`

Required only if contact and waitlist submissions should persist to Firestore:

- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Without Firebase Admin credentials, the API routes return a safe non-persistent success message for local/demo environments.

## Deploying `www.uraistudio.com`

Recommended Vercel setup:

1. Import `LifeLoggerAI/urai-studio` into Vercel.
2. Set the project root directory to `apps/studio`.
3. Use pnpm as the package manager.
4. Build command: `pnpm build`.
5. Install command: `pnpm install --frozen-lockfile`.
6. Output: Next.js default.
7. Add `www.uraistudio.com` as the production domain.
8. Add required environment variables in Vercel Project Settings.
9. Point DNS to Vercel as instructed by the Vercel domain screen.
10. Verify `https://www.uraistudio.com`, `/sitemap.xml`, `/robots.txt`, `/contact`, and `/waitlist` after deployment.

Do not commit secrets. Use hosting provider environment settings for server-only values.
