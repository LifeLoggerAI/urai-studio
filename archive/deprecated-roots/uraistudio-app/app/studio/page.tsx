'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebaseClient';
import Link from 'next/link';

export default function StudioPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState([]);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'studioProjects'),
        where('uid', '==', user.uid)
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const projectsData = [];
        querySnapshot.forEach((doc) => {
          projectsData.push({ id: doc.id, ...doc.data() });
        });
        setProjects(projectsData);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (newProjectName.trim() === '' || !user) return;

    try {
      await addDoc(collection(db, 'studioProjects'), {
        name: newProjectName,
        uid: user.uid,
        createdAt: serverTimestamp(),
      });
      setNewProjectName('');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">URAI Studio</h1>
      <div className="mb-4">
        <form onSubmit={handleCreateProject}>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="New project name"
            className="border p-2 rounded"
          />
          <button type="submit" className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Create Project
          </button>
        </form>
      </div>
      <div>
        <h2 className="text-xl font-bold mb-2">My Projects</h2>
        <ul>
          {projects.map((project) => (
            <li key={project.id} className="mb-2 p-2 border rounded">
              <Link href={`/studio/${project.id}`}>
                <p className="font-bold">{project.name}</p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
