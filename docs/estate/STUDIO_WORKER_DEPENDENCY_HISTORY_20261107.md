# Studio workers, donors and cross-system dependencies — 2026-11-07

## Exact lineage and conflict
- [Studio #159](https://github.com/LifeLoggerAI/urai-studio/pull/159): draft controller `63396c151322278ed631fb252145dd728433e918` (private ownership/export and delivery guards, never main-deployed).
- [Studio #177](https://github.com/LifeLoggerAI/urai-studio/pull/177): ancestor `50c0354521cb63aa197327865ea2231d2ddbee18`, source Storage generation, render plan digest, source selection, Jobs 1.1.0 receipt shape.
- [Studio #178](https://github.com/LifeLoggerAI/urai-studio/pull/178): ancestor `e0e3c9f6de652243f6dd0d34ce5e66c22d5ae1f7`, 45-minute audio seek cap and consent boundary.
- [Studio #179](https://github.com/LifeLoggerAI/urai-studio/pull/179): candidate `153d6c35557c66a8b9f8629778ca796b83730464`, additional TCP transport test and current separate engineering review.
- [Studio #175](https://github.com/LifeLoggerAI/urai-studio/pull/175): **separate divergence** `aeac000487bb79d3f2e7ea1af406fb96c1a2a1ba`, two donor commits, five changed paths, attempt-scoped fallback artifacts, lease expiration checks, scheduler indexes; NOT in #179 and not an atomic Storage-level private writer fence. See [existing granular diff](10_FALLBACK_LEASE_DONOR_RECONCILIATION.md).
- [Studio #180](https://github.com/LifeLoggerAI/urai-studio/pull/180): this **documentation-only** Genesis knowledge branch, separate from all source branches, no merge/deploy/release authority.
- Earlier native and Video Factory worker outputs are historical refs, not permission to conflate original provenance with present source.

## Dependency matrix
| Peer owner | Current observed review candidate | Studio dependency and missing acceptance |
| --- | --- | --- |
| [Jobs #320](https://github.com/LifeLoggerAI/urai-jobs/pull/320) | `ea8f0165ac74511a4e4196919ddd3109d0c1ff2e` | Studio bridge must bind owner/consent/SceneTruth and send to real Jobs/worker. Positive C6 still OFF. [Jobs #252](https://github.com/LifeLoggerAI/urai-jobs/issues/252) privileged Storage writer P0. Separate [Jobs #322](https://github.com/LifeLoggerAI/urai-jobs/pull/322) donor history was reconciled in #320 but not production-admitted. |
| [Privacy #236](https://github.com/LifeLoggerAI/urai-privacy/pull/236) | `5daa194148c1f0b157062ca09b8f1b6e629d6d29` | Require trusted current owner, membership, source rights, purpose `life-movie.render`, exact policy 1.1.0, project+renderPlanDigest+sourceSetDigest, signed current receipt, revocation and deletion. Review-only issuers not authority. |
| [Spatial #2069](https://github.com/LifeLoggerAI/urai-spatial/pull/2069) | `ad0dcf7412e6c6f84724b030660275f29ef4dfee` | Source/truth-bound Life Map→Focus→private Replay, owner-only streamed media, real supported devices, denied after withdrawal. Historic demo route screenshots not this gate. |
| [Asset Factory #494](https://github.com/LifeLoggerAI/asset-factory/pull/494) | `09fb062643cbad7cd0576fb85bb05d2db97d7d49` | Original asset manifest/object rights, provider approval, permitted models, licensing, visual consistency, spend gate. |
| [Content #112](https://github.com/LifeLoggerAI/urai-content/pull/112) | `295e4ab4d1b2c886a2c0801306d071e280288891` | Narrative and caption provenance, rights/publishing, no private raw media accessible to public web or content pipeline. |
| Storytime, Admin, Analytics, Communications and RuAi | Cross-system release owner review lanes | Narrow role/metadata handoff; no raw private consumer media by association or brand identity. |
| Firebase/GCS service identities and providers | External to GitHub tree | Actual installed cloud IAM/Storage rules, bucket aliases, Functions region, credential rotation, accurate cost, signed workload identity, and abort/drain after revocation remain unverified. |

## Historical/asset considerations
- The existing R854 registry covers **160 branch names, 152 unique heads and 160 compare results**; 95 diverged/64 ancestral/1 identical relative to #179. This is ancestry metadata, not every older source or active feature admitted.
- Current #179 tree: 908 blob paths, 6,068,047 Git-reported bytes; four small `.tgz` archives. Historic static tag: 160,017,868 Git-reported bytes with >150MB archives; no archive contents, LFS objects or provider assets independently inspected here.
- Public Studio docs cannot reproduce private master registry content from Labs #262.
