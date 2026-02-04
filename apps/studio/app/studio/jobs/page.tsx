
import { listJobs } from "@/lib/firestoreStudio";

export default async function JobsPage() {
  const jobs = await listJobs();

  return (
    <div>
      <h1>Jobs</h1>
      <table>
        <thead>
          <tr>
            <th>Job ID</th>
            <th>Status</th>
            <th>Created At</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job: any) => (
            <tr key={job.jobId}>
              <td>{job.jobId}</td>
              <td>{job.status}</td>
              <td>{new Date(job.createdAt.seconds * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
