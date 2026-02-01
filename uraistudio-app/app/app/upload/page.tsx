'use client';

import { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext'; // Adjust path
import { storage, firestore } from '../../../../firebase/firebaseApp'; // Adjust path
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function UploadPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    const itemId = `item_${Date.now()}`;
    const uploadId = `upload_${Date.now()}`;
    const storagePath = `raw/${user.uid}/${itemId}/${uploadId}/${file.name}`;
    const storageRef = ref(storage, storagePath);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const prog = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(prog);
      },
      (error) => {
        console.error('Upload error:', error);
        setUploading(false);
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

        // Create content item and upload doc in Firestore
        const contentItemRef = await addDoc(collection(firestore, 'contentItems'), {
          ownerUid: user.uid,
          title: title || 'Untitled',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          statusSummary: 'draft',
        });

        await addDoc(collection(firestore, `contentItems/${contentItemRef.id}/uploads`), {
          ownerUid: user.uid,
          storagePath,
          fileName: file.name,
          contentType: file.type,
          size: file.size,
          createdAt: serverTimestamp(),
          status: 'uploaded',
        });

        setUploading(false);
        alert('Upload complete!');
        // Redirect or clear form
        setFile(null);
        setTitle('');
        setProgress(0);
      }
    );
  };

  return (
    <div>
      <h1>Upload Media</h1>
      <input type="file" onChange={handleFileChange} />
      <input
        type="text"
        placeholder="Title (optional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={handleUpload} disabled={!file || uploading}>
        {uploading ? `Uploading... ${progress.toFixed(2)}%` : 'Upload'}
      </button>
      {uploading && <progress value={progress} max="100" />}
    </div>
  );
}
