'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function ContentDetailPage({ params }: { params: { contentId: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { contentId } = params;
  const [contentItem, setContentItem] = useState(null);
  const [job, setJob] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && contentId) {
      const unsubContent = onSnapshot(doc(db, 'contentItems', contentId as string), (doc) => {
        if (doc.exists() && doc.data().ownerUid === user.uid) {
          setContentItem({ id: doc.id, ...doc.data() });
        } else {
          // Handle case where content doesn't exist or user doesn't have access
          setContentItem(null);
        }
      });

      return () => unsubContent();
    }
  }, [user, contentId]);

  useEffect(() => {
    if (contentItem) {
      const q = query(collection(db, 'jobs'), where('contentId', '==', contentId));
      const unsubJob = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          setJob(snapshot.docs[0].data());
        }
      });
      return () => unsubJob();
    }
  }, [contentItem, contentId]);

  const refreshUrls = async () => {
    const functions = getFunctions();
    const refreshOutputUrls = httpsCallable(functions, 'refreshOutputUrls');
    try {
      await refreshOutputUrls({ contentId });
    } catch (error) {
      console.error('Error refreshing URLs:', error);
    }
  };

  if (loading || !contentItem) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{contentItem.title}</h1>
      <p className="mb-2">{contentItem.description}</p>
      <p className="mb-2">Status: <span className="font-mono bg-gray-200 px-2 py-1 rounded">{contentItem.status}</span></p>

      <div className="my-4 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">Input</h2>
        <p>File Name: {contentItem.fileName}</p>
        <p>MIME Type: {contentItem.mimeType}</p>
        <p>Size: {contentItem.bytes} bytes</p>
      </div>

      {job && (
        <div className="my-4 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Job Status</h2>
          <p>{job.status}</p>
          {job.error && <p className="text-red-500">Error: {job.error}</p>}
        </div>
      )}

      <div className="my-4 p-4 border rounded">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold">Outputs</h2>
          <button onClick={refreshUrls} className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">Refresh Links</button>
        </div>
        {contentItem.outputs && contentItem.outputs.length > 0 ? (
          <ul>
            {contentItem.outputs.map((output, index) => (
              <li key={index} className="flex items-center justify-between mb-2 p-2 border rounded">
                <div>
                  <p className="font-bold">{output.type}</p>
                  <p>{output.bytes} bytes</p>
                </div>
                <a href={output.url} target="_blank" rel="noopener noreferrer" className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600">Download</a>
              </li>
            ))}
          </ul>
        ) : (
          <p>No outputs yet.</p>
        )}
        {contentItem.status === 'failed' && contentItem.error && (
          <p className="text-red-500">Error: {contentItem.error}</p>
        )}
      </div>
    </div>
  );
}
