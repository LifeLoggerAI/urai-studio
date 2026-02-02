import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const createJob = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const uid = context.auth.uid;
    const db = admin.firestore();

    const userRef = db.doc(`studioUsers/${uid}`);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
    }

    const user = userDoc.data()!;

    if (user.role !== "owner" && user.role !== "admin" && user.role !== "editor") {
        throw new functions.https.HttpsError(
            "permission-denied",
            "You do not have permission to create a job."
        );
    }

    // TODO: Add payload validation here.

    const jobRef = db.collection("jobs").doc();
    const auditLogRef = db.collection("auditLogs").doc();

    const batch = db.batch();

    batch.set(jobRef, {
        ...data,
        state: "queued",
        createdBy: uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.set(auditLogRef, {
        actorUid: uid,
        action: "create_job",
        target: jobRef.path,
        before: null,
        after: data,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ip: context.rawRequest.ip,
        userAgent: context.rawRequest.headers["user-agent"],
    });

    await batch.commit();

    return { jobId: jobRef.id };
});
