import { NextResponse } from 'next/server';

import {
  buildReadinessProfile,
  observeAllStudioIntegrations,
  parseReadinessProfile,
  type StudioReadinessProfileId,
} from '@/lib/studio/observed-readiness';
import { readinessSummary } from '@/lib/studio/status';

export const dynamic = 'force-dynamic';

type PublicReadinessCheck = {
  id: string;
  required: boolean;
  ok: boolean;
};

type ReadinessResponse = {
  ok: boolean;
  service: 'urai-studio';
  type: 'readiness';
  profile: StudioReadinessProfileId;
  localStatus: ReturnType<typeof readinessSummary>['status'];
  blockers: string[];
  warnings: string[];
  checks: PublicReadinessCheck[];
  integrations: Array<{
    id: string;
    configured: boolean;
    observed: boolean;
    state: string;
    httpStatus?: number;
    attempts: number;
  }>;
  activationAuthorized: false;
  hardOff: boolean;
  timestamp: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const profileId = parseReadinessProfile(url.searchParams.get('profile'));
  const local = readinessSummary();
  const observations = await observeAllStudioIntegrations();
  const profile = buildReadinessProfile(profileId, observations);
  const localBlockers = local.blockers.map((blocker) => `local:${blocker}`);
  const blockers = [...localBlockers, ...profile.blockers];
  const ok = local.ok && profile.ok;

  const body: ReadinessResponse = {
    ok,
    service: 'urai-studio',
    type: 'readiness',
    profile: profile.id,
    localStatus: local.status,
    blockers,
    warnings: local.warnings,
    checks: local.checks.map(({ id, required, ok: checkOk }) => ({ id, required, ok: checkOk })),
    integrations: profile.checks.map(({ id, configured, observed, state, httpStatus, attempts }) => ({
      id,
      configured,
      observed,
      state,
      httpStatus,
      attempts,
    })),
    activationAuthorized: false,
    hardOff: profile.hardOff,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: body.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
