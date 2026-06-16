
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, functions } from '../../lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { ref, uploadBytes } from 'firebase/storage';

export default function StudioPage() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [contentItems, setContentItems] = useState([]);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                setUser(user);
            } else {
                router.push('/');
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (!user) return;
        const q = query(
            collection(db, 'contentItems'), 
            where('ownerUid', '==', user.uid),
            orderBy('createdAt', 'desc')
        );
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setContentItems(items);
        });
        return () => unsubscribe();
    }, [user]);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!file || !title) {
            alert('Please provide a title and select a file.');
            return;
        }

        setUploading(true);

        try {
            const createUploadUrl = httpsCallable(functions, 'createUploadUrl');
            const { data } = await createUploadUrl({ 
                fileName: file.name,
                mimeType: file.type,
                bytes: file.size,
                title: title,
                description: description,
            });

            const { uploadUrl, storagePath, contentId } = data;

            await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'Content-Type': file.type,
                },
            });

            const finalizeUpload = httpsCallable(functions, 'finalizeUpload');
            await finalizeUpload({ 
                contentId: contentId,
                storagePath: storagePath,
                mimeType: file.type,
                bytes: file.size,
            });

            setTitle('');
            setDescription('');
            setFile(null);
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleSignOut = async () => {
        await auth.signOut();
        router.push('/');
    };
    
    const handleRefresh = async (contentId) => {
        const refreshOutputUrls = httpsCallable(functions, 'refreshOutputUrls');
        await refreshOutputUrls({ contentId });
    };


    return (
        <div className="container p-4 mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-3xl font-bold">URAI Studio</h1>
                <button onClick={handleSignOut} className="px-4 py-2 font-bold text-white bg-red-500 rounded hover:bg-red-700">
                    Sign Out
                </button>
            </div>

            <div className="p-6 mb-8 bg-white rounded-lg shadow-md">
                <h2 className="mb-4 text-2xl font-semibold">Upload New Content</h2>
                <div className="space-y-4">
                    <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-2 border rounded" />
                    <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded"></textarea>
                    <input type="file" onChange={handleFileChange} className="w-full" />
                    <button onClick={handleUpload} disabled={uploading} className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 disabled:bg-gray-400">
                        {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                </div>
            </div>

            <div>
                <h2 className="mb-4 text-2xl font-semibold">Your Content</h2>
                <div className="space-y-4">
                    {contentItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
                            <div>
                                <h3 className="text-xl font-bold">{item.title}</h3>
                                <p className="text-sm text-gray-600">Status: {item.status}</p>
                            </div>
                            <div className='space-x-2'>
                               <button onClick={() => router.push(`/studio/${item.id}`)} className='px-3 py-1 text-white bg-green-500 rounded hover:bg-green-700'>
                                Details
                               </button>
                                <button onClick={() => handleRefresh(item.id)} className="px-3 py-1 text-white bg-purple-500 rounded hover:bg-purple-700">
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
