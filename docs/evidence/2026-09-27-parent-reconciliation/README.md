# Parent branch reconciliation receipt

Live parent: 586815ebe7f67fc41a44e41030e75d7ea0a516b7

Parent added overlapping fixes and three contract guards. Preserve stricter enum/evidence validation, incorporate authority trimming, retain parent assertions adapted to the shared helper and inline parser. Behavior tests cover rejection and authority normalization. All 75 regression files and 27 node test cases pass; typecheck passes.

The PR summary exposed an older base SHA; direct branch-ref read identified the updated parent. Reconciliation preserves both histories through a two-parent commit on the repair branch. No production branch merge or deployment. Fresh exact-head CI and independent review remain pending. Local Node 24.19.0; CI target Node 22.

```json
{
  "apps/studio/lib/studio/life-movies.ts": "91d2cfbcc343eb0452633b5f25f6db16e4106868ee18cfeae73a7c9d5c782bd8",
  "apps/studio/tests/captured-reality-contract.test.mjs": "78a0fdbf3456e5edb094f3d09798f376e9081db8ae30a430b301e201014bcb0e",
  "apps/studio/tests/creative-direction-music-contract.test.mjs": "0bdc12264bb0a1eb794e4d246f5273b694f365eb80f4bba57b85159ad2655367",
  "apps/studio/tests/life-movies-contract.test.mjs": "62d74f6cf4a30b2cc86f0ab8895dab39e23d8bdf691c52bec65bf8819d80d272",
  "apps/studio/tests/review-validation-behavior.test.mjs": "8f797ac4ff019df53fcb962bc153f4832c7370908471fb4b632cdb75b305b157",
  "docs/evidence/2026-09-27-parent-reconciliation/studio-reconcile-tests.log": "89bf62eb229880f224068cb1b436e50dc386626e0440946a80d91f0156a45006",
  "docs/evidence/2026-09-27-parent-reconciliation/studio-reconcile-types.log": "0160f5655f105871086849581bc37a3f30205c3b03d83206785ed512ddd6b716"
}
```
