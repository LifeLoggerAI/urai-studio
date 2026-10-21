# Studio deletion completion correction from the original-plan owner

Working component parent: `780ddaec7a5d65f4f64390461a7c74fa49673f19`, tree `fe79525964535231166e6d8f1ba7750e74b39f93`, Studio PR #159. This bounded corrective donor preserves that owner's original versioned backup plan, durable cursor/counts, bounded 8,000-target delivery, failure/continuation budgets, current credential/admin checks, attempt/lease fencing, private generation cleanup and prepared loaded-emulator scenarios. It is not an independent release authority.

## Resulting behavior

Deletion completion and its deterministic audit now commit in the same Firestore transaction. A lost completion acknowledgement retains exactly one matching audit and receipt; an authenticated replay does not erase again or add another completion audit.

The completion transaction reads the subject profile even when that profile was absent from the original backup. A later profile is preserved and denies completion; insertion after that read conflicts with the transaction. Neither case enlarges the frozen original target plan.

Retained cursor counts must match the original prefix by collection and deletion policy, including honest observed-absent counts. A globally matching cursor total cannot relabel deleted scenes as profile deletions or anonymizations. The existing backup purge deadline is also pinned through admitted attempts, without changing the seven-day restore window, thirty-day backup target or legal-hold semantics.

The native source fixture now loads the actual compiled Functions module after the existing frozen build. Its explicit synthetic Firebase adapters remain distinct from the separately required loaded Auth/Firestore/Storage/Functions emulator.

## Actual bounded verification

On Node 22.23.3 and TypeScript 5.9.3, the exact parent actual-module fixture passes its 87 cases. The six new cases reproduce all six remaining parent failures while those 87 still pass: missing audit after a committed completion interruption, late profile before and after the completion read, changed retention deadline, exchanged prefix collection counts and exchanged prefix deletion-policy counts.

The corrected actual TypeScript module passes 93 cases, zero failures or skips. Its strictly compiled JavaScript passes the same 93 actual-module cases. Strict compilation uses existing actual Firebase Admin 13.10.0, Functions 6.6.0, Firestore 7.11.6, Storage 7.19.0 and Node types 22.20.5, with no ambient SDK shims or dependency installation. This supplemental graph differs from Studio's declared Functions 7.4.0 and Node 20; it does not certify the full frozen graph. The initial strict check caught an optional document-id type mismatch; the corrected final strict check passes. Raw baseline, intermediate and final receipts are retained.

All five unchanged data-rights source-contract cases pass. The existing workflow's frozen install/build, exact source cleanliness, Node 20, loaded emulator confinement and release controls are preserved. Workflow syntax and compiled-fixture registration have been checked locally. This does not claim that the native workflow or loaded emulator executed successfully.

## Authority and open acceptance

An independently admitted original-plan successor superseded an unpublished 765723fd-based experimental continuation repair before publication; its source was preserved rather than replaced. Original-plan identity is never reconstructed from corrected or newly enumerated records. Old unversioned backups require explicit authority reconciliation; this source does not invent it or silently reclaim historical operations.

No main merge, production deployment, source freeze, independent approval, provider call, Storage signing, paid action, private live mutation or whole-estate erasure is claimed. Current exact-head native checks, the declared frozen graph, successfully loaded Functions emulator, privileged/client late-writer fences, permitted real-source cross-system lifecycle, retained-backup purge, provider erasure and independent review remain separate gates. Earlier completed receipts without an atomic completion audit are historical and require reconciliation; this source does not fabricate a missing audit.

The purge receipt continues to scope observed Studio Firestore records and known private export generations with `globalErasureVerified=false`. Previously copied/delivered bytes and already issued credentials are not magically recalled. Spatial capture defaults remain working, unfrozen and unapproved until separately re-bound to the coordinator's current owner.
