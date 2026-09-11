import { NextResponse } from 'next/server';

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
  status: ReturnType<typeof readinessSummary>['status'];
  blockers: string[];
  warnings: string[];
  checks: PublicReadinessCheck[];
  timestamp: string;
};

export async function GET() {
  const readiness = readinessSummary();
  const body: ReadinessResponse = {
    ok: readiness.ok,
    service: 'urai-studio',
    type: 'readiness',
    status: readiness.status,
    blockers: readiness.blockers,
    warnings: readiness.warnings,
    checks: readiness.checks.map(({ id, required, ok }) => ({ id, required, ok })),
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: readiness.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
