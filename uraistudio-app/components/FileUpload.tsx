'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { storage, db } from '@/lib/firebaseClient';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export default function FileUpload({ projectId }) {
  const { user } = useAuth();
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    const assetId = uuidv4();
    const storagePath = `studio/${user.uid}/${projectId}/assets/${assetId}/${file.name}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
        setUploading(true);
      },
      (error) => {
        console.error("Upload failed:", error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, 'studioAssets'), {
          uid: user.uid,
          projectId,
          storagePath,
          mimeType: file.type,
          size: file.size,
          createdAt: serverTimestamp(),
          name: file.name,
        });
        setUploading(false);
        setFile(null);
      }
    );
  };

  return (
    <div>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? `Uploading... ${progress.toFixed(2)}%` : 'Upload'}
      </button>
    </div>
  );
}
