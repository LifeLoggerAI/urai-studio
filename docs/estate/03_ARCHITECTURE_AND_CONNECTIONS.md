# R854 Studio architecture and One UrAi system connections

**Current implemented source:** `153d6c35557c66a8b9f8629778ca796b83730464` — `apps/studio` Next.js, `functions` Firebase Functions, `packages` shared contracts, image/audio/video preparation and project/scene/asset/export APIs, structured and protected Life Movie routes. The [historical Done-Done contract](https://github.com/LifeLoggerAI/urai-studio/blob/153d6c35557c66a8b9f8629778ca796b83730464/docs/URAI_STUDIO_DONE_DONE_LOCK.md) defines app roots and forbids promoting backup/prototype trees as current. The [historical LOCK](https://github.com/LifeLoggerAI/urai-studio/blob/153d6c35557c66a8b9f8629778ca796b83730464/LOCK.md) expressly disclaims current release authority.

## Source to protected movie graph
1. **Permitted sources and history:** owner/tenant Firebase identity and Studio-owned project, immutable Storage source object generation, source rights and provenance.
2. **Studio plan:** short and long-form plans, bounded audio offsets, source selection, exact `life-movie.render` policy 1.1.0 descriptor, render-plan hash and idempotency. A properly shaped descriptor is not proof of an actual trusted signed consent issuer.
3. **Studio→Jobs:** `apps/studio/lib/studio-life-movie-jobs-client.ts` sends bounded server-side HTTP; [#179](https://github.com/LifeLoggerAI/urai-studio/pull/179) transport tests 6/6 in earlier local results. Actual Jobs Functions HTTP negative-path execution is recorded in linked native-worker PR discussion, not proven positive movie creation.
4. **Jobs private work:** a trusted current source-rights and owner authorization, signed service issuer, Privacy C6 consent, revocation-fenced protected Storage write, and output generation must all be checked by the current Jobs authority. Jobs #320 `ea8f0165ac74511a4e4196919ddd3109d0c1ff2e` remains review-only, consent authority deliberately false; never bypass.
5. **Delivery and Replay:** [private delivery contract](https://github.com/LifeLoggerAI/urai-studio/blob/153d6c35557c66a8b9f8629778ca796b83730464/docs/STUDIO_AUTHENTICATED_PRIVATE_DELIVERY.md) bounds byte chunks to 64 KiB, no bearer URL, token/current role checks, cancellation/revocation and Jobs independent validation; still needs owner-only replay across Spatial and actual devices.
6. **Revocation and erasure:** Studio local plus central deletion fences/immutable object generation are meaningful implementation; **privileged Storage writers are a separate risk**. Jobs R843 emulator specifically documented privileged writer bypass after revocation. Do not infer finished global erasure.

## Other system owners
| Source/domain | Intended Studio interface | Current evidence status |
| --- | --- | --- |
| Privacy | Purpose-specific trusted C6 grant, deletion/revocation issuer | Source contracts, local/emulator denials; real positive trusted owner authorization NOT accepted |
| Jobs | Protected actor+service identity, render plan, source-rights, Storage object and private output | Real native four-emulator/HTTP negative acceptance reported; real positive rendering hard-off |
| Spatial/Replay | SceneTruth, source-bound route capture, private playback | Historic 6-route diagnostic capture and source contracts; live private device playback unverified |
| Asset Factory | Asset manifests and rights/licenses for world library/media | Code/contracts/historical source; independent provider rights/artistic acceptance needed |
| Content/Storytime | Governed narrative/captions and source publication | Separate purpose/rights and release claims required |
| RuAi B2B | Purpose/tenant isolated professional access | Brand relationship does NOT grant access to private consumer memories |
| Admin/Analytics/Communications | Narrow operational metadata, responsible consent/telemetry/public delivery | Do not leak raw private media/consent across support surfaces |

**Separate fallback warning:** `functions/src/job-runner.ts` currently uses generic fallback outputs and must **not** be confused with the protected Jobs Life Movie renderer. Its #175 branch fixes are distinct, not proof of production private media.
