import 'server-only';
import { createHash } from 'node:crypto';

import { adminDb } from '@/lib/firebase-admin';
import { requireStudioAuth, type StudioAuthContext } from '@/lib/studio-auth';

const BOUND_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const READ_ROLES = new Set(['owner', 'admin', 'editor', 'viewer']);
const WRITE_ROLES = new Set(['owner', 'admin', 'editor']);
const MEMBER_ROLES = new Set(['owner', 'creator', 'viewer']);
const EDIT_MEMBER_ROLES = new Set(['owner', 'creator']);
const LEASE_FIELDS = [
  'deletionPlanningLeaseToken', 'deletionPlanningLeaseUntil',
  'deletionPlanningLeaseRequestId', 'deletionPlanningLeaseOperation',
  'deletionPlanningLeaseBy',
] as const;

export type StudioAccessIntent = 'read' | 'draft';

function denied(auth: StudioAuthContext, code: string): StudioAuthContext {
  return {
    ...auth, ok: false,
    error: { code, message: 'Current Studio membership and owner authority are required.' },
  };
}

/** Ordinary draft APIs need current server-owned membership, not only JWT claims.
 * This does NOT grant private Life Movie render consent or a worker lease.
 */
export async function requireStudioMemberAuth(
  request: Request, intent: StudioAccessIntent,
): Promise<StudioAuthContext> {
  const auth = await requireStudioAuth(request);
  if (!auth.ok) return auth;

  // Keep the pre-existing local contract-only demonstration, but never use
  // a header identity when a Firebase Admin persistence backend exists.
  if (auth.authMode === 'local_fallback' && !auth.production && !adminDb) return auth;
  if (auth.authMode !== 'firebase_id_token') return denied(auth, 'studio_verified_identity_required');
  if (!adminDb) return denied(auth, 'studio_member_authority_unavailable');
  if (!BOUND_ID.test(auth.uid) || !BOUND_ID.test(auth.tenantId)) {
    return denied(auth, 'studio_member_authority_required');
  }

  try {
    const ownerFenceId = createHash('sha256')
      .update('urai-studio-data-rights:' + auth.uid).digest('hex');
    const [userSnapshot, memberSnapshot, fenceSnapshot, tombstoneSnapshot] = await Promise.all([
      adminDb.doc('studioUsers/' + auth.uid).get(),
      adminDb.doc('memberships/' + auth.uid + '_' + auth.tenantId).get(),
      adminDb.doc('studioDataRightsOwnerFences/' + ownerFenceId).get(),
      adminDb.doc('privacyDeletionTombstones/' + auth.uid).get(),
    ]);
    const user = userSnapshot.exists ? userSnapshot.data() : null;
    const member = memberSnapshot.exists ? memberSnapshot.data() : null;
    const globalRole = String(user?.role ?? '');
    const memberRole = String(member?.role ?? '');

    if (!user || user.uid !== auth.uid || user.disabled === true || user.revoked === true ||
        !READ_ROLES.has(globalRole) ||
        !member || member.uid !== auth.uid || member.studioId !== auth.tenantId ||
        !MEMBER_ROLES.has(memberRole) || member.disabled === true ||
        member.revoked === true || member.active === false) {
      return denied(auth, 'studio_current_membership_required');
    }
    if (intent === 'draft' &&
        (!WRITE_ROLES.has(globalRole) || !EDIT_MEMBER_ROLES.has(memberRole))) {
      return denied(auth, 'studio_edit_role_required');
    }

    if (fenceSnapshot.exists) {
      const fence = fenceSnapshot.data();
      if (!fence || fence.uid !== auth.uid ||
          typeof fence.requestId !== 'string' || !fence.requestId ||
          fence.active !== false || fence.permanent !== false) {
        return denied(auth, 'studio_owner_deletion_fence');
      }
    }
    if (tombstoneSnapshot.exists) {
      const tombstone = tombstoneSnapshot.data();
      if (!tombstone || tombstone.uid !== auth.uid || tombstone.active !== false ||
          LEASE_FIELDS.some(field => Object.hasOwn(tombstone, field))) {
        return denied(auth, 'studio_owner_deletion_fence');
      }
    }
    return auth;
  } catch {
    return denied(auth, 'studio_member_authority_unavailable');
  }
}

/** Recheck at the last route-level admission point after awaited body parsing. */
export async function refreshStudioMemberAuth(
  request: Request, expected: StudioAuthContext, intent: StudioAccessIntent,
): Promise<StudioAuthContext> {
  const current = await requireStudioMemberAuth(request, intent);
  if (!current.ok) return current;
  if (current.uid !== expected.uid || current.tenantId !== expected.tenantId ||
      current.authMode !== expected.authMode) {
    return denied(current, 'studio_member_identity_changed');
  }
  return current;
}
