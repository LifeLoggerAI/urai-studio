
'use client';

import { useEffect, useState } from 'react';
import { getJob } from '../../../../../lib/firestoreStudio';
import { StatusBadge } from '../../../../../components/StatusBadge';
import { ReplayButton } from '../../../../../components/studio/ReplayButton';
import { notFound } from 'next/navigation';

export async function generateStaticParams() {
  return [{ id: 'demo-job' }];
}

export default function JobDetailPage({ params }: { params: { id: string } }) {
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      getJob(params.id)
        .then((jobData) => {
          if (jobData) {
            setJob(jobData);
          } else {
            notFound();
          }
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!job) {
    return notFound();
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{job.title}</h1>
        <StatusBadge status={job.status} />
      </div>
      <div className="mb-4">
        <p><strong>Kind:</strong> {job.kind}</p>
        <p><strong>Progress:</strong> {job.progress * 100}%</p>
        <p><strong>Created At:</strong> {new Date(job.createdAt.seconds * 1000).toLocaleString()}</p>
        <p><strong>Updated At:</strong> {new Date(job.updatedAt.seconds * 1000).toLocaleString()}</p>
      </div>
      <div className="mb-4">
        <h2 className="text-xl font-bold">Input</h2>
        <pre className="bg-gray-100 p-4 rounded-md">{JSON.stringify(job.input, null, 2)}</pre>
      </div>
      {job.output && (
        <div className="mb-4">
          <h2 className="text-xl font-bold">Output</h2>
          <pre className="bg-gray-100 p-4 rounded-md">{JSON.stringify(job.output, null, 2)}</pre>
        </div>
      )}
      {job.logs && (
        <div>
          <h2 className="text-xl font-bold">Logs</h2>
          <div className="bg-gray-100 p-4 rounded-md">
            {job.logs.map((log: any, index: number) => (
              <div key={index} className={`text-${log.level === 'error' ? 'red' : log.level === 'warn' ? 'yellow' : 'green'}-500`}>
                <span>{new Date(log.t).toLocaleString()}</span> - <span>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <ReplayButton jobId={params.id} />
      </div>
    </div>
  );
}
