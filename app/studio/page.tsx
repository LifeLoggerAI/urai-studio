
'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import {
  getFirestore,
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase/client';
import { useRouter } from 'next/navigation';

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

const createUploadUrl = httpsCallable(functions, 'createUploadUrl');
const finalizeUpload = httpsCallable(functions, 'finalizeUpload');
const refreshOutputUrls = httpsCallable(functions, 'refreshOutputUrls');

export default function StudioPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [contentItems, setContentItems] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'studioUsers', user.uid));
        if (userDoc.exists() && userDoc.data().isActive) {
          setUser(user);
        } else {
          router.push('/login');
        }
      } else {
        router.push('/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    if (user) {
      const q = query(
        collection(db, 'contentItems'),
        where('ownerUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setContentItems(items);
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);

    try {
      const { data }: any = await createUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        bytes: file.size,
        title,
        description,
      });

      const { contentId, uploadUrl, storagePath } = data;

      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', file.type);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          setUploadProgress(percentComplete);
        }
      };

      xhr.onload = async () => {
        if (xhr.status === 200) {
          await finalizeUpload({
            contentId,
            storagePath,
            mimeType: file.type,
            bytes: file.size,
          });
          setFile(null);
          setTitle('');
          setDescription('');
        } else {
          console.error('Upload failed');
        }
        setUploading(false);
      };

      xhr.onerror = () => {
        console.error('Upload failed');
        setUploading(false);
      };

      xhr.send(file);
    } catch (error) {
      console.error('Error creating upload URL:', error);
      setUploading(false);
    }
  };

  const handleRefreshUrls = async (contentId: string) => {
    try {
      await refreshOutputUrls({ contentId });
    } catch (error) {
      console.error('Error refreshing URLs:', error);
    }
  };

  return (
    <div className="container p-4 mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">My Studio</h1>
        <button
          onClick={() => auth.signOut()}
          className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700"
        >
          Sign Out
        </button>
      </div>

      <div className="p-4 mb-8 border rounded">
        <h2 className="mb-2 text-xl font-bold">Upload New Content</h2>
        <div className="flex flex-col space-y-2">
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 border rounded"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 border rounded"
          />
          <input type="file" onChange={handleFileChange} />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? `Uploading... ${uploadProgress.toFixed(2)}%` : 'Upload'}
          </button>
        </div>
      </div>

      <div>
        <h2 className="mb-2 text-xl font-bold">My Content</h2>
        <div className="space-y-4">
          {contentItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-4 border rounded">
              <div>
                <h3 className="font-bold">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.fileName}</p>
                <p className="px-2 py-1 text-xs text-white bg-gray-500 rounded-full">{item.status}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => router.push(`/studio/${item.id}`)}
                  className="px-4 py-2 text-sm font-bold text-white bg-green-500 rounded hover:bg-green-700"
                >
                  Details
                </button>
                <button
                  onClick={() => handleRefreshUrls(item.id)}
                  disabled={item.status !== 'ready'}
                  className="px-4 py-2 text-sm font-bold text-white bg-purple-500 rounded hover:bg-purple-700 disabled:opacity-50"
                >
                  Refresh Links
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
