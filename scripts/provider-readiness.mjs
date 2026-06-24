#!/usr/bin/env node

const strict = process.env.URAI_PROVIDER_STRICT === 'true';

const providers = [
  {
    name: 'Asset Factory',
    env: ['URAI_ASSET_FACTORY_BASE_URL'],
    requiredFor: ['video render artifacts', 'route thumbnails', 'spatial asset handoff'],
  },
  {
    name: 'Spatial',
    env: ['URAI_SPATIAL_BASE_URL'],
    requiredFor: ['route capture', 'Life Map handoff', 'Replay handoff'],
  },
  {
    name: 'Analytics',
    env: ['URAI_ANALYTICS_BASE_URL'],
    requiredFor: ['launch evidence metrics', 'privacy-safe product telemetry'],
  },
  {
    name: 'Content',
    env: ['URAI_CONTENT_BASE_URL'],
    requiredFor: ['published launch copy', 'story and media metadata'],
  },
  {
    name: 'Generation Provider',
    env: ['URAI_GENERATION_PROVIDER', 'URAI_GENERATION_API_KEY'],
    requiredFor: ['provider-backed media generation beyond local fallback rendering'],
  },
];

const rows = providers.map((provider) => {
  const missing = provider.env.filter((key) => !process.env[key]);
  return {
    ...provider,
    status: missing.length === 0 ? 'ready' : strict ? 'blocked' : 'not-configured',
    missing,
  };
});

const payload = {
  checkedAt: new Date().toISOString(),
  strict,
  ready: rows.filter((row) => row.status === 'ready').map((row) => row.name),
  blocked: rows.filter((row) => row.status === 'blocked').map((row) => ({ name: row.name, missing: row.missing })),
  notConfigured: rows.filter((row) => row.status === 'not-configured').map((row) => ({ name: row.name, missing: row.missing })),
  providers: rows,
};

console.log(JSON.stringify(payload, null, 2));

if (payload.blocked.length > 0) {
  console.error('Provider readiness failed in strict mode. Set the missing environment variables or run without URAI_PROVIDER_STRICT=true for local fallback checks.');
  process.exit(1);
}
