import { requireAuth, requireDb } from "@/lib/firebaseClient";


import { app } from "@/app/firebase";
import { useAuthState } from "@/lib/staticAuth";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/app/firebase";
import { useEffect, useState } from "react";
import Link from "next/link";
import FileUpload from "@/components/FileUpload";

const auth = requireAuth();

export default function Studio() {
  const [user, loading] = useAuthState(auth);
  const [contentItems, setContentItems] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(requireDb(), "contentItems"),
        where("ownerUid", "==", (user as any).uid),
        orderBy("createdAt", "desc")
      );
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const items: any[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setContentItems(items);
      });

      return () => unsubscribe();
    }
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Link href="/login">Please sign in to continue</Link>;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">My Content</h1>
      <FileUpload />
      <div className="mt-8">
        {contentItems.map((item) => (
          <div key={item.id} className="border p-4 mb-4 rounded">
            <Link href={`/studio/${item.id}`}>
              <h2 className="text-xl font-bold">{item.title}</h2>
            </Link>
            <p className="text-gray-500">{item.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
