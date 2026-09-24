export type BrainMapEvidenceState =
  | 'unknown'
  | 'source-only'
  | 'machine-green'
  | 'reviewed'
  | 'merged'
  | 'deployed'
  | 'live-verified'
  | 'blocked'
  | 'superseded';

export type BrainMapNode = {
  id: string;
  kind: 'repository' | 'pull-request' | 'workflow' | 'artifact' | 'provider' | 'service' | 'environment';
  label: string;
  ownerSystem: string;
  exactSha?: string;
  sourceRef: string;
  evidenceRefs: string[];
  evidenceState: BrainMapEvidenceState;
  evidenceFreshnessAt: string;
  blockerRefs: string[];
  supersededBy?: string;
};

export type BrainMapEdge = {
  from: string;
  to: string;
  relationship: 'depends-on' | 'produces' | 'consumes' | 'proves' | 'supersedes' | 'deploys';
  sourceRef: string;
};

export type BrainMapPrivateCockpit = {
  schemaVersion: 1;
  visibility: 'private-internal';
  nodes: BrainMapNode[];
  edges: BrainMapEdge[];
  rawMemoriesAllowed: false;
  privateTextAllowed: false;
  healthDataAllowed: false;
  preciseLocationAllowed: false;
  secretsAllowed: false;
  providerCredentialsAllowed: false;
  accessibleListEquivalentRequired: true;
  activationAuthorized: false;
};

const SHA_BOUND_STATES = new Set<BrainMapEvidenceState>([
  'machine-green',
  'reviewed',
  'merged',
  'deployed',
  'live-verified',
]);

const RECEIPT_BOUND_STATES = new Set<BrainMapEvidenceState>([
  'machine-green',
  'reviewed',
  'merged',
  'deployed',
  'live-verified',
]);

export function validateBrainMapNode(node: BrainMapNode) {
  if (!node.sourceRef) throw new Error('brain_map_source_ref_required');
  if (node.evidenceState !== 'unknown' && !node.evidenceFreshnessAt) {
    throw new Error('brain_map_evidence_timestamp_required');
  }
  if (SHA_BOUND_STATES.has(node.evidenceState) && !/^[a-f0-9]{40}$/i.test(node.exactSha ?? '')) {
    throw new Error('brain_map_exact_sha_required');
  }
  if (RECEIPT_BOUND_STATES.has(node.evidenceState) && node.evidenceRefs.length === 0) {
    throw new Error('brain_map_evidence_receipt_required');
  }
  if (node.evidenceState === 'live-verified' && !node.evidenceRefs.some((ref) => ref.includes('live'))) {
    throw new Error('brain_map_live_receipt_required');
  }
  if (node.evidenceState === 'reviewed' && !node.evidenceRefs.some((ref) => ref.includes('review'))) {
    throw new Error('brain_map_review_receipt_required');
  }
  return node;
}

export function createBrainMapCockpit(nodes: BrainMapNode[], edges: BrainMapEdge[]): BrainMapPrivateCockpit {
  for (const node of nodes) {
    validateBrainMapNode(node);
  }
  return {
    schemaVersion: 1,
    visibility: 'private-internal',
    nodes,
    edges,
    rawMemoriesAllowed: false,
    privateTextAllowed: false,
    healthDataAllowed: false,
    preciseLocationAllowed: false,
    secretsAllowed: false,
    providerCredentialsAllowed: false,
    accessibleListEquivalentRequired: true,
    activationAuthorized: false,
  };
}
