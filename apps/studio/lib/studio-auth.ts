import { adminAuth, adminDb, firebaseAdminStatus } from '@/lib/firebase-admin';

export type StudioRole = 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer';

export type StudioAuthContext = {
  ok: boolean;
  production: boolean;
  uid: string;
  tenantId: string;
  role?: StudioRole;
  email?: string;
  authMode: 'firebase_id_token' | 'firebase_membership' | 'local_fallback' | 'unconfigured';
  error?: {
    code: string;
    message: string;
  };
};

const DEFAULT_LOCAL_UID = 'anonymous-studio-user';
const DEFAULT_LOCAL_TENANT = 'public-studio';
const STUDIO_ROLES = new Set<StudioRole>(['owner', 'admin', 'editor', 'reviewer', 'viewer']);
const STUDIO_EDIT_ROLES = new Set<StudioRole>(['owner', 'admin', 'editor']);

function header(req: Request, name: string): string | null {
  return req.headers.get(name);
}

function bearerToken(req: Request): string | null {
  const value = header(req, 'authorization');
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function documentSegment(value: unknown, maxBytes = 256): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  if (!normalized || normalized === '.' || normalized === '..' || normalized.includes('/')) return null;
  return Buffer.byteLength(normalized, 'utf8') <= maxBytes ? normalized : null;
}

function denied(production: boolean, code: string, message: string, authMode: StudioAuthContext['authMode']): StudioAuthContext {
  return { ok: false, production, uid: '', tenantId: '', authMode, error: { code, message } };
}

export async function requireStudioAuth(req: Request): Promise<StudioAuthContext> {
  const production = process.env.NODE_ENV === 'production';
  const rawRequestedStudio = header(req, 'x-urai-studio-id') ?? header(req, 'x-urai-tenant-id');
  const requestedStudio = documentSegment(rawRequestedStudio);
  const token = bearerToken(req);

  if (rawRequestedStudio !== null && !requestedStudio) {
    return denied(production, 'invalid_studio_scope', 'The selected Studio identifier is invalid.', token ? 'firebase_id_token' : 'unconfigured');
  }

  if (!token) {
    if (!production) {
      return {
        ok: true,
        production,
        uid: documentSegment(header(req, 'x-urai-user-id')) ?? DEFAULT_LOCAL_UID,
        tenantId: requestedStudio ?? DEFAULT_LOCAL_TENANT,
        role: 'owner',
        authMode: 'local_fallback',
      };
    }
    return denied(production, 'missing_bearer_token', 'A Firebase ID token is required for this production Studio API.', 'unconfigured');
  }

  if (!adminAuth || !adminDb) {
    return denied(production, 'firebase_admin_unavailable', `Firebase Admin is unavailable: ${firebaseAdminStatus.mode}`, 'unconfigured');
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token, true);
  } catch {
    return denied(production, 'invalid_bearer_token', 'The Firebase ID token is invalid or revoked.', 'firebase_id_token');
  }

  try {
    const uid = documentSegment(decoded.uid);
    if (!uid || uid !== decoded.uid) return denied(production, 'unsupported_uid', 'The authenticated identity cannot be represented exactly by the Studio membership model.', 'firebase_id_token');

    const claimedStudio = documentSegment(typeof decoded.studioId === 'string' ? decoded.studioId : null);
    const studioId = requestedStudio ?? claimedStudio;
    if (!studioId) return denied(production, 'missing_studio_scope', 'Select a Studio before using this API.', 'firebase_id_token');

    const membershipSnapshot = await adminDb.collection('studios').doc(studioId).collection('members').doc(uid).get();
    const membership = membershipSnapshot.data();
    const role = membership?.role as StudioRole | undefined;
    if (
      !membershipSnapshot.exists ||
      membership?.uid !== uid ||
      membership?.studioId !== studioId ||
      membership?.schemaVersion !== 2 ||
      membership?.status !== 'active' ||
      !role ||
      !STUDIO_ROLES.has(role)
    ) {
      return denied(production, 'studio_membership_required', 'Active canonical Studio membership is required.', 'firebase_id_token');
    }

    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method.toUpperCase()) && !STUDIO_EDIT_ROLES.has(role)) {
      return denied(production, 'studio_edit_role_required', 'Owner, admin, or editor membership is required for this operation.', 'firebase_membership');
    }

    return {
      ok: true,
      production,
      uid,
      tenantId: studioId,
      role,
      email: typeof decoded.email === 'string' ? decoded.email : undefined,
      authMode: 'firebase_membership',
    };
  } catch {
    return denied(production, 'studio_membership_lookup_failed', 'Studio membership could not be verified.', 'firebase_id_token');
  }
}
