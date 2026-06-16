
'use client';

import { auth, googleProvider } from "../lib/firebase";
import { signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
    const router = useRouter();

    const handleSignIn = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (error) {
            console.error("Error signing in:", error);
        }
    };

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (user) {
                router.push("/studio");
            }
        });
        return () => unsubscribe();
    }, [router]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="p-8 bg-white rounded-lg shadow-md">
                <h1 className="mb-4 text-2xl font-bold text-center">Welcome to URAI Studio</h1>
                <button 
                    onClick={handleSignIn} 
                    className="w-full px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
                >
                    Sign in with Google
                </button>
            </div>
        </div>
    );
}
