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

export type BrainMapHealthState = 'unknown' | 'healthy' | 'degraded' | 'inactive' | 'blocked';

export type BrainMapSystemLayer =
  | 'core'
  | 'execution'
  | 'analytics'
  | 'generation'
  | 'content'
  | 'spatial'
  | 'studio'
  | 'communications'
  | 'external'
  | 'governance'
  | 'privacy'
  | 'operations';

export type BrainMapNode = {
  id: string;
  kind: 'repository' | 'pull-request' | 'workflow' | 'artifact' | 'provider' | 'service' | 'environment';
  label: string;
  ownerSystem: string;
  systemLayer: BrainMapSystemLayer;
  healthState: BrainMapHealthState;
  exactSha?: string;
  sourceRef: string;
  metadataRefs: string[];
  diagnosticRefs: string[];
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
  if (!node.id.trim()) throw new Error('brain_map_node_id_required');
  if (!node.label.trim()) throw new Error('brain_map_node_label_required');
  if (!node.ownerSystem.trim()) throw new Error('brain_map_owner_system_required');
  if (!node.sourceRef.trim()) throw new Error('brain_map_source_ref_required');
  if (node.evidenceState !== 'unknown' && !node.evidenceFreshnessAt) {
    throw new Error('brain_map_evidence_timestamp_required');
  }
  if (node.evidenceFreshnessAt && Number.isNaN(Date.parse(node.evidenceFreshnessAt))) {
    throw new Error('brain_map_evidence_timestamp_invalid');
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
  const nodeIds = new Set<string>();
  for (const node of nodes) {
    validateBrainMapNode(node);
    if (nodeIds.has(node.id)) throw new Error('brain_map_duplicate_node');
    nodeIds.add(node.id);
  }
  for (const edge of edges) {
    if (!edge.sourceRef.trim()) throw new Error('brain_map_edge_source_ref_required');
    if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) throw new Error('brain_map_edge_node_missing');
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

export function filterBrainMapNodes(
  nodes: BrainMapNode[],
  filter: {
    query?: string;
    layers?: BrainMapSystemLayer[];
    healthStates?: BrainMapHealthState[];
  },
) {
  const query = filter.query?.trim().toLowerCase();
  return nodes.filter((node) => {
    if (filter.layers?.length && !filter.layers.includes(node.systemLayer)) return false;
    if (filter.healthStates?.length && !filter.healthStates.includes(node.healthState)) return false;
    if (!query) return true;
    return [node.id, node.label, node.ownerSystem, node.systemLayer, node.healthState]
      .some((value) => value.toLowerCase().includes(query));
  });
}
