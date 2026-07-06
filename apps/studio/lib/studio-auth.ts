import { createHash } from 'node:crypto';
import { adminAuth, firebaseAdminStatus } from '@/lib/firebase-admin';

export type StudioAuthContext = {
  ok: boolean;
  production: boolean;
  uid: string;
  tenantId: string;
  email?: string;
  authMode: 'firebase_id_token' | 'local_fallback' | 'unconfigured';
  error?: {
    code: string;
    message: string;
  };
};

const DEFAULT_LOCAL_UID = 'anonymous-studio-user';
const DEFAULT_LOCAL_TENANT = 'public-studio';

function header(req: Request, name: string): string | null {
  return req.headers.get(name);
}

function bearerToken(req: Request): string | null {
  const value = header(req, 'authorization');
  if (!value) return null;
  const match = value.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

function safeTenant(value: string | null | undefined, fallback: string): string {
  const normalized = value?.trim();
  if (!normalized) return fallback;

  if (/^[a-zA-Z0-9_-]{1,96}$/.test(normalized)) {
    return normalized;
  }

  // Do not collapse distinct verified identities by merely deleting unsafe
  // characters. A stable digest remains a valid Firestore/Storage path segment
  // while preserving one-to-one tenant fallback semantics.
  return `tenant_${createHash('sha256').update(normalized).digest('hex').slice(0, 48)}`;
}

export async function requireStudioAuth(req: Request): Promise<StudioAuthContext> {
  const production = process.env.NODE_ENV === 'production';
  const requestedTenant = safeTenant(header(req, 'x-urai-tenant-id'), DEFAULT_LOCAL_TENANT);
  const token = bearerToken(req);

  if (!token) {
    if (!production) {
      const localUid = safeTenant(header(req, 'x-urai-user-id'), DEFAULT_LOCAL_UID);
      return {
        ok: true,
        production,
        uid: localUid,
        tenantId: requestedTenant,
        authMode: 'local_fallback',
      };
    }

    return {
      ok: false,
      production,
      uid: '',
      tenantId: requestedTenant,
      authMode: 'unconfigured',
      error: {
        code: 'missing_bearer_token',
        message: 'A Firebase ID token is required for this production Studio API.',
      },
    };
  }

  if (!adminAuth) {
    return {
      ok: false,
      production,
      uid: '',
      tenantId: requestedTenant,
      authMode: 'unconfigured',
      error: {
        code: 'firebase_admin_auth_unavailable',
        message: `Firebase Admin Auth is unavailable: ${firebaseAdminStatus.mode}`,
      },
    };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const tokenTenant =
      typeof decoded.tenantId === 'string'
        ? decoded.tenantId
        : typeof decoded.studioId === 'string'
          ? decoded.studioId
          : null;

    // Production tenant scope must come from a verified token. When no explicit
    // tenant claim exists, bind the request to a collision-resistant, path-safe
    // derivative of the authenticated UID instead of a caller-controlled header.
    const uidTenant = safeTenant(decoded.uid, DEFAULT_LOCAL_TENANT);
    const tenantId = safeTenant(tokenTenant, uidTenant);

    return {
      ok: true,
      production,
      uid: decoded.uid,
      tenantId,
      email: typeof decoded.email === 'string' ? decoded.email : undefined,
      authMode: 'firebase_id_token',
    };
  } catch (error) {
    return {
      ok: false,
      production,
      uid: '',
      tenantId: requestedTenant,
      authMode: 'firebase_id_token',
      error: {
        code: 'invalid_bearer_token',
        message: error instanceof Error ? error.message : 'Invalid Firebase ID token.',
      },
    };
  }
}
