
import { collection, getDocs, getDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "./firebaseClient";

export const listJobs = async (limit = 50) => {
  const jobsCollection = collection(firestore, "studioJobs");
  const snapshot = await getDocs(jobsCollection);
  return snapshot.docs.map((doc) => doc.data());
};

export const getJob = async (id: string) => {
  const jobDoc = doc(firestore, "studioJobs", id);
  const snapshot = await getDoc(jobDoc);
  return snapshot.data();
};

export const requestReplay = async (jobId: string) => {
  const jobDoc = doc(firestore, "studioJobs", jobId);
  await updateDoc(jobDoc, { "output.replayId": "replay-requested", updatedAt: serverTimestamp() });
  return { ok: true, jobId, replayId: "replay-requested" };
};
