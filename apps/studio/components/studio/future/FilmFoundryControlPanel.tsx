import {
  filmFoundryAdvanceBlockers,
  filmFoundryCanAdvance,
  type FilmFoundryControlRecord,
} from '@/lib/studio/film-foundry';

export function FilmFoundryControlPanel({ records }: { records: FilmFoundryControlRecord[] }) {
  return (
    <section
      aria-labelledby="film-foundry-control-title"
      data-provider-spend-authorized="false"
      data-public-release-authorized="false"
    >
      <h2 id="film-foundry-control-title">Film Foundry control plane</h2>
      <p>
        Execution remains hard-off. This view reports canon, consent, continuity, factual confidence, rights,
        accessibility, cost, evidence, render and release state without authorizing provider spend or publication.
      </p>
      <table>
        <caption>Film Foundry governed production phases</caption>
        <thead>
          <tr>
            <th scope="col">Phase</th>
            <th scope="col">State</th>
            <th scope="col">Canon</th>
            <th scope="col">Consent</th>
            <th scope="col">Continuity</th>
            <th scope="col">Factual confidence</th>
            <th scope="col">Rights</th>
            <th scope="col">Accessibility</th>
            <th scope="col">Cost</th>
            <th scope="col">Versions</th>
            <th scope="col">Reviews</th>
            <th scope="col">Approvals</th>
            <th scope="col">Evidence</th>
            <th scope="col">Blockers</th>
            <th scope="col">Render</th>
            <th scope="col">Master</th>
            <th scope="col">Release</th>
            <th scope="col">Advance</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record) => {
            const blockers = filmFoundryAdvanceBlockers(record);
            return (
              <tr key={`${record.productionId}:${record.phase}:${record.shotId ?? 'phase'}`}>
                <td>{record.phase}</td>
                <td>{record.state}</td>
                <td>{record.canonState}</td>
                <td>{record.consentState}</td>
                <td>{record.continuityState}</td>
                <td>{record.factualConfidenceState}</td>
                <td>{record.rightsState}</td>
                <td>{record.accessibilityState}</td>
                <td>{record.costState}</td>
                <td>{record.versionRefs.length}</td>
                <td>{record.reviewRefs.length}</td>
                <td>{record.approvalRefs.length}</td>
                <td>{record.evidenceRefs.length}</td>
                <td title={blockers.join(', ')}>{blockers.length}</td>
                <td>{record.renderState}</td>
                <td>{record.masterState}</td>
                <td>{record.releaseState}</td>
                <td>{filmFoundryCanAdvance(record) ? 'source-ready' : 'blocked'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p>
        A source-ready phase still does not authorize provider spend, deployment, mastering, or public release.
      </p>
    </section>
  );
}
