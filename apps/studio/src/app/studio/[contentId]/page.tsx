"use client";
import { firebaseApp, requireAuth, requireDb, db } from "@/lib/firebaseClient";


import { getAuth } from "firebase/auth";

import { useAuthState } from "@/lib/staticAuth";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";



export default function ContentDetail({ params }: { params: { contentId: string } }) {
  const db2 = requireDb();
  const [user, loading] = useAuthState(requireAuth() as any);
  const [contentItem, setContentItem] = useState<any>(null);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = onSnapshot(
        doc(db2, "contentItems", params.contentId),
        (doc) => {
          setContentItem({ id: doc.id, ...doc.data() });
        }
      );
      return () => unsubscribe();
    }
  }, [user, params.contentId]);

  useEffect(() => {
    if (contentItem) {
      const unsubscribe = onSnapshot(doc(db2, "jobs", contentItem.jobId), (doc) => {
        setJob({ id: doc.id, ...doc.data() });
      });
      return () => unsubscribe();
    }
  }, [contentItem]);

  const handleRefreshUrls = async () => {
    if (contentItem) {
      if (typeof window === "undefined") return;
        const callable = httpsCallable(getFunctions(firebaseApp as any), "refreshOutputUrls");
        await (callable as any)({ contentId: contentItem.id });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in to continue</div>;
  }

  if (!contentItem) {
    return <div>Content not found</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{contentItem.title}</h1>
      <p className="mb-4">{contentItem.description}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h2 className="text-xl font-bold mb-2">Input</h2>
          <p>File Name: {contentItem.fileName}</p>
          <p>Mime Type: {contentItem.mimeType}</p>
          <p>Size: {contentItem.bytes}</p>
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Job</h2>
          {job && (
            <div>
              <p>Status: {job.status}</p>
              {job.error && <p className="text-red-500">Error: {job.error}</p>}
            </div>
          )}
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-bold mb-2">Outputs</h2>
        <button
          onClick={handleRefreshUrls}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-4"
        >
          Refresh Download Links
        </button>
        <div className="grid grid-cols-3 gap-4">
          {contentItem.outputs.map((output: any, index: number) => (
            <div key={index} className="border p-4 rounded">
              <h3 className="font-bold">{output.type}</h3>
              {output.type.startsWith("image/") && (
                <img src={output.url} alt={output.type} className="w-full" />
              )}
              <a
                href={output.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
