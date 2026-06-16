
'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  doc,
  onSnapshot,
  query,
  collection,
  where,
} from 'firebase/firestore';
import { app } from '../../firebase/client';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

const auth = getAuth(app);
const db = getFirestore(app);

export default function ContentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const contentId = params.contentId as string;

  const [user, setUser] = useState<User | null>(null);
  const [contentItem, setContentItem] = useState<any>(null);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user && contentId) {
      const contentRef = doc(db, 'contentItems', contentId);
      const unsubscribeContent = onSnapshot(contentRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().ownerUid === user.uid) {
          setContentItem({ id: docSnap.id, ...docSnap.data() });
        } else {
          router.push('/studio');
        }
      });

      const jobsQuery = query(
        collection(db, 'jobs'),
        where('contentId', '==', contentId),
        where('ownerUid', '==', user.uid)
      );
      const unsubscribeJob = onSnapshot(jobsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const jobDoc = snapshot.docs[0];
          setJob({ id: jobDoc.id, ...jobDoc.data() });
        }
      });

      return () => {
        unsubscribeContent();
        unsubscribeJob();
      };
    }
  }, [user, contentId, router]);

  if (!contentItem) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container p-4 mx-auto">
      <div className="mb-4">
        <Link href="/studio" className="text-blue-500 hover:underline">
          {'<'} Back to Studio
        </Link>
      </div>

      <h1 className="text-3xl font-bold">{contentItem.title}</h1>
      <p className="mb-4 text-gray-600">{contentItem.description || 'No description.'}</p>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="p-4 border rounded">
          <h2 className="mb-2 text-xl font-bold">Details</h2>
          <p>
            <strong>Status:</strong>{' '}
            <span className={`px-2 py-1 text-xs text-white bg-gray-500 rounded-full`}>
              {contentItem.status}
            </span>
          </p>
          {contentItem.error && <p className="text-red-500"><strong>Error:</strong> {contentItem.error}</p>}

          <h3 className="mt-4 mb-2 font-bold">Input</h3>
          {contentItem.input && (
            <ul className="pl-4 list-disc">
              <li><strong>File Name:</strong> {contentItem.fileName}</li>
              <li><strong>MIME Type:</strong> {contentItem.input.mimeType}</li>
              <li><strong>Size:</strong> {(contentItem.input.bytes / 1024 / 1024).toFixed(2)} MB</li>
            </ul>
          )}
        </div>

        <div className="p-4 border rounded">
          <h2 className="mb-2 text-xl font-bold">Processing Job</h2>
          {job ? (
            <>
              <p>
                <strong>Status:</strong>{' '}
                <span className={`px-2 py-1 text-xs text-white bg-gray-500 rounded-full`}>
                  {job.status}
                </span>
              </p>
              {job.error && <p className="text-red-500"><strong>Error:</strong> {job.error}</p>}
            </>
          ) : (
            <p>Job not started yet.</p>
          )}

          <h3 className="mt-4 mb-2 font-bold">Outputs</h3>
          {contentItem.status === 'ready' && contentItem.outputs && contentItem.outputs.length > 0 ? (
            <div className="space-y-4">
              {contentItem.outputs.map((output: any, index: number) => (
                <div key={index} className="p-2 border rounded">
                  {output.type.startsWith('image/') && (
                    <img src={output.url} alt="output preview" className="max-w-xs mb-2 rounded" />
                  )}
                  <p className="text-sm"><strong>Type:</strong> {output.type}</p>
                  <p className="text-sm"><strong>Size:</strong> {(output.bytes / 1024).toFixed(2)} KB</p>
                  <a
                    href={output.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="inline-block px-4 py-2 mt-2 text-sm font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p>No outputs available yet. The job is {job ? job.status : 'not started'}.</p>
          )}
        </div>
      </div>
    </div>
  );
}
