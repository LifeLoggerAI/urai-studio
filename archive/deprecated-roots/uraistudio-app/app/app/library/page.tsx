'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../../context/AuthContext'; // Adjust path
import { firestore } from '../../../../firebase/firebaseApp'; // Adjust path
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import Link from 'next/link';

interface ContentItem {
  id: string;
  title: string;
  statusSummary: string;
  createdAt: any;
}

export default function LibraryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<ContentItem[]>([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(firestore, 'contentItems'),
      where('ownerUid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const itemsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...(doc.data() as Omit<ContentItem, 'id'>),
      }));
      setItems(itemsData);
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div>
      <h1>My Library</h1>
      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.statusSummary}</td>
              <td>{new Date(item.createdAt?.toDate()).toLocaleString()}</td>
              <td>
                <Link href={`/app/item/${item.id}`}>View</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
