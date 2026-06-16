'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);

    const functions = getFunctions();
    const createUploadUrl = httpsCallable(functions, 'createUploadUrl');
    const finalizeUpload = httpsCallable(functions, 'finalizeUpload');

    try {
      const { data: uploadData } = await createUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        bytes: file.size,
        title,
        description,
      });

      const { contentId, uploadUrl, storagePath } = uploadData;

      await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      await finalizeUpload({ contentId, storagePath, mimeType: file.type, bytes: file.size });

      router.push(`/studio/${contentId}`);
    } catch (error) {
      console.error('Error uploading file', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Content</h1>
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block font-bold mb-1">Title</label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="description" className="block font-bold mb-1">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="file" className="block font-bold mb-1">File</label>
          <input type="file" id="file" onChange={handleFileChange} />
        </div>
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
