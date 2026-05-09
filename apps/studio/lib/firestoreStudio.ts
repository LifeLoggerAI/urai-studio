import { collection, getDocs, getDoc, doc, updateDoc, serverTimestamp, limit as limitQuery, query } from 'firebase/firestore';
import { firestore } from './firebaseClient';

function requireFirestore() {
  if (!firestore) {
    throw new Error('Firebase client is not configured. Studio Firestore operations are unavailable.');
  }

  return firestore;
}

export const listJobs = async (max = 50) => {
  const db = requireFirestore();
  const jobsCollection = collection(db, 'studioJobs');
  const snapshot = await getDocs(query(jobsCollection, limitQuery(max)));
  return snapshot.docs.map((item) => item.data());
};

export const getJob = async (id: string) => {
  const db = requireFirestore();
  const jobDoc = doc(db, 'studioJobs', id);
  const snapshot = await getDoc(jobDoc);
  return snapshot.data();
};

export const requestReplay = async (jobId: string) => {
  const db = requireFirestore();
  const jobDoc = doc(db, 'studioJobs', jobId);
  await updateDoc(jobDoc, { 'output.replayId': 'replay-requested', updatedAt: serverTimestamp() });
  return { ok: true, jobId, replayId: 'replay-requested' };
};
