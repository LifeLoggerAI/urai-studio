
'use client';

import { useParams } from 'next/navigation';

export default function ReplayPage() {
  const params = useParams();
  const { replayId } = params;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Replay</h1>
      <p>Replay ID: {replayId}</p>
    </div>
  );
}
