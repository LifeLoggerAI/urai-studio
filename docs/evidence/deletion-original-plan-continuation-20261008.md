# Studio original-plan deletion continuation source preparation

Parent working owner: `765723fd24828a66599a7fb8aed79cb7ce841630`, tree `8ee8204b4b706a70f9cade86d4cdeb412954e7fa`, owner PR #159. This donor targets that owner branch. It does not merge main, deploy, freeze source, spend, approve private processing, or assert complete acceptance.

## Problem and resulting behavior

The admitted predecessor protects each deletion batch atomically, but its backup lacks original Firestore version identities and durable deletion progress. It collects targets at execution, cannot resume an interrupted admitted attempt, and can acknowledge completion before detecting restored or new owned rows.

New deletion backups carry a sorted original target plan inside the checksum- and Storage-generation-bound private JSON. Each target binds its registered collection, path, deletion policy, and Firestore updateTime. The private receipt pins the plan hash and target count. Legacy backups without that original plan fail closed; they require a separately governed fresh backup/request decision. No retry silently collects a replacement plan or adopts corrected/new records.

Execution pins current provider admin claims, revoked-token validity, subject, restore window, legal hold, original backup/plan, permanent owner fence, unique attempt, and lease. Bounded target transactions delete only the original exact versions and commit cursor/counts in the same transaction. Missing originals count as observed absent, not fabricated physical deletes. Each delivery handles at most 8,000 targets, then returns a durable continuation status. Expired attempts consume a genuine failure; three failures or 64 continuation deliveries require reconciliation. These are bounded source controls, not independent policy approval.

Only the current attempt can record its outcome. An ambiguous committed batch keeps its committed progress; a predecessor's late outcome cannot overwrite a successor. Final transaction reads original targets and registered-owner emptiness before producing a bound receipt. Every normal late writer must continue honoring the existing permanent owner fence. Owner preparation/cancellation and admin hold changes now revalidate current credentials after awaited reads; preparation cannot clear a hold introduced while the backup is written.

Private export cleanup and retained backup maintenance remain generation-bound. Central Auth deletion remains the canonical Privacy controller's responsibility. `globalErasureVerified` remains false. Previously delivered or copied bytes are not recalled.

## Meaningful source verification

On verified Node 22.23.3, the actual Studio module with explicit Firebase adapters passes 87 cases. The unchanged parent module fails all 25 new cases and passes the 62 retained cases. The negative cases cover corrected/foreign original versions, ambiguous committed cursor recovery, partial interruption, active/expired leases, predecessor late success/failure, current role/hold/subject/restore/backup binding, malformed progress, residual/new rows, transactional query conflicts, legacy backups, 8,102-target continuation, genuine failure budgets, missing targets, and authority withdrawn during preparation.

The changed module strictly compiles against actual cached Firebase Admin 13.10.0, Functions 6.6.0, Firestore 7.11.6, Storage 7.21.0, TypeScript 5.9.3 and Node types 22.19.17. All five unchanged source-contract tests pass. These bounded supplemental checks are not a complete frozen dependency build or Studio's declared Node 20 native checks.

## Prepared native checks and remaining acceptance

The existing mandatory loaded data-rights emulator script retains authenticated creator/descriptor/HTTP checksum/CORS/Storage denial/withdrawal checks. It adds real loaded Auth, Firestore, Storage and callable checks using only isolated demo fixtures: original-version denial, a versioned original backup, 8,102 owned source rows across two bounded executions, persisted cursor/counts, actual Firestore absence, foreign-subject preservation, and exact receipt replay. Syntax has been checked; those loaded emulator scenarios have not been executed here.

The existing workflow preserves its frozen install, native Node 20, compiled handlers, source cleanliness, emulator confinement and release controls, and adds the actual-module authority test. Current exact-head native CI, loaded emulator receipt, independent review, protected approved runtime execution, authentic permitted-source cross-system export/revocation/deletion, backup retention/purge, privileged late-writer/Auth fence checks, provider erasure and whole product acceptance remain open. No synthetic check grants those gates.

