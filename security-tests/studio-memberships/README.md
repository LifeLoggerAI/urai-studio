# Studio membership and tenant Rules regression

This isolated emulator harness verifies the repository's actual `firestore.rules` and `storage.rules`. It does not deploy rules or use a real Firebase project, service account, or provider credential. All test data belongs to the ephemeral `demo-urai-studio-memberships` project on loopback.

Run with Node 22+ and Java 21:

```sh
cd security-tests/studio-memberships
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm audit
```

`prepare-emulators.mjs` copies the two current root rules into an ignored local directory because the Firebase CLI rejects rules paths outside its config directory. The tests also read the actual root files. Missing source rules fail setup; this harness never falls back to open rules. The test config is not a deployment config.

The baseline fixtures are byte-identical source from main commit `854477d80b1a7aa718edb60d1ed4c1cf22dbed9d`, before this repair. Their Git blob IDs are checked by the tests: Firestore `f42bb889b607b707bb8ffc4ce2a3c1c99a0b806f` and Storage `11e3c0555d5a69b6f9b429020ce158f4a8a219d5`. They are loaded only into emulators. The three baseline probes demonstrate arbitrary client owner membership creation and protected studio read/update, another UID's membership creation, all six tenant update holes, and observed runtime errors for the unsupported `startsWith` and bare Storage `exists` calls. They do not claim those invalid-method read/update requests succeeded.

The 42 patched cases exercise unauthenticated, nonmember, cross-tenant, malformed UID/tenant/role, membership create/update/delete, six existing-tenant update guards, all seven protected collection reads, correct owner/creator/viewer access, Storage uploads/outputs, owner-only studio updates, UID collision, trusted membership removal, server-owned `studioUsers`, and existing self-upload/generated/public asset compatibility. They use real Firestore and Storage emulator requests rather than source token matching.

The membership shape follows `src/lib/studioTypes.ts`: `{ uid, studioId, role: owner|creator|viewer, createdAt }`, stored at `<uid>_<studioId>`. No new status field or migration is assumed. Membership writes now belong to trusted servers. The active owner bootstrap remains `functions/src/bootstrap-owner.ts` with its Admin transaction and one-time `system/config` gate; `studioUsers` remains a separate default-deny client collection. The archived deprecated client's self-created owner membership is intentionally no longer accepted.

The pinned test-only toolchain is Firebase 12.19.0, rules-unit-testing 5.0.2, and Firebase CLI 15.32.1. Its isolated overrides resolve the current registry advisories without editing the app or Functions dependency graph. Chokidar 4.0.3 removes the CLI's deprecated glob-parser dependency; this harness watches only literal local rule paths and does not exercise or authorize general CLI deployments. gRPC 1.14.5, basic-ftp 6.2.2, OpenTelemetry Core 2.8.0 and UUID 11.1.1 are pinned. Current native CI runs a strict `npm audit` and retains the result; no advisory or severity exemption is applied. A clean test-harness audit does not cover the app or other installed estate graphs.

The exact-source workflow checks out the PR head rather than a generated merge commit. It retains the full emulator output, source and lockfile hashes, exact commit, Node/Java/CLI versions, registry audit and receipt digests. It intentionally does not retain the CLI debug log, which can include host environment variables. Its token permissions are contents-read only and it receives no Firebase credentials.

Production admission still requires a protected review of existing membership records and deployed-rule/config parity. A well-formed owner record created under the former permissive rule is indistinguishable from trusted provisioning using this schema; source prevention cannot retroactively revoke it. Authorized audit, revocation or migration of historical forged records is a separate runtime prerequisite. Storage cross-product rule evaluation also needs the real project's Firestore service-agent permission and integrated testing. None of these prerequisites is closed by these local tests, and no runtime records, rules deployment, bootstrap or account configuration are changed here.
