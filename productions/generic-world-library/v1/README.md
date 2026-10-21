# UrAi Generic World Library, source specification v1

This directory contains reusable GENERIC design specifications for every Batch 1 family, seventeen high-reuse Batch 2 families, nine era packs (1940s–2020s), controlled variant axes, region adapters, and source contract tooling. It contains no autobiographical source material or real-person identity.

The authoritative family list and exact UTF-8 specification hashes are in `catalog.json`. Source hash receipts are in `receipts/source-specification-receipt.json`; machine source-contract results are in `receipts/spec-validation.json`. The specifications remain `SPECIFIED`. Passing source-contract checks does not change them to generated assets or accepted environments.

## Authority and integration boundary

- Starting Studio base: `854477d80b1a7aa718edb60d1ed4c1cf22dbed9d`.
- Starting non-colliding lanes: urai-studio issue 153 and urai-jobs issue 152.
- This subtree does not edit application code, Spatial, candidate manifests, deployments, private production authority, or runtime asset bindings.
- Actual geometry, texture, preview and provider outputs produced by another lane need their own exact hashes and receipts. Logical kit IDs are intended for the existing Asset Factory resolver. They are not alternative runtime paths.
- A procedural package may realize only part of a broader source brief. Its receipt must say which geometry, furniture, finishes, navigation and variant axes it realizes, and which remain unbuilt. It must not say that all controlled variants are generated.
- No source specification claims launch integration, production deployment, Spatial acceptance, independent approval, Gold Master status, or physical XR certification.

## Contents and source validation

`build_catalog.py` regenerates the catalog, JSON specifications, era packs, taxonomies and source hash receipt deterministically from checked-in original briefs. It uses only the Python standard library, invokes no paid provider, downloads no third-party source, and creates no model/audio/texture bytes.

```bash
python3 productions/generic-world-library/v1/build_catalog.py
python3 productions/generic-world-library/v1/validate_catalog.py --self-test --out productions/generic-world-library/v1/receipts/spec-validation.json
```

The validator checks the twelve required Batch 1 IDs, at least twelve Batch 2 briefs, nine complete era briefs, semantic IDs, hashes, shared-kit object identity, positive finite dimensions, floor/ceiling bounds, nonoverlapping specified furniture envelopes, reserved clear navigation corridors, turning reservations, material references, dependencies, truth constraints and unbound integration states. Six negative fixtures test rejection of negative dimensions, truth promotion, active candidate binding, blocked routes, unreviewed external assets and inflated visual acceptance.

JSON Schema validation runs additionally if `jsonschema` is already available. Its presence is recorded in the receipt; the source-contract validator has no dependency on it. Source placement checks use specified axis-aligned envelopes. They do not prove actual generated meshes, collision, navmesh topology, UV quality, normal integrity, LOD switching, draw calls or frame rate.

Source-only performance profiles contain design targets, not measurements. The target FPS fields are planning inputs and are not device acceptance.

## Variant recipe compiler

`compile_variant.py` composes a deterministic, hashed source recipe for a supported selection. It does not generate geometry or pretend material/lighting changes were built.

```bash
python3 productions/generic-world-library/v1/compile_variant.py --family gw-east-texas-living-room --era era-1970s --dressing light --lod mobile --lighting-profile calm --out productions/generic-world-library/v1/recipes/example-living-room-mobile.json
```

The recipe ID includes family version, explicit controlled axes and a SHA-256 seed prefix. The complete seed binds all chosen axes and the exact source-spec bytes. Unknown era choices, unnamed future region adapters and unreviewed alternate navigation are rejected. Empty/light/rich means set-dressing density; this lane does not create occupants or personalities.

Examples may be regenerated from tooling. Generated source recipes stay `SPECIFIED`, with empty generated-output lists and `runtimeIntegrated: false`.

## Coordinate and captured reality contract

Units are meters. Coordinates are right-handed with +Y up, asset front +Z and camera-forward -Z. The main zone origin is its floor center. Secondary zones have explicit translations; furniture positions are local to their named zone. Mesh conversion must be receipted exactly once rather than applied again to already converted output.

Capture insert slots are disabled boundaries, not manufacturable models or recorded evidence. A future insert must bind reviewed source coordinates, measured scale, at least three noncollinear alignment anchors, a transform with residuals, bounding volume, collision authority, occlusion shell and lighting blend. Its source truth and consent record remain component-specific. A recorded insert cannot promote the generic shell to recorded truth. A splat is not a collision proxy or a navmesh.

Covered generic geometry must be disabled after accepted captured-space replacement to avoid double walls and false occlusion. Precise addresses, personal GPS, private media, names, faces and voices stay outside this public source catalog under existing private-source rules.

## Visual bar and remaining work

Every family contains a substantive architecture brief, explicit zone scale, item placement bounds, original PBR intent, lighting targets, empty/light/rich rules, safe navigation targets, personalization anchors, insert bounds, performance targets and a six-shot preview plan. Those briefs are not historical evidence and do not establish AAA art quality.

Actual high-detail manufacture must still prove believable construction, real material scale, plausible wear, clean normals, UVs, readable exits, sensible furniture, quality foliage, low-stimulation lighting and absence of repeated texture artifacts. Visual review must inspect representative wide, eye-height, doorway and material-detail renders. Mobile/XR views must bind their real asset tiers; a desktop image relabelled mobile is insufficient. Physical XR proof remains separate.

Era briefs intentionally allow retained older furniture, different regional/income contexts and diverse tastes. They do not claim that every household or institution followed one decade's aesthetic. Real brands, readable generated trademarks, secure installation plans, clinical claims, named school records and cemetery identities are excluded.

## Provenance, rights and versioned history

These are original generic design briefs authored for UrAi with Codex. No third-party asset bytes, reference photos, personal evidence or real-person likenesses were imported. Each spec and kit includes an identifiable source and rights record. No repository license was found during the source audit; authored source licensing is recorded as `UNASSIGNED_PROJECT_AUTHORED_SPECIFICATION`. Provider-output commercial terms, attribution and restrictions must be reviewed and receipted for each actual output before production use; the source brief grants no rights to nonexistent provider output.

Content SHA-256 receipts identify exact bytes. They become immutable authority when preserved by an immutable commit or archived package. An edited specification or kit must be a versioned successor before accepted asset authority changes. A shared kit ID may only be reused with identical content. The source receipt is not a provider bill, a spend authorization, a visual acceptance, or a release certification.
