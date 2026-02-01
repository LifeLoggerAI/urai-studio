"use client";

import { useCollection } from "react-firebase-hooks/firestore";
import { getFirestore, collection, query, where } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { useAuthState } from "react-firebase-hooks/auth";
import Link from "next/link";

export default function LibraryPage() {
  const auth = getAuth();
  const [user] = useAuthState(auth);
  const db = getFirestore();

  const [value, loading, error] = useCollection(
    user ? query(collection(db, "contentItems"), where("ownerUid", "==", user.uid)) : null
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">Library</h1>
      <table className="w-full mt-4">
        <thead>
          <tr>
            <th className="text-left">Title</th>
            <th className="text-left">Status</th>
            <th className="text-left">Created At</th>
          </tr>
        </thead>
        <tbody>
          {value &&
            value.docs.map((doc) => (
              <tr key={doc.id}>
                <td>
                  <Link href={`/app/item/${doc.id}`}>{doc.data().title}</Link>
                </td>
                <td>{doc.data().statusSummary}</td>
                <td>{doc.data().createdAt?.toDate().toLocaleString()}</td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
