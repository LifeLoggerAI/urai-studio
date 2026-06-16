'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';

export default function JobsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { projectId } = params;
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && projectId) {
      const q = query(
        collection(db, 'studioJobs'),
        where('uid', '==', user.uid),
        where('projectId', '==', projectId)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const jobsData = [];
        querySnapshot.forEach((doc) => {
          jobsData.push({ id: doc.id, ...doc.data() });
        });
        setJobs(jobsData);
      });
      return () => unsubscribe();
    }
  }, [user, projectId]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Render Jobs</h1>
      <ul>
        {jobs.map((job) => (
          <li key={job.id} className="mb-2 p-2 border rounded">
            <p className="font-bold">Job ID: {job.id}</p>
            <p>Status: {job.status}</p>
            <p>Created At: {new Date(job.createdAt?.toDate()).toLocaleString()}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
