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

export function createBrainMapCockpit(nodes: BrainMapNode[], edges: BrainMapEdge[]): BrainMapPrivateCockpit {
  for (const node of nodes) {
    if (!node.sourceRef) throw new Error('brain_map_source_ref_required');
    if (node.evidenceState !== 'unknown' && !node.evidenceFreshnessAt) throw new Error('brain_map_evidence_timestamp_required');
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
