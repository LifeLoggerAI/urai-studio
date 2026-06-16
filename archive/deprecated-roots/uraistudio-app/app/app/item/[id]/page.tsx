'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../../context/AuthContext'; // Adjust path
import { firestore } from '../../../../../firebase/firebaseApp'; // Adjust path
import { doc, onSnapshot } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

// Mock data shapes - replace with your actual TS types
interface Upload { id: string; fileName: string; status: string; }
interface Version { id: string; status: string; outputs: any; }
interface Job { id: string; type: string; status: string; progressPct: number; }
interface Item {
  title: string;
  // Add other fields
}

export default function ItemDetailPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = params;

  const [item, setItem] = useState<Item | null>(null);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [versions, setVersions] = useState<Version[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (!user || !id) return;

    const unsubItem = onSnapshot(doc(firestore, 'contentItems', id), (doc) => {
      if (!doc.exists()) {
        router.push('/app/library');
        return;
      }
      setItem(doc.data() as Item);
    });

    // These would be separate queries in a real app
    // For simplicity here, we're just showing the structure

    return () => {
      unsubItem();
      // Unsubscribe from other listeners
    };
  }, [user, id, router]);

  return (
    <div>
      <h1>Item: {item?.title || 'Loading...'}</h1>

      <h2>Uploads</h2>
      {/* Render uploads here */}

      <h2>Versions & Jobs</h2>
      {/* Render versions and their associated jobs */}

      <h2>Outputs</h2>
      {/* Render final outputs from the latest ready version */}
    </div>
  );
}
