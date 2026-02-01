'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function SharePage({ params }: { params: { shareId: string } }) {
  const { shareId } = params;
  const [output, setOutput] = useState<any>(null);

  useEffect(() => {
    const fetchOutput = async () => {
      if (!shareId) return;

      const shareDoc = await getDoc(doc(db, "studioShares", shareId as string));

      if (shareDoc.exists()) {
        const outputDoc = await getDoc(doc(db, "studioOutputs", shareDoc.data().outputId));
        if (outputDoc.exists()) {
          setOutput({ id: outputDoc.id, ...outputDoc.data() });
        }
      }
    };

    fetchOutput();
  }, [shareId]);

  if (!output) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Shared Output</h1>
      <p>Name: {output.name}</p>
      <p>
        <a href={output.url}>Download</a>
      </p>
    </div>
  );
}
