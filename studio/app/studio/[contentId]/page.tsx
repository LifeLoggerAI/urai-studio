
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../lib/firebase';

export default function ContentDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { contentId } = params;
    const [item, setItem] = useState(null);
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!contentId) return;

        const itemUnsubscribe = onSnapshot(doc(db, 'contentItems', contentId), (doc) => {
            if (doc.exists()) {
                setItem({ id: doc.id, ...doc.data() });
            } else {
                router.push('/studio');
            }
            setLoading(false);
        });

        return () => itemUnsubscribe();
    }, [contentId, router]);
    
    useEffect(() => {
        if (!item || !item.jobId) return;

        const jobUnsubscribe = onSnapshot(doc(db, 'jobs', item.jobId), (doc) => {
            if (doc.exists()) {
                setJob({ id: doc.id, ...doc.data() });
            }
        });

        return () => jobUnsubscribe();
    }, [item]);

    if (loading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!item) {
        return <div className="flex items-center justify-center min-h-screen">Content not found.</div>;
    }

    return (
        <div className="container p-4 mx-auto">
            <button onClick={() => router.push('/studio')} className="mb-6 px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700">
                &larr; Back to Studio
            </button>

            <div className="p-6 bg-white rounded-lg shadow-md">
                <h1 className="mb-2 text-3xl font-bold">{item.title}</h1>
                <p className="mb-4 text-gray-600">{item.description}</p>
                <p className="px-3 py-1 mb-4 text-sm font-semibold text-white bg-gray-700 rounded-full w-max">Status: {item.status}</p>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                        <h2 className="mb-2 text-xl font-semibold">Input Details</h2>
                        <div className="p-4 space-y-2 bg-gray-100 rounded-md">
                            <p><strong>File Name:</strong> {item.fileName}</p>
                            <p><strong>MIME Type:</strong> {item.mimeType}</p>
                            <p><strong>Size:</strong> {(item.bytes / 1024 / 1024).toFixed(2)} MB</p>
                             <p><strong>Storage Path:</strong> {item.storagePath}</p>
                        </div>
                    </div>

                    <div>
                        <h2 className="mb-2 text-xl font-semibold">Job Status</h2>
                        {job ? (
                            <div className="p-4 bg-gray-100 rounded-md">
                                <p><strong>Status:</strong> {job.status}</p>
                                {job.error && <p className="text-red-500"><strong>Error:</strong> {job.error}</p>}
                            </div>
                        ) : (
                            <p>No job associated yet.</p>
                        )}
                    </div>
                </div>

                <div className="mt-6">
                    <h2 className="mb-2 text-xl font-semibold">Outputs</h2>
                    {item.outputs && item.outputs.length > 0 ? (
                        <div className="space-y-4">
                            {item.outputs.map((output, index) => (
                                <div key={index} className="flex flex-col p-4 bg-gray-100 rounded-md md:flex-row md:items-center md:justify-between">
                                    <div className='mb-2 md:mb-0'>
                                        <p><strong>Type:</strong> {output.type}</p>
                                        {output.type.startsWith('image/') && (
                                            <img src={output.url} alt={output.type} className="mt-2 rounded-md max-h-40" />
                                        )}
                                    </div>
                                    <a href={output.url} target="_blank" rel="noopener noreferrer" className="px-4 py-2 font-bold text-center text-white bg-green-500 rounded hover:bg-green-700">
                                        Download
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No outputs have been generated yet.</p>
                    )}
                     {item.status === 'failed' && item.error && (
                        <div className="p-4 mt-4 text-red-700 bg-red-100 border border-red-400 rounded-md">
                            <h3 className='font-bold'>Processing Failed</h3>
                            <p>{item.error}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
