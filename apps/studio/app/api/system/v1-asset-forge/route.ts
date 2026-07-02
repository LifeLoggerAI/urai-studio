import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const repository = process.env.URAI_ASSET_FACTORY_REPO || 'LifeLoggerAI/asset-factory';
const workflowName = 'V1 AAA Asset Forge';

function bearer(request: NextRequest): string {
  const value = request.headers.get('authorization') || '';
  return value.startsWith('Bearer ') ? value.slice(7) : '';
}

function authorized(request: NextRequest): boolean {
  const expected = process.env.URAI_STUDIO_CONTROL_TOKEN || '';
  const actual = bearer(request);
  return Boolean(expected && actual && expected === actual);
}

function githubHeaders(): HeadersInit {
  const token = process.env.URAI_WHEEL_GITHUB_TOKEN || '';
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
    'User-Agent': 'urai-studio-control-plane',
  };
}

export async function GET() {
  const token = process.env.URAI_WHEEL_GITHUB_TOKEN || '';
  const configured = {
    githubToken: Boolean(token),
    controlToken: Boolean(process.env.URAI_STUDIO_CONTROL_TOKEN),
    rendererEndpoint: Boolean(process.env.ASSET_RENDERER_ENDPOINT),
  };

  if (!token) {
    return NextResponse.json(
      { ok: false, service: 'v1-asset-forge', repository, workflowName, configured, latest: null },
      { status: 503 },
    );
  }

  const response = await fetch(
    `https://api.github.com/repos/${repository}/actions/workflows/v1-aaa-asset-forge.yml/runs?per_page=1`,
    { headers: githubHeaders(), cache: 'no-store' },
  );
  const payload = response.ok ? await response.json() : null;
  const run = payload?.workflow_runs?.[0];

  return NextResponse.json({
    ok: response.ok,
    service: 'v1-asset-forge',
    repository,
    workflowName,
    configured,
    latest: run
      ? {
          id: run.id,
          status: run.status,
          conclusion: run.conclusion,
          createdAt: run.created_at,
          updatedAt: run.updated_at,
          url: run.html_url,
          headSha: run.head_sha,
        }
      : null,
  }, { status: response.ok ? 200 : response.status });
}

export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const githubToken = process.env.URAI_WHEEL_GITHUB_TOKEN || '';
  if (!githubToken) {
    return NextResponse.json({ ok: false, error: 'URAI_WHEEL_GITHUB_TOKEN is not configured' }, { status: 503 });
  }

  let body: { rounds?: number; requestId?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const rounds = Math.max(1, Math.min(5, Number(body.rounds || 3)));
  const requestId = body.requestId || `studio-${Date.now()}`;

  const response = await fetch(`https://api.github.com/repos/${repository}/dispatches`, {
    method: 'POST',
    headers: githubHeaders(),
    body: JSON.stringify({
      event_type: 'urai-v1-forge-requested',
      client_payload: {
        job_id: requestId,
        correlation_id: requestId,
        operation: 'asset.forge.v1',
        rounds: String(rounds),
        callback_url: '',
        origin: 'URAI_STUDIO',
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return NextResponse.json(
      { ok: false, error: `GitHub dispatch failed: ${response.status}`, detail: detail.slice(0, 1000) },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    accepted: true,
    status: 'QUEUED',
    requestId,
    rounds,
    repository,
    workflowName,
  }, { status: 202 });
}
