import { createHash } from 'node:crypto';

/** Read-only Studio ↔ Spatial account identity proof. No media capability is
 * created and no account link can be provisioned by this module. */
export const SPATIAL_IDENTITY_PROJECT = 'urai-4dc1d' as const;
export const STUDIO_IDENTITY_PROJECT = 'urai-studio' as const;
const LINK_SCHEMA = 'urai-studio-spatial-account-link-v1';
const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const ISSUER = 'https://securetoken.google.com/urai-4dc1d';
const MAX_LINK_LIFETIME_MS = 30 * 24 * 60 * 60 * 1000;

function deny(): never { throw new Error('spatial_account_link_unavailable'); }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) deny();
  return value as Record<string, unknown>;
}

/** Document id is derived only from two server-verified actors and the
 * authenticated Studio tenant. No caller-chosen account-link id is accepted. */
export function studioSpatialLinkId(studioUid: string, tenantId: string, spatialUid: string): string {
  if (![studioUid, tenantId, spatialUid].every(v => typeof v === 'string' && ID.test(v))) deny();
  return createHash('sha256')
    .update(['urai-studio-spatial-account-link-v1', studioUid, tenantId, spatialUid].join('\x00'))
    .digest('hex');
}

export async function verifyStudioSpatialAccountLink(input: {
  studioUid: string;
  tenantId: string;
  spatialIdToken: string;
  verifySpatialToken: (token: string) => Promise<unknown>;
  readServerLink: (hashedId: string) => Promise<unknown>;
  now?: number;
}): Promise<Readonly<{ studioUid: string; tenantId: string; spatialUid: string; revision: number }>> {
  const now = input.now ?? Date.now();
  if (!Number.isSafeInteger(now) || now < 0) deny();
  if (!ID.test(input.studioUid) || !ID.test(input.tenantId)) deny();
  const token = input.spatialIdToken;
  if (typeof token !== 'string' || token.length < 40 || token.length > 8192
    || token.trim() !== token
    || !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) deny();

  // verifySpatialToken MUST use a named, project-pinned Firebase Admin app and
  // verifyIdToken(token, true). Claims are checked again before any link read.
  const claims = record(await input.verifySpatialToken(token));
  const spatialUid = claims.uid;
  if (typeof spatialUid !== 'string' || !ID.test(spatialUid) || claims.sub !== spatialUid
    || claims.aud !== SPATIAL_IDENTITY_PROJECT || claims.iss !== ISSUER) deny();

  const link = record(await input.readServerLink(studioSpatialLinkId(
    input.studioUid, input.tenantId, spatialUid,
  )));
  if (link.schemaVersion !== LINK_SCHEMA || link.status !== 'active'
    || link.provisionedBy !== 'trusted-server'
    || link.studioUid !== input.studioUid || link.tenantId !== input.tenantId
    || link.spatialUid !== spatialUid || link.spatialProjectId !== SPATIAL_IDENTITY_PROJECT
    || link.purpose !== 'life-movie.replay'
    || !Number.isSafeInteger(link.revision) || Number(link.revision) < 1
    || !Number.isSafeInteger(link.expiresAtMs)
    || Number(link.expiresAtMs) <= now
    || Number(link.expiresAtMs) > now + MAX_LINK_LIFETIME_MS) deny();

  return Object.freeze({
    studioUid: input.studioUid, tenantId: input.tenantId,
    spatialUid, revision: Number(link.revision),
  });
}
