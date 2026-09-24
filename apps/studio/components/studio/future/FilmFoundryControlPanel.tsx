import type { FilmFoundryControlRecord } from '@/lib/studio/film-foundry';

export function FilmFoundryControlPanel({ records }: { records: FilmFoundryControlRecord[] }) {
  return (
    <section aria-labelledby="film-foundry-control-title">
      <h2 id="film-foundry-control-title">Film Foundry control plane</h2>
      <p>Execution remains hard-off. This view represents source, review, rights, accessibility, cost and evidence state only.</p>
      <table>
        <caption>Film Foundry phase evidence</caption>
        <thead>
          <tr>
            <th scope="col">Phase</th>
            <th scope="col">State</th>
            <th scope="col">Rights</th>
            <th scope="col">Accessibility</th>
            <th scope="col">Cost</th>
            <th scope="col">Render</th>
            <th scope="col">Master</th>
            <th scope="col">Release</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => (
            <tr key={`${record.productionId}:${record.phase}:${record.shotId ?? 'phase'}`}>
              <td>{record.phase}</td>
              <td>{record.state}</td>
              <td>{record.rightsState}</td>
              <td>{record.accessibilityState}</td>
              <td>{record.costState}</td>
              <td>{record.renderState}</td>
              <td>{record.masterState}</td>
              <td>{record.releaseState}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
