import { NextResponse } from 'next/server';

import {
  DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX,
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
    schemaVersion: STUDIO_SPATIAL_HANDOFF_VERSION,
    defaultRuntimeMatrix: DEFAULT_STUDIO_SPATIAL_RUNTIME_MATRIX,
    unsupportedRuntimeTargets: STUDIO_SPATIAL_UNSUPPORTED_RUNTIME_TARGETS,
    evidenceRequiredRuntimeTargets: STUDIO_SPATIAL_EVIDENCE_REQUIRED_TARGETS,
    fallbackRenderer: 'fallback_cards',
    helpers: {
      createFallbackManifest: 'createFallbackStudioSpatialManifest',
      validateManifest: 'validateStudioSpatialManifest',
      listBlockedClaims: 'listBlockedStudioSpatialClaims',
      isReleaseSafe: 'isStudioSpatialManifestReleaseSafe',
    },
    contract: {
      producerSystem: 'urai-studio',
      consumerSystem: 'urai-spatial',
      defaultStatus: 'fallback_only',
      defaultRenderer: 'fallback_cards',
      tenantScopedAssetsRequired: true,
      releaseEvidenceRequiredForAdvancedTargets: true,
      fallbackOnlyCanRenderWithoutAdvancedTargetEvidence: true,
    },
  });
}
