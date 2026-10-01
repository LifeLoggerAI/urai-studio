import { NextResponse } from 'next/server';

import { requireStudioAuth } from '@/lib/studio-auth';
import { studioFeaturePolicies } from '@/lib/studio/feature-policy';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = await requireStudioAuth(req);
  if (!auth.ok) {
    return NextResponse.json(
      { ok: false, error: auth.error?.code ?? 'unauthorized' },
      { status: auth.error?.code === 'missing_bearer_token' ? 401 : 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  if (auth.role !== 'owner' && auth.role !== 'admin') {
    return NextResponse.json(
      { ok: false, error: 'studio_admin_role_required' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const policies = studioFeaturePolicies().map(({ id, state, hardOff, activationAuthorized, source }) => ({
    id,
    state,
    hardOff,
    activationAuthorized,
    source,
  }));

  return NextResponse.json(
    {
      ok: true,
      service: 'urai-studio',
      tenantId: auth.tenantId,
      policies,
      mutationEndpointAvailable: false,
      sourceRegistryCanAuthorizeActivation: false,
      generatedAt: new Date().toISOString(),
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } },
  );
}

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: 'feature_activation_mutation_not_available',
      activationAuthorized: false,
    },
    { status: 405, headers: { Allow: 'GET', 'Cache-Control': 'no-store' } },
  );
}
