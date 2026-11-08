# One UrAi Genesis Studio — R856 locally executed exact-blob lease regression

**Date:** 2026-11-07 UTC. **Classification:** executed narrow original-function check on reconstructed and independently Git-SHA-verified text, not full repository acceptance. **RELEASE HOLD.** No credential, user media, provider call, cloud project, paid compute, or repo runtime change.

## Immutable source checks
- Current Life Movie candidate [Studio #179](https://github.com/LifeLoggerAI/urai-studio/pull/179) commit `153d6c35557c66a8b9f8629778ca796b83730464`: exact `functions/src/fallback-job-lease.ts` **1759 bytes**, Git blob `6b6ec72a101e102fce559489c893999b59d9b2c7`, computed raw SHA256 `186a0309ba38bac2253827bebe3693e01bf8bd3129a7b6264676d3214233ff20`.
- Independent fallback donor [Studio #175](https://github.com/LifeLoggerAI/urai-studio/pull/175) commit `aeac000487bb79d3f2e7ea1af406fb96c1a2a1ba`: exact counterpart **2015 bytes**, Git blob `ddcdcc8547cd2fc5fa933bc53b5fb96ca905f8cd`, computed raw SHA256 `aa56e5fde5de639df1fa21d3f2d68d6e447f0a33b674a3c4cd969b56dd002d45`.

Source bytes were reconstructed from connected GitHub fetches and verified with `git hash-object` and independent Node `sha1('blob '+bytes+'\\0'+bytes)` before running. There is no claim that every other file was downloaded or hashed.

## Actual execution
- Host: local isolated container; Node `v22.16.0`, globally available TypeScript `transpileModule`; no installed original pnpm workspace, Firebase emulators, GitHub DNS clone or private credentials.
- Executed custom supplemental Node `node --test` against **actual transpiled exported functions** from the two verified original TS blobs.
- **10/10 PASS, zero skipped/fail/cancelled**. Original function behavior was observed, not reimplemented as fake business logic.
- Local harness SHA256: `949ee2808a15d762a3304ba873d5ad32f1b0c3c5cb2059207233d4ac3adb2691`.
- Original local TAP log SHA256: `07b1974300273be821fd4e3c1ea626eb833f5c636470592e7c29fe9f44550c70`.

### Acceptance matrix (observed behaviors)
| Case | #179 candidate | #175 donor |
| --- | --- | --- |
| Same runner/attempt, active unexpired lease | true | true |
| At lease expiration deadline | **true** | **false** |
| Lease expired one millisecond ago | **true** | **false** |
| Missing `leaseExpiresAt` | **true** | **false** |
| Malformed `leaseExpiresAt` | **true** | **false** |
| Wrong runner | false | false |
| Wrong attempt | false | false |
| Invalid observation time | **true** (ignored 4th argument) | **false** |
| Queued/exhausted selection | Retains expected semantics | Retains expected semantics |
| Raw Git identity/byte lengths | Matched | Matched |

This deliberately demonstrates **source divergence**, not a newly discovered failure of the #175 donor. On current #179 `ownsFallbackJobLease(value,runnerId,attempt)` has no expiration input. #175 adds `nowMillis`, explicit unexpired check and associated `job-runner.ts` call-site changes, output isolation and indexes. Copying only the helper would break semantic parity with its caller. Review all five donor paths together under an independent engineering PR.

**Non-transfer:** Not original checked-in `apps/studio/tests/all.test.mjs`, not full Node20/pnpm9.7.0, no current GitHub CI, Firestore schedule/emulator, GCS privileged future-write denial, actual private Life Movie, or production. The separate Jobs P0 #252 write-fence remains open.
