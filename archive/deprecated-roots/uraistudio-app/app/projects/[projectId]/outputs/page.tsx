'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";

export default function ProjectOutputsPage({ params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const [outputs, setOutputs] = useState<any[]>([]);

  useEffect(() => {
    if (!projectId) return;

    const q = query(collection(db, "studioOutputs"), where("projectId", "==", projectId));

    const unsub = onSnapshot(q, (snapshot) => {
      const newOutputs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setOutputs(newOutputs);
    });

    return () => unsub();
  }, [projectId]);

  return (
    <div>
      <h1>Project Outputs</h1>
      <ul>
        {outputs.map((output) => (
          <li key={output.id}>
            <a href={output.url}>{output.name}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
