# Failsafe Diagnostics

Studio should keep creator/admin surfaces available with clear configuration gates when secrets are absent.

## Checklist
- Validate `.env.example` and Firebase emulator defaults.
- Keep waitlist/contact routes explicit about dry-run behavior if needed.
- Keep integration URLs configurable and nullable.

## Suggested command order
- `pnpm install --no-frozen-lockfile`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm studio:smoke`
