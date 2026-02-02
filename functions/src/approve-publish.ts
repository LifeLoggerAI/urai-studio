
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const approvePublish = functions.https.onCall(async (data, context) => {
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

    if (user.role !== "owner" && user.role !== "admin") {
        throw new functions.https.HttpsError(
            "permission-denied",
            "You do not have permission to approve a publish."
        );
    }

    const { publishId } = data;

    if (!publishId) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            "The function must be called with a 'publishId'."
        );
    }

    const publishRef = db.doc(`publishes/${publishId}`);
    const auditLogRef = db.collection("auditLogs").doc();

    return await db.runTransaction(async (transaction) => {
        const publishDoc = await transaction.get(publishRef);

        if (!publishDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Publish document not found.");
        }

        const publishData = publishDoc.data()!;

        if (publishData.state !== "draft") {
            throw new functions.https.HttpsError(
                "failed-precondition",
                "Publish can only be approved from a draft state."
            );
        }
        
        const beforeData = {
            state: publishData.state,
            approvedBy: publishData.approvedBy || null
        };
        
        const afterData = {
            state: "approved",
            approvedBy: uid,
        };

        transaction.update(publishRef, {
            ...afterData,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        transaction.set(auditLogRef, {
            actorUid: uid,
            action: "approve_publish",
            target: publishRef.path,
            before: beforeData,
            after: afterData,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            ip: context.rawRequest.ip,
            userAgent: context.rawRequest.headers["user-agent"],
        });

        return { message: `Publish ${publishId} approved.` };
    });
});
