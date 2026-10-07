import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const spatialRepository = 'LifeLoggerAI/urai-spatial';
export const spatialOwnerPr = 1636;
const exactSha = /^[a-f0-9]{40}$/;

export function assertCurrentSpatialOwner(pr, expectedSha) {
  if (!exactSha.test(String(expectedSha || ''))) throw new Error('spatial_expected_source_invalid');
  if (pr?.number !== spatialOwnerPr || pr?.state !== 'open' || pr?.merged === true
    || pr?.base?.repo?.full_name !== spatialRepository || pr?.head?.repo?.full_name !== spatialRepository) {
    throw new Error('spatial_current_owner_invalid');
  }
  if (!exactSha.test(String(pr.head.sha || '')) || pr.head.sha !== expectedSha) {
    throw new Error('spatial_current_owner_source_changed');
  }
  return { repository: spatialRepository, prNumber: spatialOwnerPr, sourceSha: expectedSha };
}

export async function verifyCurrentSpatialOwner({ expectedSha, studioSha, token = '', fetchImpl = fetch } = {}) {
  if (!exactSha.test(String(expectedSha || '')) || !exactSha.test(String(studioSha || ''))) {
    throw new Error('video_exact_source_invalid');
  }
  const signal = AbortSignal.timeout(10_000);
  const response = await fetchImpl(`https://api.github.com/repos/${spatialRepository}/pulls/${spatialOwnerPr}`, {
    method: 'GET', redirect: 'error', cache: 'no-store', signal,
    headers: { accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28',
      ...(token ? { authorization: `Bearer ${token}` } : {}) },
  }).catch(() => { throw new Error('spatial_current_owner_read_unavailable'); });
  if (!response.ok) throw new Error('spatial_current_owner_read_unavailable');
  let body;
  try {
    if (!response.body) throw new Error();
    const reader = response.body.getReader(), chunks = [];
    let bytes = 0;
    const abort = () => { reader.cancel().catch(() => {}); };
    signal.addEventListener('abort', abort, { once: true });
    try {
      while (true) {
        if (signal.aborted) throw new Error();
        const next = await reader.read();
        if (signal.aborted) throw new Error();
        if (next.done) break;
        bytes += next.value.byteLength;
        if (bytes > 1_048_576) { await reader.cancel(); throw new Error(); }
        chunks.push(next.value);
      }
      body = Buffer.concat(chunks, bytes).toString('utf8');
    } finally { signal.removeEventListener('abort', abort); reader.releaseLock(); }
  } catch { throw new Error('spatial_current_owner_response_invalid'); }
  let pr;
  try { pr = JSON.parse(body); } catch { throw new Error('spatial_current_owner_response_invalid'); }
  return {
    schemaVersion: 'urai-studio-video-current-source-binding-v1',
    status: 'EXACT_CURRENT_SOURCE_BINDING_ONLY',
    checkedAt: new Date().toISOString(),
    studioSourceSha: studioSha,
    spatial: assertCurrentSpatialOwner(pr, expectedSha),
    independentReviewAccepted: false,
    visualAccepted: false,
    deviceAccepted: false,
    productionVerified: false,
    goldenMaster: false,
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  try {
    const receipt = await verifyCurrentSpatialOwner({
      expectedSha: process.env.URAI_SPATIAL_EXPECTED_SHA,
      studioSha: process.env.URAI_EXACT_HEAD,
      token: process.env.GITHUB_TOKEN,
    });
    process.stdout.write(JSON.stringify(receipt, null, 2) + '\n');
  } catch (error) {
    process.stderr.write((error instanceof Error ? error.message : 'video_source_binding_failed') + '\n');
    process.exitCode = 1;
  }
}
