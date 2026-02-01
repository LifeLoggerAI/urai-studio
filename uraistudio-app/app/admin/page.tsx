'use client';

import { useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext'; // Adjust path
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This is a client-side check. A server-side check is also required.
    if (user && !user.isAdmin) {
      router.push('/app');
    }
  }, [user, router]);

  if (!user || !user.isAdmin) {
    return <p>Access Denied.</p>;
  }

  return (
    <div>
      <h1>Admin Panel</h1>
      
      <h2>Job Queue</h2>
      {/* Placeholder for job queue component */}

      <h2>System Logs</h2>
      {/* Placeholder for log viewer component */}

      <h2>Operator Tools</h2>
      <button>Requeue Job</button>
      <button>Cancel Job</button>
      <button>Repair Orphaned Locks</button>
    </div>
  );
}
