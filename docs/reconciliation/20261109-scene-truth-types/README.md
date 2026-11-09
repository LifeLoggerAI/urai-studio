# Scene-truth string boundary reconciliation — 2026-11-09

Production HOLD. Review-only child of Studio #201 at `a6187abfd12ffc8f534ddf66246da91ed032e1dc`.

## Defect and smallest repair

The Studio producer called RegExp.test directly on sceneTruthReceiptRef and sceneTruthDigest. A JSON array containing one valid string passed through implicit string coercion, remained an array in the emitted payload and was rejected by the actual Jobs strict Zod schema. Local objects with custom toString could also be invoked. Both fields now require primitive strings before regex evaluation. Valid envelopes remain byte-identical; no grant, dispatch or write authority changes.

Consumer inspected and executed: Jobs #391 `9f5759f072370fbd42a82560ff6c5d4f37169c6b`, `functions/src/jobs/studioLifeMovieContract.ts`, blob `5f944e906de7243d7415ac479cf92356b09c84c9`.
Original producer blob `701be51e861e0a5ff47d88ceaba1e3812433d659`; repaired blob `9427263442d93c916516a76ae7b953585792be1a`.

## Executed evidence

Local Node v24.22.1, TypeScript 5.9.3, Zod 3.25.76; temporary verification dependencies installed outside the repository. This is not a frozen full-workspace install and Node 24 is outside the root's declared >=20 <21 engine. Supported-runtime/full-build acceptance remains open.

- `node --test --test-reporter=tap apps/studio/tests/life-movie-scene-truth-types.test.mjs`: original source 1 pass / 4 failures; repaired source 5/5 PASS.
- `node --test --test-reporter=tap apps/studio/tests/life-movie*.test.mjs`: 11 TAP tests PASS (six existing file-level scripts plus five new cases; do not sum internal assertions as independent suites).
- From `apps/studio`, `node tests/all.test.mjs`: all 57 discovered regression files complete; Node runner reports 39/39 tests, exit 0.
- Actual producer-consumer harness: original JSON arrays rejected by real Jobs Zod; repaired producer denies both; valid payload identical, Jobs parse and render-plan digest PASS. 3/3 contract cases; synthetic data only.
- `tsc --noEmit --strict --target es2022 --module commonjs --types node --typeRoots <verification>/node_modules/@types apps/studio/lib/studio-life-movie-jobs-bridge.ts`: PASS (isolated module, not whole application typecheck).
- `git diff --check`: PASS.

The all-test runner automatically discovers the new `.test.mjs` file. Raw before/after, focused, contract and full regression output is retained beside this file. NODE_PATH pointed at the temporary verification/node_modules directory for tests. Initial all-test attempts failed because the sparse checkout omitted Functions, productions and contracts; another invocation used the wrong working directory. After hydrating those original paths and using the package working directory, the complete regression command passed. No product code was altered to work around those setup failures.

## Reproduction and limits

With the repository's normal dependencies installed, run the new five-case test on parent #201 to reproduce four failures, then run on this child to get five passes. Run `pnpm --filter studio test` for package regression. Review independently and run supported-runtime frozen install/build/typecheck before merge. The actual Jobs schema is an unmerged candidate; Jobs main compatibility is separate. Positive consent, authenticated service identity, storage-enforced future-write denial, physical deletion acknowledgement, Replay and release certification remain unproven here.
