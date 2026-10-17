# Life Movie producer bytes at Jobs admission

Existing controller lineage: Studio #159 `9900c14ed73f0b606dca4abeac5871d46147c07e`, donor #170 `e8352d28548e13755a4c9e978147358f72649d68`, child #171/base of this repair `bcfad531fafc05d12c1e3e7a0a1c38caf4e14502`, tree `aeaf42077bc3f406431b1ef1a6afa8a3604cc591`. No AGENTS.md is present. The adopted architecture retains Studio as the bounded render-plan producer and Jobs as execution authority.

The actual Jobs schema trims source-reference strings and object paths before persisting its worker input. Studio previously hashed untrimmed references and retained the caller's mutable reference array. An accepted padded reference or later caller mutation could therefore leave the emitted/admitted plan inconsistent with its render digest and retry key. Normalize the accepted path/references before hashing, copy the array and validate source scalar types, bounded bucket, exact MIME/provenance/audio-role enums and unknown source fields against existing Jobs admission. Keep source intervals, SceneTruth receipt/digest and false dispatch/provider/public-release authority.

All eleven new producer cases execute the actual TypeScript function with explicit synthetic inputs. The predecessor passes two and fails nine; the repair passes all eleven. An additional temporary read-only integration harness executes the actual Studio producer and actual Jobs Zod schema, without modifying Jobs or its dependency graph. Consumer authority at observation: Jobs owner #170 `150347557567fff70743c06af25bf1f79ba47d7e`; consumer `functions/src/jobs/studioLifeMovieContract.ts` Git blob `948e814ee8b5399bc2e84f8653db8f6f70ad78f6`, also byte-identical in the later checked donor. The predecessor passes two of ten integration cases; the repair passes all ten. Accepted padded/unpadded plans now remain byte-equal through actual schema parsing and independently recomputed canonical digest. This is real contract source with synthetic inputs, not authenticated dispatch or verification of a signed SceneTruth receipt.

Declared Node20.20.2/pnpm9.7.0 and the frozen dependency graph pass the full `pnpm release:check`: all guards, lint (one inherited warning), typecheck,63 test files/96 Node cases without failures/skips, static smoke, Next production build and Functions TypeScript build. Raw local logs remain temporary evidence. Exact successor hosted checks and source cleanliness must be verified after publication; predecessor checks or approval do not transfer.

The three current Spatial comparison references now bind open canonical owner #1636 `87aace28b25aa89f5c54c54e30ef78a413df64de`, tree `5df36ade28618c6c668f9269fc83fdab60db6c53`, freshly confirmed by raw PR and branch-ref reads. All22 existing source/owner guard cases pass. The before/after owner guards, clean frozen graphs and deployed route fingerprints remain required. Spatial successor checks are distinct from predecessor checks. Existing Studio #171 video run37995982818/artifact11646379875 binds Spatial `3b6b5f4d53fb57c03c4cbe74276d35fe713f9230` and cannot accept this successor. Its30-second/900-frame motion MP4 fully decodes but has no audio; its Replay shows an explicit demo fixture. The retained ZIP SHA256 is `8a009ed2dff9cfe00a8267105f5212d0732e7b52a5783938d68beb80f9e07b03`.

| Source or local proof log | SHA256 |
| --- | --- |
| `apps/studio/lib/studio-life-movie-jobs-bridge.ts` | `8ba59b50ad3a43fe87a0ef3936e428a78407a3190f2461f2f619d0fb9d3166a2` |
| `apps/studio/tests/life-movie-normalized-source.test.mjs` | `60ac342135edf58daf6086f5d068771669182c9810072c4eb631794580feac39` |
| `studio-normalization-predecessor.log` | `b72e89a164387f339810642e67d576e4f118d68a9a37face3e0f84fd15d19da6` |
| `studio-normalization-repaired.log` | `6d3758782f80e8065b700920bbf1df7830eed38633af21d095af11aca967106e` |
| `studio-normalization-release-check.log` | `523abde3e41c57f9be284ed300413a094b31d86e3d9bf78fc664b17e5c3a9b4a` |
| `studio-jobs-integration-predecessor.log` | `bbcbe3b85372292ede60b704dce83befc71484b4077b5e5b78d209c12cc9350b` |
| `studio-jobs-integration-repaired.log` | `200e13fa0d3d2c29c21e16bd5cefbee4033204d48f4d8da6907ca4eef71fa07e` |

No authentic private source/consent, narrated voice/listening, protected provider operation/cost approval, artistic family-film acceptance, device acceptance, deployed-source parity or independent exact-head release approval is claimed. Existing controller #159 remains draft/unfrozen; final approval, main, deployment and production gates remain intact. No private media is published and no paid provider is invoked.
