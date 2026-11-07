# R854 — independent Studio fallback lease safety donor (#175) vs movie candidate (#179)

**Observed 2026-11-07 UTC.** [Donor PR #175](https://github.com/LifeLoggerAI/urai-studio/pull/175) `aeac000487bb79d3f2e7ea1af406fb96c1a2a1ba`, tree `c7356883072081907dba401ea1dd3b237039d849`, and [#179](https://github.com/LifeLoggerAI/urai-studio/pull/179) `153d6c35557c66a8b9f8629778ca796b83730464`, tree `b7b7531be119023505a85e07e2fa4a19f9ebefbe`, share merge-base `70abb2481e133af7e595385c4fe2d59b1de2cf9c`. Exact compare #179→#175 reports **2 unique donor commits / 55 behind and five changed paths**; compare reverse reports 55 / 2.

| File | Donor #175 Git blob SHA | Current #179 Git blob SHA | Specific independent behavior |
| --- | --- | --- | --- |
| `functions/src/job-runner.ts` | `3ddbceb913d36132af741c7a3d531c08fa178b11` | `78e3a54212eb30eb1cc9752a84a5daa91232da13` | New per-attempt Storage artifact path, beforeWrite current lease check, cleanup of invalidated attempts, indexed expired scheduler order |
| `functions/src/fallback-job-lease.ts` | `ddcdcc8547cd2fc5fa933bc53b5fb96ca905f8cd` | `6b6ec72a101e102fce559489c893999b59d9b2c7` | `ownsFallbackJobLease(..., nowMillis)` checks lease expiry and state/owner/attempt; #179 lacks expiry argument |
| `apps/studio/tests/fallback-job-lease-authority.test.mjs` | `5b214d5975ccf6dc39faca5538154934fe319d08` | `b16abc12056d983713a9ecc2d2b166ebb9825107` | Adds expiry denial, cleanup source checks |
| `apps/studio/tests/fallback-job-query-contract.test.mjs` | Exists (31 lines; exact Git SHA to be recorded by next reader) | **Absent (GitHub 404)** | Requires queued/expired Firestore composite indexes and correct inequality first-order |
| `firestore.indexes.json` | `da32d2596c0bd7394ff067c6ea6f66f3ac6765f7` | `f1163fcce66f9241d14f40ec1253cd49e83785b5` | Donor 19 indexes vs current #179 17; donor adds queued and expired scheduler composites |

**Direct source examples (read both files):** #179 expired query filters `leaseExpiresAt < now` but orders first by priority then createdAt; #175 orders by leaseExpiresAt before priority/createdAt and declares matching composite index. #179 writes fixed `projects/<project>/renders/<job>/fallback-clip.txt`; #175 writes attempt-scoped paths. #179 confirms only runner/attempt, not current expiry, at completion. Donor #175 prevents stale attempt from finalizing after deadline and attempts best-effort cleanup.

**CRITICAL NON-EQUIVALENCE:** Donor performs an ordinary Firestore `get()` immediately before GCS `save()`; that check and the later Storage write are not atomic. It reduces obvious stale-worker races but **does not prove a privileged writer is physically fenced at Storage level** against revocation, a canceled upload already in flight or a late noncooperating producer. The separate Jobs P0 issue #252 and R843 `privilegedBypassObserved=true` remain OPEN.

**Original donor claimed tests (NOT rerun in R854):** #175 reports five functional lease regressions PASS and six modeled runner checks PASS; source transpile test. GitHub hosted failures contained zero executed steps. Do not treat tests as actual production-equivalent emulator/Storage acceptance.

**Next implementation action (not performed):** on an explicitly authorized engineering review branch based at current #179, carefully port the five source/test/index differences, reconcile contemporaneous code without copy-over, execute original Node20/pnpm9.7 frozen build and actual Auth/Firestore/Storage emulator schedule/lease test. Add concurrent stale claimant, expired lease, output generation collision, cancellation/deletion and active-upload-race acceptance. Preserve fallback flags `fallbackOnly=true`, `readyForExternalUse=false`. Leave private Life Movie Jobs/Privacy consent and production HOLD untouched.
