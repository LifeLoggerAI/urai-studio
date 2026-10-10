#!/usr/bin/env node

import { isIP } from 'node:net';

const strict = process.env.URAI_PROVIDER_STRICT === 'true';
const configuredValue = (key) => String(process.env[key] ?? '').trim();

const providers = [
  {
    name: 'Asset Factory',
    env: ['URAI_ASSET_FACTORY_BASE_URL'],
    endpointKeys: ['URAI_ASSET_FACTORY_BASE_URL'],
    requiredFor: ['video render artifacts', 'route thumbnails', 'spatial asset handoff'],
  },
  {
    name: 'Spatial',
    env: ['URAI_SPATIAL_BASE_URL'],
    endpointKeys: ['URAI_SPATIAL_BASE_URL'],
    requiredFor: ['route capture', 'Life Map handoff', 'Replay handoff'],
  },
  {
    name: 'Analytics',
    env: ['URAI_ANALYTICS_BASE_URL'],
    endpointKeys: ['URAI_ANALYTICS_BASE_URL'],
    requiredFor: ['launch evidence metrics', 'privacy-safe product telemetry'],
  },
  {
    name: 'Content',
    env: ['URAI_CONTENT_BASE_URL'],
    endpointKeys: ['URAI_CONTENT_BASE_URL'],
    requiredFor: ['published launch copy', 'story and media metadata'],
  },
  {
    name: 'Generation Provider',
    env: ['URAI_GENERATION_PROVIDER', 'URAI_GENERATION_API_KEY'],
    endpointKeys: [],
    requiredFor: ['provider-backed media generation beyond local fallback rendering'],
  },
];

function validEndpoint(value) {
  try {
    const parsed = new URL(value);
    const host = parsed.hostname.toLowerCase();
    return parsed.protocol === 'https:' && !parsed.username && !parsed.password &&
      !parsed.search && !parsed.hash && host.includes('.') && !isIP(host) &&
      !host.startsWith('[') &&
      !/(^|\.)(localhost|local|internal|invalid|test|example)$/.test(host) &&
      !/(^|\.)example\.(com|org|net)$/.test(host);
  } catch {
    return false;
  }
}

const rows = providers.map((provider) => {
  const missing = provider.env.filter((key) => !configuredValue(key));
  const invalid = provider.endpointKeys
    .filter((key) => configuredValue(key) && !validEndpoint(configuredValue(key)))
    .map((key) => ({ key, reason: 'Public HTTPS hostname required, without inline credentials, query, or fragment.' }));
  if (provider.name === 'Generation Provider') {
    const identity = configuredValue('URAI_GENERATION_PROVIDER');
    if (identity && (!/^[a-z][a-z0-9_-]{1,63}$/i.test(identity) ||
      /^(local[-_]?proof|local|mock|test|fixture|placeholder|fallback)$/i.test(identity))) {
      invalid.push({ key: 'URAI_GENERATION_PROVIDER', reason: 'A named external provider is required; local/fallback identities do not prove provider configuration.' });
    }
  }
  const incomplete = missing.length > 0 || invalid.length > 0;
  return {
    ...provider,
    status: incomplete ? strict ? 'blocked' : missing.length ? 'not-configured' : 'invalid-configuration' : 'configured',
    missing,
    invalid,
    runtimeVerified: false,
  };
});

const payload = {
  schemaVersion: 'urai-studio-provider-configuration-2',
  checkedAt: new Date().toISOString(),
  strict,
  evidenceScope: 'configuration-only',
  configurationReady: rows.every((row) => row.status === 'configured'),
  providerRuntimeVerified: false,
  releaseReady: false,
  // Retain the legacy field without promoting untested configuration into readiness.
  ready: [],
  configured: rows.filter((row) => row.status === 'configured').map((row) => row.name),
  blocked: rows.filter((row) => row.status === 'blocked').map((row) => ({ name: row.name, missing: row.missing, invalid: row.invalid })),
  notConfigured: rows.filter((row) => row.status === 'not-configured').map((row) => ({ name: row.name, missing: row.missing })),
  invalidConfiguration: rows.filter((row) => row.status === 'invalid-configuration').map((row) => ({ name: row.name, invalid: row.invalid })),
  providers: rows,
};

console.log(JSON.stringify(payload, null, 2));

if (payload.blocked.length > 0) {
  console.error('Provider configuration failed in strict mode. Supply the missing configuration and valid endpoints. A passing configuration check does not verify provider calls or release readiness.');
  process.exit(1);
}
