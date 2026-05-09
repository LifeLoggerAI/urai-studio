import { NextResponse } from 'next/server';
import { readinessSummary } from '@/lib/studio/status';

export async function GET() {
  const readiness = readinessSummary();

  return NextResponse.json(
    {
      ok: readiness.ok,
      service: 'urai-studio',
      type: 'readiness',
      status: readiness.status,
      blockers: readiness.blockers,
      warnings: readiness.warnings,
      checks: readiness.checks,
      timestamp: new Date().toISOString(),
    },
    { status: readiness.ok ? 200 : 503 },
  );
}
