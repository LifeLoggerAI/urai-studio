import type { BrainMapEdge, BrainMapNode } from '@/lib/studio/brain-map';

export function BrainMapEvidenceList({ nodes, edges }: { nodes: BrainMapNode[]; edges: BrainMapEdge[] }) {
  return (
    <section aria-labelledby="brain-map-evidence-title">
      <h2 id="brain-map-evidence-title">Brain Map evidence list</h2>
      <p>This accessible list is the required non-graph equivalent. No raw memories, private text, health data, precise location, secrets or provider credentials belong here.</p>
      <table>
        <caption>System evidence nodes</caption>
        <thead>
          <tr>
            <th scope="col">System</th>
            <th scope="col">Kind</th>
            <th scope="col">Evidence state</th>
            <th scope="col">Exact SHA</th>
            <th scope="col">Evidence receipts</th>
            <th scope="col">Blockers</th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr key={node.id}>
              <td>{node.label}</td>
              <td>{node.kind}</td>
              <td>{node.evidenceState}</td>
              <td><code>{node.exactSha ?? 'not applicable'}</code></td>
              <td>{node.evidenceRefs.length}</td>
              <td>{node.blockerRefs.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <h3>Dependencies</h3>
      <ul>
        {edges.map((edge, index) => (
          <li key={`${edge.from}:${edge.relationship}:${edge.to}:${index}`}>
            {edge.from} {edge.relationship} {edge.to}
          </li>
        ))}
      </ul>
    </section>
  );
}
