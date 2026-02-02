"use client";

import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import { app } from "../../firebase/clientApp";

const auth = getAuth(app);

export default function Login() {
    const router = useRouter();

    const handleLogin = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push("/studio");
        } catch (error) {
            console.error("Error signing in with Google", error);
        }
    };

    return (
        <div className="flex items-center justify-center h-screen">
            <button onClick={handleLogin} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Sign in with Google
            </button>
        </div>
    );
}
