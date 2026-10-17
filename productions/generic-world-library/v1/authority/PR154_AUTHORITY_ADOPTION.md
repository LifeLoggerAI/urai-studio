# Existing Batch 1 authority and detailed-spec adapter

Studio draft PR 154, branch `assets/generic-world-library-batch1-20261007`, supplies the existing Batch 1 family authority at immutable head `38a07269009fc5a8b34946ecc0fa2a9566c4727a`. Its file `world-library/batch-01/generic-world-families.v1.json` remains unchanged. The companion `pr154-source-binding.v1.json` binds its exact source bytes and maps every authoritative family ID to a detailed source specification in this subtree.

The twelve upstream IDs remain the canonical family identities for existing governed asset resolution. Detailed `gw-*` IDs in this subtree are design-reference keys and adapter inputs. They do not replace resolver keys, change candidate authority, introduce alternate runtime paths, or imply that any package is integrated. Batch 2 and broader eras are additional `SPECIFIED` source briefs awaiting their own authority adoption.

## Differences are explicit inputs

The upstream `forwardAxis: -Z` does not distinguish an asset-front convention from a viewer-forward convention. Detailed specs distinguish asset front +Z from camera forward -Z. These are recorded as distinct fields. An adapter may use the camera-forward interpretation only after that convention is selected and receipted. If upstream -Z instead denotes mesh front, a half-turn about +Y is required; geometry, collision, navigation, camera poses, alignment anchors and bounds must be transformed consistently and revalidated. This source binding makes no transform, no integration claim, and no assumption that the ambiguity is already resolved.

Upstream navigation eye height is 1.69 m; detailed standing previews use 1.65 m and optional seated previews use 1.2 m. Existing upstream navigation defaults stay authoritative. Preview recipes do not silently override them. Upstream minimum clear width is 0.9 m and turning diameter is 1.5 m; the detailed 1.2 m route and 1.0 m doorway values are stricter design targets, not a claim about built geometry or legal accessibility certification.

Upstream era sets restrict existing Batch 1 authority. Any broader detailed eras remain generic extensions until a successor authority explicitly adopts them. Source `fall` maps to detailed `autumn`; emotional-weather capitalization maps directly. Source `day` needs an explicit morning/midday/afternoon choice. Source `rain` is not implemented merely by the narrower light-rain brief. Source `upscale` has no implemented detailed finish package and stays a pending variant.

Upstream performance maxima remain limits. Detailed conservative targets do not weaken them or prove performance. Texture budgets use different units: upstream MB is decimal (1,000,000 bytes), detailed MiB is binary (1,048,576 bytes). Compare actual bytes before acceptance rather than comparing the raw numbers. Every detailed texture target is below its corresponding upstream byte limit; no runtime texture memory or frame rate is measured by this binding.

## Status and receipts

Upstream families remain `SPECIFIED` with `providerStatus: READY_FOR_PROVIDER` and `providerSpendAuthorized: false`. Detailed source validation is a separate source-contract result. It is not geometry QA, literal visual acceptance, provider execution, commercial-output rights, independent review or release acceptance. Actual packages are separately hashed partial realizations of the broader brief.

The preexisting source receipts and `receipts/artifact-manifest.json` are unchanged. This adoption is an additive document, with its own exact-byte receipt. No upstream catalog file, source specification, provider package, existing immutable artifact set, candidate manifest or runtime file is changed by this adoption.
