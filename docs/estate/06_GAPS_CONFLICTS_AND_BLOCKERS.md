# R854 blocking findings — fail-closed

**P0: Jobs privileged Storage writer race.** [Jobs issue #252](https://github.com/LifeLoggerAI/urai-jobs/issues/252) and original [R843 native receipt](https://github.com/LifeLoggerAI/urai-studio/pull/179#issuecomment-6702281128) explicitly reproduce post-revocation privileged writer bypass in emulator, with `storageLevelFenceVerified=false`. A read-before-write lease check in the Studio fallback donor **does not provide an atomic Storage post-revocation fence**, nor a production-equivalent writer/IAM guarantee. Treat both safety issues separately.

**P0: actual positive C6 authority.** Studio sends consent descriptors; Jobs explicitly denies without trusted owner/source rights and real signed Privacy verifier. Synthetic properly shaped descriptors are intentionally rejected with HTTP 503. Do not enable rendering to obtain a PASS.

**P0: private delivery/Replay and global deletion.** No authorized end-to-end owner-only real media on physical devices, secure result generation, protected Storage writes, final deletion acknowledgment, independent privacy review or production certification exists in this pass.

**P1: fallback concurrency donor omitted from #179.** #175 has two unique commits/five-path repair: lease expiry validation on completion/failure, attempt-scoped filenames, pre-Storage write read, stale artifact cleanup, Firestore composite indexes/query ordering and new query-contract test. #179 retains shared paths and old implementation. Need review/apply minimal patch to engineering through separate authorized PR, run original full-source tests+emulators, include cancellation/deletion/late-upload race. No merge executed.

**P1: 95 divergent histories** are *leads*, not 95 missing features. Compare high-ahead legacy media creation and system branches by actual file objects/patches; do not bulk import old source or lose current private-media hardening.

**P1: historic archives:** Feb 5 static tag ~160 MB, with 89/46/13 MB `.tgz` objects; safe bytes/member extraction still blocked by binary payload access and lack of read-only full Git mirror in this pass.

**P1: Studio CI unexecuted/failed:** current #179 and #175 GitHub workflow jobs report failure with zero executed steps. Original external native runs exist; protected GitHub CI and a capable owner runner still require diagnosis.

**P1: multiple historical LOCK/FINAL docs:** old complete/lock labels are historic. `LOCK.md`, `docs/EVIDENCE_STATUS.md`, `docs/URAI_STUDIO_RELEASE_EVIDENCE.md` explicitly do not certify production. Keep full chronology rather than suppressing contradictions.

**Production verdict remains HOLD.**
