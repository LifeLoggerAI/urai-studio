import 'server-only';

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
  } catch {
    return denied(auth, 'longform_edit_authority_unavailable');
  }

  return auth;
}
