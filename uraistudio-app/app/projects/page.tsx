'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import { Project } from '@/lib/types';

export default function ProjectsPage() {
  const { user, studioUser, loading } = useAuth();
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  const canCreateProject = studioUser?.role === 'owner' || studioUser?.role === 'admin' || studioUser?.role === 'editor';

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'projects'), where('ownerUid', '==', user.uid));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const projectsData: Project[] = [];
        querySnapshot.forEach((doc) => {
          projectsData.push({ projectId: doc.id, ...doc.data() } as Project);
        });
        setProjects(projectsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleCreateProject = async () => {
    if (projectName.trim() === '' || !user) return;

    await addDoc(collection(db, 'projects'), {
      ownerUid: user.uid,
      name: projectName,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    setShowCreateForm(false);
    setProjectName('');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        {canCreateProject && (
          <button 
            onClick={() => setShowCreateForm(true)} 
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Create Project
          </button>
        )}
      </div>

      {showCreateForm && (
        <div className="mb-4 p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Create New Project</h2>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Project Name"
            className="border p-2 rounded w-full mb-2"
          />
          <button 
            onClick={handleCreateProject} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Save
          </button>
          <button 
            onClick={() => setShowCreateForm(false)} 
            className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded ml-2"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.projectId} className="border p-4 rounded">
            <h2 className="text-xl font-bold">{project.name}</h2>
            <p>Created: {project.createdAt?.toDate().toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
