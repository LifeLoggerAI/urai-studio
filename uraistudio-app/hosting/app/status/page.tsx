'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function StatusPage() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get('jobId');
  const [job, setJob] = useState(null);

  useEffect(() => {
    if (jobId) {
      // TODO: Fetch job status from the API
      fetch(`/api/jobs/${jobId}`)
        .then(res => res.json())
        .then(data => setJob(data));
    }
  }, [jobId]);

  if (!job) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Job Status</h1>
      <p>Job ID: {jobId}</p>
      <p>Status: {job.status}</p>
    </div>
  );
}
