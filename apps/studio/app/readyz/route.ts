import { NextResponse } from 'next/server';

import { readinessSummary } from '@/lib/studio/status';

export const dynamic = 'force-dynamic';

type ReadinessResponse = {
  ok: boolean;
  service: 'urai-studio';
  type: 'readiness';
  status: ReturnType<typeof readinessSummary>['status'];
  blockers: string[];
  warnings: string[];
  checks: ReturnType<typeof readinessSummary>['checks'];
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
    checks: readiness.checks,
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: readiness.ok ? 200 : 503,
    headers: {
      'Cache-Control': 'no-store, max-age=0',
    },
  });
}
