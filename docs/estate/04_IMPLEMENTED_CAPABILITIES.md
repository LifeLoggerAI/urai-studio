# R854 — what Studio already implements

| Capability | Exact evidence | Proof classification |
| --- | --- | --- |
| Public site and creative Studio workspaces | `apps/studio` and [Done-Done boundaries](https://github.com/LifeLoggerAI/urai-studio/blob/153d6c35557c66a8b9f8629778ca796b83730464/docs/URAI_STUDIO_DONE_DONE_LOCK.md) | Built source; full exact #179 build PASS in external worker R843 report |
| Firebase backend and project/scene/asset/job/export interfaces | `functions/src`, Firebase rules/indexes | Source implemented, isolated native and synthetic tests; protected cloud deployment not established |
| Short and long-form Life Movie validation | [longform contract](https://github.com/LifeLoggerAI/urai-studio/blob/153d6c35557c66a8b9f8629778ca796b83730464/docs/STUDIO_LIFE_MOVIE_LONGFORM_BRIDGE.md), #177/#178 | Implemented validators/requests; not provider-generated life film |
| Immutable generation-bound render plan digest | `apps/studio/lib/studio-life-movie-jobs-bridge.ts` and [#177](https://github.com/LifeLoggerAI/urai-studio/pull/177) | Source verified and historical tests, cross-provider authorization pending |
| Jobs transport fail-closed | `apps/studio/lib/studio-life-movie-jobs-client.ts`, [#179](https://github.com/LifeLoggerAI/urai-studio/pull/179) | Earlier focused 6/6 HTTP double; real cross-service rejection receipts from Runpod; no positive consent |
| Private media and export byte guards | [delivery contract](https://github.com/LifeLoggerAI/urai-studio/blob/153d6c35557c66a8b9f8629778ca796b83730464/docs/STUDIO_AUTHENTICATED_PRIVATE_DELIVERY.md), [private-media](https://github.com/LifeLoggerAI/urai-studio/blob/153d6c35557c66a8b9f8629778ca796b83730464/docs/STUDIO_PRIVATE_MEDIA_DELIVERY.md) | Built source and tests; live browser/physical-device acceptance unproven |
| Source-bounded Video Factory diagnostics | historic Video Factory native GitHub artifact | Prior worker actually recovered 32-file artifact with MP4/WebM/screenshots; those were **diagnostic** captures; not re-downloaded in this pass |
| Generic World Library and V1–V5 world/media production | `productions/`, historical branch and earlier audit | Created source/assets and historical records; item-by-item provider/license/quality audit pending |
| Fallback job runner | `functions/src/job-runner.ts` on #179 | Implements fallback-only output; independent lease safety enhancements #175 NOT inherited |
| Independent lease fencing | [#175](https://github.com/LifeLoggerAI/urai-studio/pull/175), exact candidate branch `aeac000487bb79d3f2e7ea1af406fb96c1a2a1ba` | Implemented attempt-specific paths, expiry checks, cleanup; original PR reports local 5/5 & 6/6, **not** full CI/real emulator |

Never equate “built”, “locally tested”, “native four-emulator denied”, “actual output diagnostics”, “private production playback”, and “independently approved finished movie”.
