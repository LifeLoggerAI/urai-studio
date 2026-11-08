# One UrAi Genesis Studio R870 — native acceptance triage, CI readback and fail-closed runner

**Date:** 2026-11-07. **Status:** REVIEW-ONLY / PRODUCTION HOLD. **Engineering candidate pinned:** R869 [Studio #196](https://github.com/LifeLoggerAI/urai-studio/pull/196) commit `638e5cbebe98d8af15561a35f142baca14c94d25`, stacked on R868 #193 and earlier engineering reviews. This document does not certify a full native run.

## 1. Accessible source and environment
- GitHub tree for the exact R869 ref was **not truncated**: 1,229 tree entries, including **928 Git blobs**, with a total reported Git-blob size of **6,213,608 bytes**. These are Git tree metadata, **not** proof that every source/blob/history item was fetched, read or hashed. The tree contains 91 `apps/studio/tests/*.test.mjs` files.
- Local sandbox Node **v22.16.0**, npm **10.9.2**, git **2.47.3**, global TypeScript, Java present; **pnpm missing**, Node20 absent and full repo checkout absent. DNS failed on `git ls-remote https://github.com/LifeLoggerAI/urai-studio.git HEAD` with `Could not resolve host: github.com`; outbound direct HTTPS also unavailable. No package installation or original full suite/build was possible.
- Original exact-source root `package.json` Git blob `b88551de2db8d4e7481c18fe98f9753278f2cabb` requires Node `>=20 <21`, pnpm `9.7.0`; `apps/studio/package.json` Git blob `e16ec8e2e42b79d8c0c731b9af7686a8e9ef1169`; original `pnpm-lock.yaml` Git blob `422e009e485c23b6dae048bb204b64aefb7bca81`, lockfileVersion `9.0`, importer `apps/studio` present.
- The full Studio test runner `apps/studio/tests/all.test.mjs` Git blob `fbcba22ff394eaa0f3003cb14719d904f008933c` auto-imports every `.test.mjs` in the folder. All **91** test files were fetched from the exact R869 source ref and cleared a **syntactic JavaScript parser screening** after normalizing static ESM import declarations and `import.meta` syntax for the screening parser. This is not `node --check` on original files, **not execution of test assertions**, not original full build, and cannot establish complete import/runtime compatibility.

## 2. GitHub CI truth at the exact R869 SHA
Three GitHub Actions workflow runs were attached to R869 `638e5cb...` and each reported **completed / failure**, all created and started `2026-11-07T22:49:26Z` and finished/updated within approximately 3–4 seconds:
| Workflow | Run ID | Job ID | Result |
| --- | ---: | ---: | --- |
| Studio authenticated data-rights emulator | `42422397884` | `128553429706` | completed / failure |
| URAI Studio Video Factory Verification | `42422398093` | `128553430805` | completed / failure |
| URAI Production Verify | `42422397924` | `128553429984` | completed / failure |

- `fetch_workflow_run_jobs` returned one failed job per run; `fetch_workflow_job_steps` returned **zero steps** per job. Attempts to retrieve each job's log through GitHub returned **BlobNotFound / 404**, not usable stdout/stderr. `get_commit_combined_status` returned an empty statuses array. Thus **do not infer which build/test step failed, nor assert a native test, Firebase emulator, renderer or device run actually took place.** A runner, account/billing or GitHub infrastructure failure is a possibility, not independently proven as the cause.
- Workflow `studio-ci.yml` only triggers on push/pull requests targeting **main**; R869 is a stacked PR targeting an engineering review branch. `video-factory-verification.yml` contains a Node20/pnpm frozen Studio test/typecheck/build lane and additional multi-project/browser/emulator steps. These are workflow declarations, **not proof of execution**.

## 3. New exact-source execution artifact
- `docs/estate/STUDIO_R870_NATIVE_ACCEPTANCE.sh` on the Genesis documentation branch is a **credential-free, nonproduction, local acceptance runner** for the exact R869 commit. It requires origin `LifeLoggerAI/urai-studio`, clean checked-out commit `638e5cbebe98d8af15561a35f142baca14c94d25`, Node20, pnpm9.7.0, lockfile/workspace, and no configured cloud credentials. Then it runs a frozen install, Studio tests/typecheck/lint/build, Functions build, writing phased log hashes and a permanent **RELEASE_HOLD** marker even if those stages pass.
- Local script SHA256 **`622faa837cfc0e6d4ce74063b114d615c7cfc21f39748f74f4575237e1e91524`** and byte size **3,640**. Exact script was uploaded and verified as 3,640-character UTF-8 content. Its Bash syntax preflight **PASS**; executable preflight **correctly EXIT 77** for missing pnpm and EXIT 77 for a synthetic wrong-commit Git checkout using a stub pnpm. These are preflight negative tests, **not original Studio source acceptance**.
- The script is intentionally stored in the **Genesis documentation branch**, not merged into R869 source. It may be downloaded/supplied to an authorized native runner and executed from the **exact R869 checkout**, with evidence written locally outside tracked source if desired. No activation of Firebase, production identity, media processing or paid compute is included.

## 4. Remaining mandatory gates
1. Resolve or obtain authoritative job log/runner cause for failed GitHub Actions. Restore a real native runner and capture first **executed** failing command with exact stdout/stderr rather than guessing. Do not mark failures as code failures absent logs.
2. On clean exact R869 checkout with Node20/pnpm9.7.0, run `pnpm install --frozen-lockfile`, `pnpm --filter studio test`, `pnpm --filter studio typecheck`, `pnpm --filter studio lint`, `pnpm --filter studio build`, `pnpm --dir functions build`; retain exact source/lockfile versions, exit codes, logs, hashes, and fix only reproduced failures. In particular run R860–R869 checked-in regressions.
3. Run disposable authenticated real Firebase **Auth+Firestore+Storage+Functions** emulator integration: owner and cross-owner, concurrent same-key transactions, revocation/deletion during commit, zero late writes, no unsigned/private render admission, protected output provenance, and data rights/erasure.
4. Independently reconcile and review the stacked R858/R859 security Rules and R860–R869 engineering changes before any merge; do not overwrite active workers or silently promote them.
5. Jobs #252 privileged Storage post-revocation future-write guard, trusted signed positive Privacy C6 consent and real protected source→MP4/SRT→owner-only Replay→revocation/deletion→physical-device acceptance remain HARD-OFF.

**Conclusion:** R870 advanced actual CI forensics, inspected all named Studio JavaScript test sources for screening-only parser errors, and committed a fail-closed native gate. It did **not** run the frozen native Studio suite, a Firebase emulator, private rendering or production deployment. **One UrAi Genesis production HOLD.**
