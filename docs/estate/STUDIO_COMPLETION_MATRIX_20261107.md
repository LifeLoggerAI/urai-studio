# Studio forensic completion matrix — 2026-11-07 (review only)

**Source pin**: Studio candidate [PR #179](https://github.com/LifeLoggerAI/urai-studio/pull/179) `153d6c35557c66a8b9f8629778ca796b83730464`; main `854477d80b1a7aa718edb60d1ed4c1cf22dbed9d`. **Production HOLD.** The design and functions are real; production authorization and a private movie are not established.

| Area | Status | Source/proof | Missing proof |
| --- | --- | --- | --- |
| Next Studio application, Firebase Functions, UI | BUILT; current independent full build not run in this review | `apps/studio/`, `functions/src/`; #179 R843 reports frozen test/typecheck/app+Functions builds PASS elsewhere | Reproduce exact source and preserve raw build logs, deployed parity |
| Memory selection, provenance, SceneTruth, fidelity | IMPLEMENTED SOURCE/TESTS | `apps/studio/lib/memory-to-media-canon.ts` blob `e46bc1e4f363a7a3f7525aedae79aff698707228`; private source preflight | Real owner rights and original bytes, scene truth issuer, generated-shot-to-source reconciliation |
| Video Factory sample route capture and asset plans | BUILT HISTORIC DIAGNOSTIC | `studio-video-factory.ts`, `studio-video-renderer.ts`, scripts and prior MP4 evidence | Current exact-head output bytes/codec QA and non-demo owner-approved movie |
| /video-factory/render JSON package | CONTRACT-ONLY | `apps/studio/app/api/studio/video-factory/render/route.ts` blob `2b75fdbc9507b6784497683e21c62ce8bd9cfa4e` calls builder; `status:'planned'` | Actual compose/encode execution separate from endpoint |
| Short-form Life Movie envelope | BUILT/REVIEWED | `studio-life-movie-jobs-bridge.ts` blob `afca955d63a6ce928d2a6b6aa456b508a6134893` | Trusted grant and authorized worker |
| Long-form plan and timeline | BUILT/REVIEWED | `studio-life-movie-longform-contract.ts`, /longform route | Full real assembled movie, verified selected media source intervals |
| Immutable generation, SHA-256 renderPlanDigest and sourceSetDigest | SOURCE VERIFIED | `studio-life-movie-jobs-bridge.ts` | Actual generation exists, current rights verified, input-to-output provenance/quality attestation |
| Studio→Jobs HTTP fail-closed transport | BUILT; negative native previously reported | `studio-life-movie-jobs-client.ts` blob `0ca262e114b0439426d75cf7ac510e289ba315eb`; #179 6/6 local TCP double, R823/R843 negative real bridge reports | Real positive signed-workload, consent-approved create/worker/replay |
| Authenticated private delivery and owner checks | SOURCE BUILT | `studio-private-media-delivery.ts`, `studio-spatial-private-playback.ts` | Real output and physical-device replay; revoked owner denial on each chunk |
| Trusted Privacy C6 positive grant issuance | BLOCKED / HARD-OFF | Jobs #320 `functions/src/privacy/lifeMovieConsentGate.ts`: returns false | Verified independent Privacy issuer, actor/service identity, exact project+source set scope |
| Storage-level post-revocation future-write fence | P0 BLOCKED | Jobs [issue #252](https://github.com/LifeLoggerAI/urai-jobs/issues/252); R843 observed privilegedBypass | Restrict IAM/direct workers, durable reservations, drain uploads and deny post-ACK writes |
| Real private Life Movie output | NOT CERTIFIED | No verified current positive C6/Storage writer | Protected rendered MP4/SRT generation IDs, checksums, frame/audio/rights parity |
| Deleted/revoked derivatives and no future reappearance | NOT CERTIFIED | Studio/Jobs source checks and standalone emulators | Concurrent upload/revoke/erase with final generation absence and future-write denial |
| Asset Factory/Content rights and providers | PARTIAL | Source/manifests and other repos' draft PRs | Original asset and license/admission, generation spend approval, source fidelity |
| Current CI | NOT PASS | GitHub #179 hosted runs failed with zero executed job steps | Actual passing protected runs and independent reviewer |
| Device, accessibility and launch | OPEN | Historic diagnostics | Physical owner-only test, reduced-motion/captions, deployment and explicit GO |

**Do not aggregate parent, local, synthetic and native receipts into a single certification score.** The #175 fallback lease donor remains divergent and unmerged to the #179 movie candidate. This matrix records externally reported R843 receipts separately from tests actually run in this audit.
