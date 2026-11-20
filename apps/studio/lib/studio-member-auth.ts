import 'server-only';
import { createHash } from 'node:crypto';
import type { Transaction } from 'firebase-admin/firestore';

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

type AuthoritySnapshot = { exists: boolean; data(): Record<string, unknown> | undefined };
type AuthoritySnapshots = readonly [AuthoritySnapshot, AuthoritySnapshot, AuthoritySnapshot, AuthoritySnapshot];

function authorityRefs(uid: string, tenantId: string) {
  if (!adminDb) throw new Error('studio_member_authority_unavailable');
  const ownerFenceId = createHash('sha256')
    .update('urai-studio-data-rights:' + uid).digest('hex');
  return [
    adminDb.doc('studioUsers/' + uid),
    adminDb.doc('memberships/' + uid + '_' + tenantId),
    adminDb.doc('studioDataRightsOwnerFences/' + ownerFenceId),
    adminDb.doc('privacyDeletionTombstones/' + uid),
  ] as const;
}

/** One policy for preflight and Firestore's commit-validated transaction reads. */
function authorityFailure(uid: string, tenantId: string, intent: StudioAccessIntent,
  snapshots: AuthoritySnapshots): string | null {
  const [userSnapshot, memberSnapshot, fenceSnapshot, tombstoneSnapshot] = snapshots;
  const user = userSnapshot.exists ? userSnapshot.data() : null;
  const member = memberSnapshot.exists ? memberSnapshot.data() : null;
  const globalRole = String(user?.role ?? '');
  const memberRole = String(member?.role ?? '');

  if (!user || user.uid !== uid || user.disabled === true || user.revoked === true ||
      !READ_ROLES.has(globalRole) ||
      !member || member.uid !== uid || member.studioId !== tenantId ||
      !MEMBER_ROLES.has(memberRole) || member.disabled === true ||
      member.revoked === true || member.active === false) {
    return 'studio_current_membership_required';
  }
  if (intent === 'draft' &&
      (!WRITE_ROLES.has(globalRole) || !EDIT_MEMBER_ROLES.has(memberRole))) {
    return 'studio_edit_role_required';
  }

  if (fenceSnapshot.exists) {
    const fence = fenceSnapshot.data();
    if (!fence || fence.uid !== uid ||
        typeof fence.requestId !== 'string' || !fence.requestId ||
        fence.active !== false || fence.permanent !== false) {
      return 'studio_owner_deletion_fence';
    }
  }
  if (tombstoneSnapshot.exists) {
    const tombstone = tombstoneSnapshot.data();
    if (!tombstone || tombstone.uid !== uid || tombstone.active !== false ||
        LEASE_FIELDS.some(field => Object.hasOwn(tombstone, field))) {
      return 'studio_owner_deletion_fence';
    }
  }
  return null;
}

/** Do not admit a draft until the same Firestore transaction has read all
 * current membership, role and deletion records. A concurrent change will
 * invalidate/retry that transaction; this still does not authorize rendering.
 * The caller must provide the actor from verified server-side authentication.
 */
export async function assertStudioDraftAuthorityInTransaction(
  transaction: Transaction, uid: string, tenantId: string,
): Promise<void> {
  if (!BOUND_ID.test(uid) || !BOUND_ID.test(tenantId)) {
    throw new Error('studio_member_authority_required');
  }
  try {
    const refs = authorityRefs(uid, tenantId);
    const snapshots = await Promise.all([
      transaction.get(refs[0]), transaction.get(refs[1]),
      transaction.get(refs[2]), transaction.get(refs[3]),
    ]);
    const failure = authorityFailure(uid, tenantId, 'draft', snapshots);
    if (failure) throw new Error(failure);
  } catch (error) {
    if (error instanceof Error && [
      'studio_member_authority_required', 'studio_current_membership_required',
      'studio_edit_role_required', 'studio_owner_deletion_fence',
    ].includes(error.message)) throw error;
    throw new Error('studio_member_authority_unavailable');
  }
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
    const refs = authorityRefs(auth.uid, auth.tenantId);
    const snapshots = await Promise.all([
      refs[0].get(), refs[1].get(), refs[2].get(), refs[3].get(),
    ]);
    const failure = authorityFailure(auth.uid, auth.tenantId, intent, snapshots);
    if (failure) return denied(auth, failure);
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
