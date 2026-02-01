import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "TODO: Add your api key",
  authDomain: "demo-urai-studio.firebaseapp.com",
  projectId: "demo-urai-studio",
  storageBucket: "demo-urai-studio.appspot.com",
  messagingSenderId: "TODO: Add your messaging sender id",
  appId: "TODO: Add your app id",
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
