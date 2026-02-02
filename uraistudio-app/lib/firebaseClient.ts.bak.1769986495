import { initializeApp, getApps } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getAuth, connectAuthEmulator } from "firebase/auth";

function env(k: string, fallback?: string) {
  const v = process.env[k];
  return (v && v.length) ? v : fallback;
}

export function getFirebase() {
  const config = {
    apiKey: env("NEXT_PUBLIC_FIREBASE_API_KEY", "fake"),
    authDomain: env("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", "localhost"),
    projectId: env("NEXT_PUBLIC_FIREBASE_PROJECT_ID", "demo-urai-studio"),
    storageBucket: env("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", "demo-urai-studio.appspot.com")
  };

  const app = getApps().length ? getApps()[0]! : initializeApp(config);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const auth = getAuth(app);

  const emu = env("NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST");
  if (emu && !(globalThis as any).__FIRESTORE_EMU_CONNECTED__) {
    const [host, portStr] = emu.split(":");
    const port = Number(portStr || "8080");
    connectFirestoreEmulator(db, host, port);
    (globalThis as any).__FIRESTORE_EMU_CONNECTED__ = true;
  }

  const storageEmu = env("NEXT_PUBLIC_STORAGE_EMULATOR_HOST");
  if (storageEmu && !(globalThis as any).__STORAGE_EMU_CONNECTED__) {
    const [host, portStr] = storageEmu.split(":");
    const port = Number(portStr || "9199");
    connectStorageEmulator(storage, host, port);
    (globalThis as any).__STORAGE_EMU_CONNECTED__ = true;
  }

  const authEmu = env("NEXT_PUBLIC_AUTH_EMULATOR_HOST");
  if (authEmu && !(globalThis as any).__AUTH_EMU_CONNECTED__) {
    // The URL format for the auth emulator is http://host:port
    connectAuthEmulator(auth, `http://${authEmu}`);
    (globalThis as any).__AUTH_EMU_CONNECTED__ = true;
  }

  return { app, db, storage, auth };
}