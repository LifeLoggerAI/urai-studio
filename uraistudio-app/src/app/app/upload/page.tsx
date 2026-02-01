"use client";

import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { getFirestore, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const auth = getAuth();
  const [user] = useAuthState(auth);
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (!user) return;

    const db = getFirestore();
    const storage = getStorage();

    for (const file of files) {
      const itemId = uuidv4();
      const uploadId = uuidv4();
      const storagePath = `raw/${user.uid}/${itemId}/${uploadId}/${file.name}`;

      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, file);

      await addDoc(collection(db, `contentItems/${itemId}/uploads`), {
        ownerUid: user.uid,
        storagePath,
        fileName: file.name,
        contentType: file.type,
        size: file.size,
        createdAt: serverTimestamp(),
        status: "uploaded",
      });

      await addDoc(collection(db, "contentItems"), {
        ownerUid: user.uid,
        title,
        description,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        latestVersionId: null,
        statusSummary: "draft",
      });
    }

    router.push("/app/library");
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Upload</h1>
      <div className="mt-4">
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="border p-2 w-full" />
      </div>
      <div className="mt-4">
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="border p-2 w-full" />
      </div>
      <div className="mt-4">
        <input type="file" multiple onChange={handleFileChange} />
      </div>
      <button onClick={handleUpload} className="mt-4 px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700" disabled={files.length === 0 || !title}>
        Upload
      </button>
    </div>
  );
}
