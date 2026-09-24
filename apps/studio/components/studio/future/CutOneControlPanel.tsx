import type { CutOneRecord } from '@/lib/studio/cut-one';

export function CutOneControlPanel({ records }: { records: CutOneRecord[] }) {
  return (
    <section aria-labelledby="cut-one-control-title">
      <h2 id="cut-one-control-title">Cut One production control</h2>
      <p>Provider execution and public release remain disabled. The control view only reports evidence-backed production state.</p>
      <ol>
        {records.map((record) => (
          <li key={record.id}>
            <strong>{record.stage}</strong> — {record.state}
            <span> · source authorities {record.sourceAuthorityRefs.length}</span>
            <span> · approvals {record.approvalRefs.length}</span>
            <span> · staging receipts {record.stagingEvidenceRefs.length}</span>
            <span> · release receipts {record.releaseEvidenceRefs.length}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
