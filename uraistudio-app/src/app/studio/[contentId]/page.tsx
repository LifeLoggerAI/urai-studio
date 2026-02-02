"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import { db, app } from "../../../firebase/clientApp";
import { notFound, useRouter } from "next/navigation";

const auth = getAuth(app);
const functions = getFunctions(app);
const refreshOutputUrls = httpsCallable(functions, 'refreshOutputUrls');

export default function ContentDetail({ params }: { params: { contentId: string } }) {
    const { contentId } = params;
    const [contentItem, setContentItem] = useState<any>(null);
    const [job, setJob] = useState<any>(null);
    const [user, setUser] = useState<User | null>(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
            } else {
                router.push("/login");
            }
        });
        return () => unsubscribe();
    }, [router]);

    useEffect(() => {
        if (user && contentId) {
            const contentItemRef = doc(db, "contentItems", contentId as string);
            const unsubscribe = onSnapshot(contentItemRef, (doc) => {
                if (doc.exists() && doc.data().ownerUid === user.uid) {
                    setContentItem({ id: doc.id, ...doc.data() });
                } else {
                    notFound();
                }
            });

            return () => unsubscribe();
        }
    }, [user, contentId]);

    useEffect(() => {
        if (contentItem) {
            const q = doc(db, "jobs", contentItem.jobId);
            const unsubscribe = onSnapshot(q, (doc) => {
                if (doc.exists()) {
                    setJob({ id: doc.id, ...doc.data() });
                }
            });
            return () => unsubscribe();
        }
    }, [contentItem]);

    const handleRefreshUrls = async () => {
        if (contentId) {
            await refreshOutputUrls({ contentId });
        }
    };

    if (!contentItem) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">{contentItem.title}</h1>
            <p><strong>Status:</strong> {contentItem.status}</p>
            {contentItem.error && <p className="text-red-500"><strong>Error:</strong> {contentItem.error}</p>}
            {job && <p><strong>Job Status:</strong> {job.status}</p>}
            
            <div className="my-4">
                <h2 className="text-xl font-bold">Input</h2>
                <p><strong>File Name:</strong> {contentItem.fileName}</p>
                <p><strong>MIME Type:</strong> {contentItem.mimeType}</p>
                <p><strong>Size:</strong> {contentItem.bytes} bytes</p>
            </div>

            <div className="my-4">
                <h2 className="text-xl font-bold">Outputs</h2>
                <button onClick={handleRefreshUrls} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2">
                    Refresh Download Links
                </button>
                {contentItem.outputs && contentItem.outputs.map((output: any, index: number) => (
                    <div key={index} className="border p-2 rounded mb-2">
                        <p><strong>Type:</strong> {output.type}</p>
                        <p><strong>Size:</strong> {output.bytes} bytes</p>
                        <a href={output.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Download</a>
                        {output.type.startsWith('image/') && <img src={output.url} alt={output.type} className="max-w-xs mt-2"/>}
                    </div>
                ))}
            </div>
        </div>
    );
}
