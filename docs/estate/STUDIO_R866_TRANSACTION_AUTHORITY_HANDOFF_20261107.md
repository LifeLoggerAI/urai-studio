# One UrAi Genesis — Studio R866 commit-bound member and deletion authority handoff

**2026-11-07 UTC · review-only · production HOLD.** Engineering [Studio draft PR #190](https://github.com/LifeLoggerAI/urai-studio/pull/190) head `4ded87bb37916924018afc086f49ea59b35c14fa`, stacked on unmerged R865 [#189](https://github.com/LifeLoggerAI/urai-studio/pull/189) `60d908e6d024da201a31a19703c75880b0a7478d`. Other worker branches, default branch and production unchanged.

## Scoped engineering review
- Prior R865 verified active role/membership/deletion state at route preflight, but a future Admin transaction could still commit after an intervening revocation. R866 refactors the canonical R865 check so both preflight and transactional check use a shared member/global-role/fence/tombstone policy.
- New `assertStudioDraftAuthorityInTransaction(transaction, uid, tenant)` reads `studioUsers/{uid}`, `memberships/{uid}_{tenant}`, hashed `studioDataRightsOwnerFences/{sha256('urai-studio-data-rights:'+uid)}`, and `privacyDeletionTombstones/{uid}` through four `transaction.get` reads. All three `createStudioBrief`, `createStudioJob`, `createStudioExport` transactions perform this check before reading project/source refs or writing drafts.
- The job/export/brief records remain `draft`, `feature-gated`, `contract-only` and do NOT authorize private media. Earlier scoped R862/R863 synthetic tests retain an explicit isolated auth stub; a new committed R866 nine-case test targets the real helper.
- Exact source blobs: `studio-member-auth.ts` `3facfc23c3b626bae479ea3d7ba40fa1217d1d63`; `studio-runtime-store.ts` `078b1b0b3d04bf55a741bfb6c4dba6579da68b28`; checked-in new `studio-transaction-bound-authority-r866.test.mjs` `d4ca6f38f8a85e588fd6a75e3daa0201315ffd19`. Legacy mock test blobs: R861 `8c19e5bd53bdcb26263dbc0f00d5ae6fc89e6550`; R863 `6c1546a0cef2310104c4ddd96cae87575191713a`.

## Actually executed and not executed
- Executed Node22+TypeScript5.8.3 helper code against synthetic transaction: **15/15 PASS**, log SHA256 `b7ba6d10e506260acb4fa0cbdee86904293d7e06b59b6769b8538f86dd8c8e0d`; local helper SHA256 `ad3a78687592e69e89c511f39892356cf399a03ba9e139a294f90e75b1aa9745`, matching Git blob.
- Isolated strict TS compilation with Firebase interface stubs PASS. **19/19 connected GitHub source assertions PASS** (three authorization call sites and preserved scope).
- New checked-in nine-case suite **not run** in full repo; original frozen Node20/pnpm9.7.0 Suite/Functions build, Firebase emulators and actual permission-revoke/transaction-conflict behavior **not certified**. Synthetic mock read dependencies cannot prove a transaction retries on concurrent write.

## Remaining security gates
- Real disposable Firebase four-service Auth/Firestore/Storage/Functions test must race membership revoke, role downgrade, missing-to-active deletion fence and privacy tombstone creation between transaction read and commit, then prove transaction abort/retry and no persisted draft bytes. Preserve exact heads, logs and hash.
- Standalone modern `createStudioProject` is still create-only without an in-transaction member gate, and owner GET reads remain preflight-scoped. Lost successful HTTP ACK still duplicates drafts; idempotency pending.
- Separate R858/R859 Rules and three historical job models/rights deletion remain unmerged; Jobs #252 privileged Storage future-write fence, signed positive Privacy C6 and actual authorized private Life Movie→owner-only Replay→deletion remain **HARD HOLD**.

Detailed R866 source and execution ledger is at `docs/estate/STUDIO_R866_TRANSACTION_BOUND_AUTHORITY_REVIEW_20261107.md` in draft PR #190. **No live private media, deployment, provider spend or production permission changes.**
