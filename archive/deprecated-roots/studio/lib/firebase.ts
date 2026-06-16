
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "",
  authDomain: "urai-studio-86479605.firebaseapp.com",
  projectId: "urai-studio-86479605",
  storageBucket: "urai-studio-86479605.appspot.com",
  messagingSenderId: "434821595124",
  appId: "1:434821595124:web:e33591561652932937a075"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const storage = getStorage(app);
