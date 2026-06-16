"use client";

import { useDocument, useCollection } from "react-firebase-hooks/firestore";
import { getFirestore, doc, collection } from "firebase/firestore";
import { useParams } from "next/navigation";

export default function ItemPage() {
  const params = useParams();
  const { id } = params;
  const db = getFirestore();

  const [item, itemLoading, itemError] = useDocument(doc(db, "contentItems", id as string));
  const [uploads, uploadsLoading, uploadsError] = useCollection(
    collection(db, `contentItems/${id}/uploads`)
  );
  const [versions, versionsLoading, versionsError] = useCollection(
    collection(db, `contentItems/${id}/versions`)
  );

  if (itemLoading || uploadsLoading || versionsLoading) {
    return <div>Loading...</div>;
  }

  if (itemError || uploadsError || versionsError) {
    return <div>Error</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">{item?.data()?.title}</h1>

      <h2 className="text-xl font-bold mt-8">Uploads</h2>
      <ul>
        {uploads?.docs.map((doc) => (
          <li key={doc.id}>
            {doc.data().fileName} - {doc.data().status}
          </li>
        ))}
      </ul>

      <h2 className="text-xl font-bold mt-8">Versions</h2>
      <ul>
        {versions?.docs.map((doc) => (
          <li key={doc.id}>
            Version {doc.id} - {doc.data().status}
          </li>
        ))}
      </ul>
    </div>
  );
}
