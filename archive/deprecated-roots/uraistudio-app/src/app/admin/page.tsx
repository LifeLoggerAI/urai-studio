"use client";

import { useCollection } from "react-firebase-hooks/firestore";
import { getFirestore, collection } from "firebase/firestore";

export default function AdminPage() {
  const db = getFirestore();
  const [jobs, jobsLoading, jobsError] = useCollection(collection(db, "jobs"));
  const [auditLogs, auditLogsLoading, auditLogsError] = useCollection(collection(db, "auditLogs"));

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin</h1>

      <h2 className="text-xl font-bold mt-8">Job Queue</h2>
      {jobsLoading && <div>Loading jobs...</div>}
      {jobsError && <div>Error loading jobs: {jobsError.message}</div>}
      <ul>
        {jobs?.docs.map((doc) => (
          <li key={doc.id}>
            {doc.id} - {doc.data().type} - {doc.data().status}
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-bold mt-8">Audit Logs</h2>
      {auditLogsLoading && <div>Loading audit logs...</div>}
      {auditLogsError && <div>Error loading audit logs: {auditLogsError.message}</div>}
      <ul>
        {auditLogs?.docs.map((doc) => (
          <li key={doc.id}>
            {doc.data().actorRole}:{doc.data().action} on {doc.data().targetType}:{doc.data().targetId}
          </li>
        ))}
      </ul>
    </div>
  );
}
