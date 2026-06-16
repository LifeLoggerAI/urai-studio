'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function JobStatusPage({ params }: { params: { jobId: string } }) {
  const { jobId } = params;
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    if (!jobId) return;

    const unsub = onSnapshot(doc(db, "studioJobs", jobId as string), (doc) => {
      if (doc.exists()) {
        setJob({ id: doc.id, ...doc.data() });
      } else {
        setJob(null);
      }
    });

    return () => unsub();
  }, [jobId]);

  if (!job) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Job Status</h1>
      <p>Job ID: {job.id}</p>
      <p>Status: {job.status}</p>
      {job.outputUrl && (
        <p>
          Output: <a href={job.outputUrl}>Download</a>
        </p>
      )}
    </div>
  );
}
