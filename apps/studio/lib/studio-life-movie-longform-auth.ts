import 'server-only';
import { createHash } from 'node:crypto';

import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { requireStudioAuth, type StudioAuthContext } from '@/lib/studio-auth';

const ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function denied(auth: StudioAuthContext, code: string): StudioAuthContext {
  return { ...auth, ok: false, error: { code, message: 'Verified Studio long-form edit authority is required.' } };
}

/** Long-form dispatch uses existing server-owned studioUsers edit authority.
 * Client-writable memberships and local/header identity fallback cannot grant it.
 */
export async function requireStudioLongformAuth(request: Request): Promise<StudioAuthContext> {
  const auth = await requireStudioAuth(request);
  if (!auth.ok) return auth;
  if (auth.authMode !== 'firebase_id_token') return denied(auth, 'longform_verified_identity_required');
  if (!adminAuth || !adminDb) return denied(auth, 'longform_edit_authority_unavailable');

  const token = /^Bearer\s+(.+)$/i.exec(request.headers.get('authorization') || '')?.[1]?.trim();
  if (!token) return denied(auth, 'longform_verified_identity_required');

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token, true);
  } catch {
    return denied(auth, 'longform_verified_identity_required');
  }

  const claimedTenant = typeof decoded.tenantId === 'string' ? decoded.tenantId : decoded.studioId;
  if (
    decoded.uid !== auth.uid || !ID.test(auth.uid) ||
    typeof claimedTenant !== 'string' || !ID.test(claimedTenant) ||
    claimedTenant !== auth.tenantId
  ) return denied(auth, 'longform_tenant_binding_required');

  try {
    const snapshot = await adminDb.doc(`studioUsers/${auth.uid}`).get();
    const user = snapshot.exists ? snapshot.data() : null;
    if (!user || user.uid !== auth.uid || user.disabled === true || !['owner', 'admin'].includes(String(user.role))) {
      return denied(auth, 'longform_edit_role_required');
    }
    // Server-provisioned tenant memberships are separate from the user-wide
    // studioUsers role. Match the canonical Firestore Rules identity and tenant
    // fields; a global owner/admin role cannot cross a studio boundary.
    const memberSnapshot = await adminDb.doc(`memberships/${auth.uid}_${auth.tenantId}`).get();
    const member = memberSnapshot.exists ? memberSnapshot.data() : null;
    if (!member || member.uid !== auth.uid || member.studioId !== auth.tenantId
      || !['owner', 'creator'].includes(String(member.role))
      || member.disabled === true || member.revoked === true || member.active === false) {
      return denied(auth, 'longform_tenant_membership_required');
    }
    const fenceId = createHash('sha256').update(`urai-studio-data-rights:${auth.uid}`).digest('hex');
    const fenceSnapshot = await adminDb.doc(`studioDataRightsOwnerFences/${fenceId}`).get();
    const fence = fenceSnapshot.exists ? fenceSnapshot.data() : null;
    if (fenceSnapshot.exists && (!fence || fence.uid !== auth.uid || fence.active !== false || fence.permanent !== false)) {
      return denied(auth, 'longform_current_owner_deletion_fence');
    }
  } catch {
    return denied(auth, 'longform_edit_authority_unavailable');
  }

  try {
    const current = await adminAuth.verifyIdToken(token, true);
    const currentTenant = typeof current.tenantId === 'string' ? current.tenantId : current.studioId;
    if (current.uid !== auth.uid || currentTenant !== auth.tenantId) return denied(auth, 'longform_tenant_binding_required');
  } catch {
    return denied(auth, 'longform_verified_identity_required');
  }

  return auth;
}

/** Recheck after awaited input/bridge work while retaining the original actor. */
export async function refreshStudioLongformAuth(request: Request, expected: StudioAuthContext): Promise<StudioAuthContext> {
  const current = await requireStudioLongformAuth(request);
  if (!current.ok) return current;
  if (current.uid !== expected.uid || current.tenantId !== expected.tenantId) {
    return denied(current, 'longform_tenant_binding_required');
  }
  return current;
}
