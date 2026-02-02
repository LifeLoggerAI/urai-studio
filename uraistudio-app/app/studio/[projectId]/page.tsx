'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import Link from 'next/link';
import FileUpload from '@/components/FileUpload';

export default function ProjectPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { projectId } = params;
  const [project, setProject] = useState(null);
  const [assets, setAssets] = useState([]);
  const [templateId, setTemplateId] = useState('default_template'); // Stub data

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && projectId) {
      const getProject = async () => {
        const projectDoc = await getDoc(doc(db, 'studioProjects', projectId));
        if (projectDoc.exists() && projectDoc.data().uid === user.uid) {
          setProject({ id: projectDoc.id, ...projectDoc.data() });
        } else {
          console.error("Project not found or you don't have access");
          // router.push('/studio');
        }
      };
      getProject();

      const q = query(
        collection(db, 'studioAssets'),
        where('uid', '==', user.uid),
        where('projectId', '==', projectId)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const assetsData = [];
        querySnapshot.forEach((doc) => {
          assetsData.push({ id: doc.id, ...doc.data() });
        });
        setAssets(assetsData);
      });
      return () => unsubscribe();
    }
  }, [user, projectId, router]);

  const handleCreateJob = async () => {
    if (!user || assets.length === 0) return;

    const inputAssetIds = assets.map(asset => asset.id);

    await addDoc(collection(db, 'studioJobs'), {
      uid: user.uid,
      projectId,
      templateId,
      inputAssetIds,
      status: 'QUEUED',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    router.push(`/studio/${projectId}/jobs`);
  };

  if (loading || !project) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Project: {project.name}</h1>
      <div className="mb-4">
        <Link href={`/studio/${projectId}/jobs`} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          View Jobs
        </Link>
      </div>
      <div className="mb-4 p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">1. Upload Assets</h2>
        <FileUpload projectId={projectId} />
        <h3 className="text-lg font-bold mt-4 mb-2">Uploaded Assets</h3>
        <ul>
          {assets.map((asset) => (
            <li key={asset.id} className="mb-1">
              {asset.name} ({ (asset.size / 1024 / 1024).toFixed(2) } MB)
            </li>
          ))}
        </ul>
      </div>
      <div className="p-4 border rounded">
        <h2 className="text-xl font-bold mb-2">2. Create Render Job</h2>
        <div className="mb-2">
          <label>Template:</label>
          <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className="border p-2 rounded ml-2">
            <option value="default_template">Default Template</option>
            <option value="short_form_clip">Short Form Clip</option>
          </select>
        </div>
        <button onClick={handleCreateJob} disabled={assets.length === 0} className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400">
          Create Job
        </button>
      </div>
    </div>
  );
}
