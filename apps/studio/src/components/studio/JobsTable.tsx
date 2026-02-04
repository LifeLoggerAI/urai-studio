
'use client';

import Link from 'next/link';

export default function JobsTable({ jobs }: { jobs: any[] }) {
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">No jobs found</h2>
        <p className="text-gray-500 mt-2">Create a demo job to get started.</p>
        <button
          onClick={() => {
            // Action to create a demo job
          }}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Create Demo Job
        </button>
      </div>
    );
  }

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job ID</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kind</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {jobs.map((job) => (
          <tr key={job.jobId}>
            <td className="px-6 py-4 whitespace-nowrap">
              <Link href={`/studio/jobs/${job.jobId}`} className="text-blue-500 hover:underline">
                {job.jobId}
              </Link>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">{job.title}</td>
            <td className="px-6 py-4 whitespace-nowrap">{job.kind}</td>
            <td className="px-6 py-4 whitespace-nowrap">{job.status}</td>
            <td className="px-6 py-4 whitespace-nowrap">{new Date(job.createdAt._seconds * 1000).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
