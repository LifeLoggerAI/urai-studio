"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, getDoc } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../firebase/clientApp";
import Link from "next/link";

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);

const createUploadUrl = httpsCallable(functions, 'createUploadUrl');
const finalizeUpload = httpsCallable(functions, 'finalizeUpload');

export default function Studio() {
    const [user, setUser] = useState<User | null>(null);
    const [contentItems, setContentItems] = useState<any[]>([]);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        if (user) {
            const q = query(
                collection(db, "contentItems"),
                where("ownerUid", "==", user.uid),
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

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || !user) return;
        const file = event.target.files[0];
        setUploading(true);
        setError(null);

        try {
            const { data }: any = await createUploadUrl({
                fileName: file.name,
                mimeType: file.type,
                bytes: file.size,
            });

            const { contentId, uploadUrl, storagePath } = data;

            await fetch(uploadUrl, {
                method: "PUT",
                body: file,
                headers: {
                    "Content-Type": file.type,
                },
            });

            await finalizeUpload({ contentId, storagePath, mimeType: file.type, bytes: file.size });
        } catch (err: any) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    };

    if (!user) {
        return <div>Loading...</div>;
    }

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">URAI Studio</h1>
            <div className="mb-4">
                <input type="file" onChange={handleUpload} disabled={uploading} />
                {uploading && <p>Uploading...</p>}
                {error && <p className="text-red-500">{error}</p>}
            </div>
            <div>
                <h2 className="text-xl font-bold mb-2">My Content</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {contentItems.map((item) => (
                        <Link key={item.id} href={`/studio/${item.id}`}>
                            <div className="border p-4 rounded-lg">
                                <h3 className="font-bold">{item.title}</h3>
                                <p>Status: {item.status}</p>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
