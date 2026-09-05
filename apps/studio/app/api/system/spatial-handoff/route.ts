import { NextResponse } from 'next/server';

import {
  DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX,
  STUDIO_SPATIAL_GLTF_MIME_TYPES,
  STUDIO_SPATIAL_EVIDENCE_REQUIRED_TARGETS,
  STUDIO_SPATIAL_HANDOFF_VERSION,
  STUDIO_SPATIAL_UNSUPPORTED_RUNTIME_TARGETS,
} from '@/lib/studio-spatial-handoff';

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'urai-studio',
    consumerSystem: 'urai-spatial',
    endpoint: '/api/system/spatial-handoff',
    contractVersion: STUDIO_SPATIAL_HANDOFF_VERSION,
    wireContract: 'urai-spatial/0.1.0',
    runtimeTargets: DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX,
    unsupportedRuntimeTargets: STUDIO_SPATIAL_UNSUPPORTED_RUNTIME_TARGETS,
    evidenceRequiredRuntimeTargets: STUDIO_SPATIAL_EVIDENCE_REQUIRED_TARGETS,
    modelAssets: {
      kind: 'mesh',
      mimeTypes: STUDIO_SPATIAL_GLTF_MIME_TYPES,
    },
    fallbackRenderer: 'fallback_cards',
    helpers: {
      emitExport: 'emitStudioSpatialExport',
      createBlockedHandoff: 'createBlockedStudioSpatialHandoff',
      validateExport: 'validateStudioSpatialExport',
      listBlockedClaims: 'listBlockedStudioSpatialClaims',
      isReleaseSafe: 'isStudioSpatialManifestReleaseSafe',
    },
    contract: {
      producer: 'urai-studio',
      consumer: 'urai-spatial',
      requiredFields: [
        'contractVersion',
        'producer',
        'consumer',
        'exportId',
        'projectId',
        'tenantId',
        'createdAt',
        'runtimeTargets',
        'sceneManifest',
        'assetManifest',
        'consentReceipt',
        'safetyBoundaries',
        'releaseEvidence',
      ],
      completeEvidenceRequiredForEmission: true,
      trustedReleaseAuthorityRequired: true,
      liveIntegrationClaimed: false,
    },
  });
}
