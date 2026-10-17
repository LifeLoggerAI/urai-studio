import { NextResponse } from 'next/server';
import { applicationDefault, getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';
import { requireStudioLongformAuth, refreshStudioLongformAuth } from '@/lib/studio-life-movie-longform-auth';
import {
  SPATIAL_IDENTITY_PROJECT,
  STUDIO_IDENTITY_PROJECT,
  verifyStudioSpatialAccountLink,
} from '@/lib/studio-spatial-account-link';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const APP_NAME = 'urai-spatial-cross-project-identity-readonly';
const headers = {
  'Cache-Control': 'private, no-store, max-age=0',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'Vary': 'Authorization, x-urai-spatial-id-token',
};

function json(body: Record<string, unknown>, status: number) {
  return NextResponse.json(body, { status, headers });
}

/** No generic project ID, client-selected Firebase project or reused Studio
 * Admin app may substitute for the canonical Spatial identity provider.
 * ADC permission for token verification must be separately approved. */
function spatialVerifier() {
  if (process.env.URAI_STUDIO_SPATIAL_IDENTITY_ENABLED !== 'true'
    || process.env.URAI_SPATIAL_BRIDGE_PROJECT_ID !== SPATIAL_IDENTITY_PROJECT
    || !adminDb) throw new Error('spatial_identity_provider_unavailable');
  const studio = getApp();
  if (studio.options.projectId !== STUDIO_IDENTITY_PROJECT) {
    throw new Error('studio_identity_provider_mismatch');
  }
  const existing = getApps().find(app => app.name === APP_NAME);
  const app = existing || initializeApp({
    credential: applicationDefault(), projectId: SPATIAL_IDENTITY_PROJECT,
  }, APP_NAME);
  if (app.options.projectId !== SPATIAL_IDENTITY_PROJECT) {
    throw new Error('spatial_identity_provider_mismatch');
  }
  return getAuth(app);
}

/** Preflight identity pairing only: never returns a Jobs authority, private
 * media URL, source document, or playback token. Server-side memory/plan and
 * revocation binding remain a separate mandatory release hold. */
export async function POST(request: Request) {
  const actor = await requireStudioLongformAuth(request);
  if (!actor.ok) return json({ ok: false, error: 'studio_current_authority_required' }, 403);
  try {
    const verifier = spatialVerifier();
    const spatialIdToken = request.headers.get('x-urai-spatial-id-token') || '';
    const readServerLink = async (id: string): Promise<unknown> => {
      const snapshot = await adminDb!.doc(`studioSpatialAccountLinks/${id}`).get();
      return snapshot.exists ? snapshot.data() : null;
    };
    const args = {
      studioUid: actor.uid, tenantId: actor.tenantId, spatialIdToken,
      verifySpatialToken: (token: string) => verifier.verifyIdToken(token, true),
      readServerLink,
    };
    const first = await verifyStudioSpatialAccountLink(args);
    // A second Studio authority check and read of the server-owned link fence
    // prevent a revoked membership/link from being released after first read.
    const current = await refreshStudioLongformAuth(request, actor);
    if (!current.ok) return json({ ok: false, error: 'studio_current_authority_required' }, 403);
    const second = await verifyStudioSpatialAccountLink(args);
    if (first.spatialUid !== second.spatialUid || first.revision !== second.revision
      || first.studioUid !== current.uid || first.tenantId !== current.tenantId) {
      throw new Error('spatial_account_link_changed');
    }
    return json({
      ok: true, status: 'verified-identity-link', scope: 'life-movie.replay',
      privateMediaAuthorized: false, jobsPlanBound: false, j9Accepted: false,
      sourceProject: SPATIAL_IDENTITY_PROJECT,
    }, 200);
  } catch {
    // Do not reveal token, link existence, user identity or provider errors.
    return json({ ok: false, error: 'spatial_identity_link_not_verified' }, 403);
  }
}
