# Life Movie subtitle admission — 2026-10-10

Studio's actual shortform and longform create routes accepted arbitrary `subtitleText`, bound it into a render digest and forwarded it to Jobs. Actual Jobs shortform schema admission rejects malformed SRT and cues beyond output duration; its actual longform child planner rejects malformed SRT while clipping valid cues into child ranges. A mocked successful transport response therefore did not prove that the submitted plan was executable.

This child of Studio `ef808a71bcbf7d28359f524ee79e95d45d5c0c09` validates those existing SRT rules before hashing or dispatch. Accepted subtitle bytes remain unchanged, including CRLF and optional cue indices/settings. Empty captions remain allowed. Longform clipping remains Jobs' responsibility; valid cues crossing segment boundaries are preserved. The existing source normalization, source offsets, SceneTruth fields, budgets, identity/consent fences and false provider/public-release authorities are retained. No dependency, lockfile, backend architecture or Jobs/Spatial/Factory source changed.

Actual source observations:

| Check | Predecessor | Corrected |
| --- | --- | --- |
| Eighteen actual Studio builder cases | 3 pass / 15 fail | 18 pass / 0 fail |
| Eighteen actual Studio→Jobs schema/child-planner cases | 3 pass / 15 fail | 18 pass / 0 fail |

The read-only integration harness loads Jobs' actual `functions/src/jobs/studioLifeMovieContract.ts` (blob `948e814ee8b5399bc2e84f8653db8f6f70ad78f6`) and `studioLifeMovieLongformContract.ts` (blob `943c01b985fce852b9749dafab7ec94d7e524bf8`) with its existing locked Zod dependency. Fresh raw reads confirm both leaves in current Jobs owner #170 at `150347557567fff70743c06af25bf1f79ba47d7e`. The harness uses synthetic sources, consent strings and SceneTruth references; it does not authenticate, validate signatures, dispatch, generate media or call providers.

The existing mounted route tests now reject malformed captions before an outbound call (two additional cases per shortform/longform route). Their successful synthetic transport fixtures use executable SRT. The encoded-body-size boundary still reproduces HTTP413 using valid SRT, preserving that original test's purpose. These route tests exercise actual source with explicit synthetic Auth/Jobs adapters; they are not credentialed runtime acceptance.

Declared Node20.20.2/pnpm9.7.0 frozen install and complete `pnpm release:check` passed:64 discovered test files,114 node:test cases,0 failures/skips; all guards, lint with one inherited warning, types, static smoke, Next16.3.8 production build and Functions TypeScript build. Log SHA256 `00c3368ada730bf4d461e3dd252af38efd1169aa900675823021faea10df5b39`. Actual consumer corrected log SHA256 `6304053a9762f567765bfd73431dd17a7be9c8714ab27b9dc03c2609a8b595e4`; its original failing baseline remains retained (`b2ee90d8e77a4943c2b1c7ee99f2c45af06cad80dce85177b3544fcd17c166f0`).

This is source repair evidence. Parent-source native video/loaded-emulator passes do not certify this successor. Fresh exact-source native checks, retained current-Spatial media and controller leases remain necessary before admission. Real signed SceneTruth/private-family media, narrated/listening/voice/provider/cost/device/deployed parity and independent exact-head release approval remain open. No release freeze, main merge, production deployment, spend or Golden Master is authorized.
