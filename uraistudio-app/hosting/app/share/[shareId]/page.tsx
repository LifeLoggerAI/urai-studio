'use client';

export default function SharePage({ params }: { params: { shareId: string } }) {
  return (
    <div>
      <h1>Shared File</h1>
      <p>Share ID: {params.shareId}</p>
      {/* TODO: Fetch and display the shared file */}
    </div>
  );
}
