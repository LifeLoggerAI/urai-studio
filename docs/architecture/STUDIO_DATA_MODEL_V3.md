# ADR — Studio Data Model V3 Convergence

Status: **SOURCE-APPROVED FOR PRE-LAUNCH IMPLEMENTATION; LIVE MIGRATION NOT AUTHORIZED**

Issue authority: `LifeLoggerAI/urai-studio#53`.

## Decision

URAI Studio uses one canonical tenant authority rooted at:

`studios/{studioId}`

with canonical membership at:

`studios/{studioId}/members/{uid}`

Application records remain in the existing flat modern collections to minimize release risk and avoid inventing a third collection family:

- `studioProjects`
- `studioBriefs`
- `studioJobs`
- `studioAssets`
- `studioExports`
- `studioReviews`
- `studioVersions`
- `studioEvidence`
- `studioFeaturePolicies`

Every new canonical application record is **schemaVersion 3**, includes `tenantId` and `userId`, and is written only by trusted server authority.

The collection names `studioProjects` and `studioAssets` historically held uid-owned browser records. They therefore operate as dual-shape compatibility collections during migration. V3 shape is identified only by `schemaVersion: 3` plus valid `tenantId` / `userId`.

## Writer authority

| Record family | New writes |
| --- | --- |
| canonical V3 application records | trusted server only |
| Studio membership V2 | trusted server only |
| legacy uid-owned Studio records | frozen |
| public waitlist/contact/project intake | trusted server routes only |
| generated outputs / audit / evidence | trusted server only |

A source file, feature registry, environment URL or browser client may not grant itself writer authority.

## Legacy containment

Legacy-only families are:

- `studioScenes`
- `assetJobs`
- `assetCollections`
- `studioScrolls`
- `narratorScripts`
- `subtitles`
- `voiceoverJobs`
- `exportJobs`
- `studioEvents`
- `xrSessions`
- `vrSessions`

No new canonical feature may add a writer to these collections.

Legacy callables may remain in source temporarily for rollback/forensic compatibility, but mutation authority must fail closed unless an explicit controlled compatibility flag is enabled in a non-public verification environment.

## Compatibility policy

1. V3 writers never emit uid-only records.
2. V3 readers reject records that cannot establish schema version and tenant scope.
3. Legacy records may be inspected only through compatibility readers that preserve uid ownership and never promote them to canonical state.
4. A legacy record does not become V3 merely because it lives in a dual-shape collection.
5. Migration copies/rewrites are separately authorized operations and must retain source identifiers and hashes where applicable.

## Migration sequence

1. inventory legacy counts and writer call sites;
2. freeze legacy browser/callable writes;
3. dry-run conversion into V3 fixtures;
4. verify membership-to-tenant mapping;
5. verify project/asset/job/export referential integrity;
6. run two-tenant negative tests;
7. retain pre-migration snapshot/receipt;
8. execute only under separately approved production authority;
9. verify exact migrated counts/hashes;
10. preserve rollback until post-migration acceptance.

This ADR does **not** authorize step 8.

## Rollback

Rollback must restore pre-migration records from the retained snapshot and restore the prior rules/functions revision as one bounded operation. Rollback never treats post-migration V3 writes as legacy uid-owned records.

## Non-decisions

This ADR does not:

- deploy Firestore or Storage rules;
- mutate production data;
- enable provider execution;
- enable public publishing;
- change Asset Factory generation authority;
- make Studio-Spatial XR live.
