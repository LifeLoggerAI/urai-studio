"use client";

import { requireDb } from "@/lib/firebaseClient";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  limit,
  query,
  orderBy,
  type Firestore,
} from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

function safeDbOr<T>(fallback: T): Firestore | T {
  if (typeof window === "undefined") return fallback;
  try {
    return requireDb();
  } catch {
    return fallback;
  }
}

export async function listJobs(count = 50) {
  const _db = safeDbOr<[]>([]);
  if (Array.isArray(_db)) return _db;

  const q = query(
    collection(_db, "studioJobs"),
    orderBy("createdAt", "desc"),
    limit(count)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getJob(id: string) {
  const _db = safeDbOr<null>(null);
  if (_db === null) return null;

  const docRef = doc(_db, "studioJobs", id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? ({ id: docSnap.id, ...docSnap.data() } as any) : null;
}

export async function requestReplay(jobId: string) {
  const _db = safeDbOr<null>(null);
  if (_db === null) return { ok: false, jobId, replayId: null as any };

  const replayId = uuidv4();
  const jobRef = doc(_db, "studioJobs", jobId);

  await updateDoc(jobRef, {
    "output.replayId": replayId,
    updatedAt: serverTimestamp(),
  });

  return { ok: true, jobId, replayId };
}
