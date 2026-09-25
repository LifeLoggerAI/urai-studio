import {
  evaluateCutOneBoardReadiness,
  type CutOneProductionBoard,
  type CutOneRecord,
} from '@/lib/studio/cut-one';

export function CutOneControlPanel({
  records = [],
  board,
}: {
  records?: CutOneRecord[];
  board?: CutOneProductionBoard;
}) {
  const readiness = board ? evaluateCutOneBoardReadiness(board) : null;

  return (
    <section
      aria-labelledby="cut-one-control-title"
      data-provider-execution-authorized="false"
      data-public-release-authorized="false"
    >
      <h2 id="cut-one-control-title">Cut One production command center</h2>
      <p>
        Provider execution and public release remain disabled. This surface reports source-backed production,
        approval, export, staging and release readiness only.
      </p>

      {board ? (
        <>
          <dl>
            <dt>Production</dt><dd>{board.productionId}</dd>
            <dt>Source authorities</dt><dd>{board.sourceAuthorityRefs.length}</dd>
            <dt>Script trackers</dt><dd>{board.scriptTrackerRefs.length}</dd>
            <dt>Asset trackers</dt><dd>{board.assetTrackerRefs.length}</dd>
            <dt>Approval trackers</dt><dd>{board.approvalTrackerRefs.length}</dd>
            <dt>Export trackers</dt><dd>{board.exportTrackerRefs.length}</dd>
            <dt>Staging checklists</dt><dd>{board.stagingChecklistRefs.length}</dd>
            <dt>Release checklists</dt><dd>{board.releaseChecklistRefs.length}</dd>
            <dt>Source readiness</dt><dd>{readiness?.sourceReady ? 'ready' : 'blocked'}</dd>
          </dl>

          <table>
            <caption>Cut One canonical scene production board</caption>
            <thead>
              <tr>
                <th scope="col">Scene</th>
                <th scope="col">State</th>
                <th scope="col">Source</th>
                <th scope="col">Script</th>
                <th scope="col">Assets</th>
                <th scope="col">Approvals</th>
                <th scope="col">Exports</th>
                <th scope="col">Staging</th>
                <th scope="col">Release</th>
                <th scope="col">Product proof</th>
              </tr>
            </thead>
            <tbody>
              {board.scenes.map((scene) => (
                <tr key={scene.id}>
                  <td>{scene.title}</td>
                  <td>{scene.state}</td>
                  <td>{scene.sourceAuthorityRefs.length}</td>
                  <td>{scene.scriptRefs.length}</td>
                  <td>{scene.assetRefs.length}</td>
                  <td>{scene.approvalRefs.length}</td>
                  <td>{scene.exportRefs.length}</td>
                  <td>{scene.stagingEvidenceRefs.length}</td>
                  <td>{scene.releaseEvidenceRefs.length}</td>
                  <td>{scene.productProofRef ? 'linked' : 'missing'}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <h3>Readiness blockers</h3>
          {readiness?.blockers.length ? (
            <ul>
              {readiness.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
            </ul>
          ) : (
            <p>No source-readiness blockers recorded. Activation remains separately unauthorized.</p>
          )}
        </>
      ) : null}

      {records.length ? (
        <>
          <h3>Stage evidence records</h3>
          <ol>
            {records.map((record) => (
              <li key={record.id}>
                <strong>{record.stage}</strong> — {record.state}
                <span> · source authorities {record.sourceAuthorityRefs.length}</span>
                <span> · approvals {record.approvalRefs.length}</span>
                <span> · exports {record.exportRefs.length}</span>
                <span> · staging receipts {record.stagingEvidenceRefs.length}</span>
                <span> · release receipts {record.releaseEvidenceRefs.length}</span>
              </li>
            ))}
          </ol>
        </>
      ) : null}
    </section>
  );
}
