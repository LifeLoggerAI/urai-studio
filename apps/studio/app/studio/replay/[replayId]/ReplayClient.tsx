"use client";

import { useParams } from "next/navigation";

export default function ReplayClient() {
  const params = useParams();
  const replayId = params?.replayId as string | undefined;

  if (!replayId) return null;

  return (
    <div style={{ padding: 24 }}>
      <h1>Replay</h1>
      <p>Replay ID: {replayId}</p>
    </div>
  );
}
