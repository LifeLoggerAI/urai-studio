# URAI System Contract

Status: canonical contract specification
Canonical app: `apps/studio`
Contract version: `0.1.0`

This document defines the canonical URAI Studio system-of-systems contracts. Runtime TypeScript should be generated from this document or kept aligned with it.

## Systems

- `urai-app`
- `urai-studio`
- `urai-spatial`
- `urai-privacy`
- `urai-foundation`
- `urai-analytics`
- `asset-factory`
- `urai-passport`
- `urai-council`

## Core records

Every production record that belongs to a user or tenant must include:

- `id`
- `tenantId`
- `userId`
- `createdAt`
- `updatedAt`

## StudioProject

Required fields:

- `id`
- `tenantId`
- `userId`
- `name`
- `description`
- `ownerSystem = urai-studio`
- `linkedSystems`
- `capabilityKeys`
- `createdAt`
- `updatedAt`

## StudioBrief

Required fields:

- `id`
- `tenantId`
- `userId`
- `projectId`
- `title`
- `prompt`
- `intendedOutputs`
- `requestedExports`
- `consentRequirements`
- `safetyBoundaries`
- `createdAt`
- `updatedAt`

## StudioJob

Required fields:

- `id`
- `tenantId`
- `userId`
- `projectId`
- `briefId`
- `kind`
- `status`
- `provider`
- `model`
- `inputAssetIds`
- `outputAssetIds`
- `requestedExportIds`
- `consentRequirements`
- `safetyBoundaries`
- `errorCode`
- `errorMessage`
- `createdAt`
- `updatedAt`

Allowed `status` values:

- `draft`
- `queued`
- `running`
- `waiting_for_consent`
- `waiting_for_payment`
- `succeeded`
- `failed`
- `canceled`

Allowed `kind` values:

- `image_generation`
- `video_generation`
- `music_generation`
- `voice_generation`
- `motion_spec_generation`
- `three_scene_generation`
- `webxr_scene_generation`
- `pitch_export`
- `scroll_export`
- `asset_bundle_export`

## StudioAsset

Required fields:

- `id`
- `tenantId`
- `userId`
- `projectId`
- `jobId`
- `kind`
- `title`
- `storagePath`
- `mimeType`
- `sizeBytes`
- `checksum`
- `generationMetadata`
- `consentRequirements`
- `safetyBoundaries`
- `createdAt`
- `updatedAt`

Allowed `kind` values:

- `image`
- `video`
- `audio`
- `subtitle`
- `script`
- `storyboard`
- `scene_manifest`
- `three_component`
- `rive_or_lottie_spec`
- `firebase_bundle`
- `pitch_document`
- `brand_kit`

## StudioExport

Required fields:

- `id`
- `tenantId`
- `userId`
- `projectId`
- `jobId`
- `assetIds`
- `kind`
- `status`
- `storagePath`
- `downloadUrl`
- `expiresAt`
- `tenantScoped = true`
- `createdAt`
- `updatedAt`

Allowed `kind` values:

- `png`
- `svg`
- `webp`
- `mp4`
- `wav`
- `mp3`
- `srt`
- `json`
- `pdf`
- `zip`
- `firebase_bundle`
- `react_component`
- `three_scene`
- `webxr_manifest`

## UraiPassport

Required fields:

- `id`
- `tenantId`
- `userId`
- `displayName`
- `permissions`
- `dataExportEnabled`
- `deletionFlowEnabled`
- `adFreeCoreExperience = true`
- `externalMarketingLayerEnabled = false`
- `createdAt`
- `updatedAt`

## PassportPermission

Required fields:

- `category`
- `state`
- `purpose`
- `grantedAt`
- `revokedAt`
- `expiresAt`
- `retentionPolicyId`

Allowed `state` values:

- `not_requested`
- `granted`
- `denied`
- `revoked`
- `expired`

## ConsentRequirement

Required fields:

- `category`
- `stateRequired = granted`
- `purpose`
- `retentionPolicyId`

## Signal categories

- `account`
- `profile`
- `audio`
- `transcription`
- `location`
- `device_activity`
- `calendar`
- `communications_metadata`
- `health`
- `sleep`
- `social_interaction`
- `facial_analysis`
- `environmental_audio`
- `generated_assets`
- `analytics`
- `third_party_export`

## SafetyBoundary

Required fields:

- `requiredLanguage`
- `humanReviewRequired`
- `policyId`

Allowed `requiredLanguage` values:

- `none`
- `uncertainty`
- `pattern_support_not_diagnosis`

## V1-V5 capability registry

### V1_GENESIS_HOME

Version: `v1`
Systems:

- `urai-app`
- `urai-studio`
- `urai-spatial`
- `urai-passport`
- `urai-council`

Renderer dependencies:

- true 3D world
- ground
- orb
- sky
- mood weather
- soundscape

Acceptance tests:

- Genesis world loads without internal labels.
- Orb and ground render from typed scene state.

### V2_COGNITIVE_MIRROR

Version: `v2`
Systems:

- `urai-app`
- `urai-analytics`
- `urai-privacy`
- `urai-council`

Acceptance tests:

- Every insight includes why-am-I-seeing-this explanation.
- Pattern language is careful and non-diagnostic.

### V3_PATTERN_REFLECTION

Version: `v3`
Systems:

- `urai-app`
- `urai-privacy`
- `urai-analytics`
- `urai-council`

Acceptance tests:

- Pattern reflection features avoid objective certainty claims.
- Human review is available for high-impact or ambiguous outputs.

### V4_WEBXR_HANDOFF

Version: `v4`
Systems:

- `urai-studio`
- `urai-spatial`
- `asset-factory`

Acceptance tests:

- Studio scene manifest is loadable by URAI Spatial.
- WebXR handoff uses the canonical scene contract.

### V5_MIRROR_OF_BECOMING

Version: `v5`
Systems:

- `urai-app`
- `urai-studio`
- `urai-council`
- `urai-privacy`

Acceptance tests:

- Legacy output is exportable.
- Export includes consent receipt metadata.

## Done-done gate

The repo is not done-done unless this contract is implemented in runtime code, imported by production systems, and validated by CI.
