'use client';

import { useMemo, useState } from 'react';

import {
  filterBrainMapNodes,
  type BrainMapEdge,
  type BrainMapHealthState,
  type BrainMapNode,
  type BrainMapSystemLayer,
} from '@/lib/studio/brain-map';

const layers: BrainMapSystemLayer[] = [
  'core',
  'execution',
  'analytics',
  'generation',
  'content',
  'spatial',
  'studio',
  'communications',
  'external',
  'governance',
  'privacy',
  'operations',
];

const healthStates: BrainMapHealthState[] = ['unknown', 'healthy', 'degraded', 'inactive', 'blocked'];

function repoHref(node: BrainMapNode): string | null {
  const github = node.sourceRef.match(/^github:([^/]+)\/(.+)$/i);
  return github ? `https://github.com/${github[1]}/${github[2]}` : null;
}

function graphPosition(index: number, count: number) {
  const radius = 36;
  const angle = count <= 1 ? 0 : (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: 50 + Math.cos(angle) * radius,
    y: 50 + Math.sin(angle) * radius,
  };
}

export function BrainMapEvidenceList({ nodes, edges }: { nodes: BrainMapNode[]; edges: BrainMapEdge[] }) {
  const [query, setQuery] = useState('');
  const [layer, setLayer] = useState<BrainMapSystemLayer | 'all'>('all');
  const [health, setHealth] = useState<BrainMapHealthState | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(nodes[0]?.id ?? null);

  const filtered = useMemo(
    () =>
      filterBrainMapNodes(nodes, {
        query,
        layers: layer === 'all' ? undefined : [layer],
        healthStates: health === 'all' ? undefined : [health],
      }),
    [nodes, query, layer, health],
  );

  const visibleIds = useMemo(() => new Set(filtered.map((node) => node.id)), [filtered]);
  const visibleEdges = useMemo(
    () => edges.filter((edge) => visibleIds.has(edge.from) && visibleIds.has(edge.to)),
    [edges, visibleIds],
  );
  const positions = useMemo(
    () => new Map(filtered.map((node, index) => [node.id, graphPosition(index, filtered.length)])),
    [filtered],
  );
  const selected = nodes.find((node) => node.id === selectedId) ?? filtered[0] ?? null;

  return (
    <section aria-labelledby="brain-map-evidence-title" data-brain-map-activation-authorized="false">
      <h2 id="brain-map-evidence-title">Brain Map evidence cockpit</h2>
      <p>
        This private, evidence-backed system graph never authorizes activation. No raw memories, private text, health
        data, precise location, secrets or provider credentials belong here.
      </p>

      <fieldset>
        <legend>Filter system evidence</legend>
        <label>
          Search
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search repository, system, layer or health"
          />
        </label>
        <label>
          System layer
          <select value={layer} onChange={(event) => setLayer(event.target.value as BrainMapSystemLayer | 'all')}>
            <option value="all">All layers</option>
            {layers.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        <label>
          Health
          <select value={health} onChange={(event) => setHealth(event.target.value as BrainMapHealthState | 'all')}>
            <option value="all">All health states</option>
            {healthStates.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
      </fieldset>

      <p role="status" aria-live="polite">
        Showing {filtered.length} of {nodes.length} evidence nodes.
      </p>

      <div aria-label="Interactive Brain Map system graph">
        <svg viewBox="0 0 100 100" role="img" aria-labelledby="brain-map-graph-title brain-map-graph-desc">
          <title id="brain-map-graph-title">URAI system evidence graph</title>
          <desc id="brain-map-graph-desc">
            Evidence-backed repositories, workflows, services and environments connected by documented dependencies.
            Use the accessible list below for the complete non-visual equivalent.
          </desc>
          {visibleEdges.map((edge, index) => {
            const from = positions.get(edge.from);
            const to = positions.get(edge.to);
            if (!from || !to) return null;
            return (
              <line
                key={`${edge.from}:${edge.relationship}:${edge.to}:${index}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="currentColor"
                strokeOpacity="0.35"
                strokeWidth="0.35"
              />
            );
          })}
          {filtered.map((node) => {
            const position = positions.get(node.id) ?? { x: 50, y: 50 };
            const selectedNode = selected?.id === node.id;
            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-label={`${node.label}, ${node.healthState}, ${node.evidenceState}`}
                onClick={() => setSelectedId(node.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedId(node.id);
                  }
                }}
              >
                <circle
                  cx={position.x}
                  cy={position.y}
                  r={selectedNode ? 4.2 : 3.2}
                  fill="currentColor"
                  fillOpacity={selectedNode ? 0.95 : 0.6}
                />
                <text x={position.x} y={position.y + 6} textAnchor="middle" fontSize="2.4" fill="currentColor">
                  {node.label.slice(0, 22)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {selected ? (
        <aside aria-labelledby="brain-map-node-detail-title">
          <h3 id="brain-map-node-detail-title">{selected.label}</h3>
          <dl>
            <dt>Owner system</dt><dd>{selected.ownerSystem}</dd>
            <dt>Layer</dt><dd>{selected.systemLayer}</dd>
            <dt>Health</dt><dd>{selected.healthState}</dd>
            <dt>Evidence</dt><dd>{selected.evidenceState}</dd>
            <dt>Exact SHA</dt><dd><code>{selected.exactSha ?? 'not applicable'}</code></dd>
            <dt>Evidence freshness</dt><dd>{selected.evidenceFreshnessAt || 'not recorded'}</dd>
            <dt>Receipts</dt><dd>{selected.evidenceRefs.length}</dd>
            <dt>Diagnostics</dt><dd>{selected.diagnosticRefs.length}</dd>
            <dt>Blockers</dt><dd>{selected.blockerRefs.length}</dd>
          </dl>
          {repoHref(selected) ? (
            <a href={repoHref(selected) ?? undefined} target="_blank" rel="noreferrer">
              Open repository
            </a>
          ) : null}
        </aside>
      ) : null}

      <h3>Accessible list of evidence nodes</h3>
      <table>
        <caption>Filtered system evidence nodes</caption>
        <thead>
          <tr>
            <th scope="col">System</th>
            <th scope="col">Kind</th>
            <th scope="col">Layer</th>
            <th scope="col">Health</th>
            <th scope="col">Evidence state</th>
            <th scope="col">Exact SHA</th>
            <th scope="col">Evidence receipts</th>
            <th scope="col">Blockers</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((node) => (
            <tr key={node.id}>
              <td>
                <button type="button" onClick={() => setSelectedId(node.id)}>{node.label}</button>
              </td>
              <td>{node.kind}</td>
              <td>{node.systemLayer}</td>
              <td>{node.healthState}</td>
              <td>{node.evidenceState}</td>
              <td><code>{node.exactSha ?? 'not applicable'}</code></td>
              <td>{node.evidenceRefs.length}</td>
              <td>{node.blockerRefs.length}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3>Filtered dependencies</h3>
      <ul>
        {visibleEdges.map((edge, index) => (
          <li key={`${edge.from}:${edge.relationship}:${edge.to}:${index}`}>
            {edge.from} {edge.relationship} {edge.to}
          </li>
        ))}
      </ul>
    </section>
  );
}
