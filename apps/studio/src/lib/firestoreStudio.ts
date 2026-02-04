
import { db } from './firebaseClient';
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
} from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

export async function listJobs(count = 50) {
  const q = query(
    collection(db, 'studioJobs'),
    orderBy('createdAt', 'desc'),
    limit(count)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => doc.data());
}

export async function getJob(id: string) {
  const docRef = doc(db, 'studioJobs', id);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? docSnap.data() : null;
}

export async function requestReplay(jobId: string) {
  const replayId = uuidv4();
  const jobRef = doc(db, 'studioJobs', jobId);

  await updateDoc(jobRef, {
    'output.replayId': replayId,
    updatedAt: serverTimestamp(),
  });

  return { ok: true, jobId, replayId };
}
