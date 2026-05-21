# URAI Studio V1 Launch Checklist

## Public demo gates

- Keep the operator QA panel disabled for public demos.
- Confirm `/studio/admin` renders the gated public-demo message unless explicitly enabled by deployment configuration.
- Do not expose raw diagnostic payloads or operator-only workflows to public visitors.

## Public forms

- Public forms must submit through trusted server routes only.
- Direct public access to stored submission records must stay denied.
- Do not add public read, list, or write access for stored submission records.

## V1 product requirements

The public home experience must keep these visible in V1:

- Ground layer
- Orb companion
- Chat interface
- Magical home shell
- Memory stars / symbolic timeline
- Emotional and cognitive field reconstruction
- Relationship fields
- Recovery fields
- Emotional weather
- Asset Factory and cinematic generation direction
- Studio / Cinema / Motion / Visuals / Music brand lattice

Run `pnpm test` and `pnpm studio:smoke` after changes; these include guards for V1 home markers and public-demo admin gating.

## Release verification

Before release, run:

```bash
pnpm install --no-frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm --dir functions build
pnpm studio:smoke
```

## Evidence to capture for launch lock

- CI run URL for the final commit.
- Deploy output.
- Screenshot or curl output for `/`, `/studio`, `/studio/admin`, `/api/system/health`, and `/readyz`.
- Confirmation that `/studio/admin` is gated in public demo mode.
