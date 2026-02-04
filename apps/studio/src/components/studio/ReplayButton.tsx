
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ReplayButton({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReplay = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/studio/replay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
      });

      if (response.ok) {
        const { replayId } = await response.json();
        router.push(`/studio/replay/${replayId}`);
      } else {
        // Handle error
        console.error('Failed to replay job');
      }
    } catch (error) {
      console.error('Error replaying job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleReplay}
      disabled={loading}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      {loading ? 'Loading...' : 'Replay'}
    </button>
  );
}
