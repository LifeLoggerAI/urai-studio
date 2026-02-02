import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

export const bootstrapOwner = functions.https.onCall(async (data, context) => {
    const db = admin.firestore();

    // Ensure the user is authenticated.
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    const uid = context.auth.uid;
    const email = context.auth.token.email;

    const systemConfigRef = db.doc("system/config");

    return await db.runTransaction(async (transaction) => {
        const systemConfigDoc = await transaction.get(systemConfigRef);

        if (!systemConfigDoc.exists) {
            throw new functions.https.HttpsError("not-found", "System config not found.");
        }

        const config = systemConfigDoc.data()!;

        if (!config.allowBootstrapOwner) {
            throw new functions.https.HttpsError(
                "failed-precondition",
                "Bootstrap owner is not allowed."
            );
        }

        if (config.bootstrapOwnerEmail && config.bootstrapOwnerEmail !== email) {
            throw new functions.https.HttpsError(
                "permission-denied",
                "Email does not match bootstrap owner email."
            );
        }

        const userRef = db.doc(`studioUsers/${uid}`);
        const userDoc = await transaction.get(userRef);

        // Create or update the user with the owner role.
        if (userDoc.exists) {
            transaction.update(userRef, { 
                role: "owner",
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
        } else {
            transaction.set(userRef, {
                uid,
                email,
                displayName: context.auth.token.name || "",
                role: "owner",
                disabled: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        // Disable future bootstrapping and log the action.
        transaction.update(systemConfigRef, { allowBootstrapOwner: false });

        const auditLogRef = db.collection("auditLogs").doc();
        transaction.set(auditLogRef, {
            actorUid: uid,
            action: "bootstrap_owner",
            target: `studioUsers/${uid}`,
            before: null,
            after: { role: "owner" },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            ip: context.rawRequest.ip,
            userAgent: context.rawRequest.headers["user-agent"],
        });

        return { message: "Bootstrap successful. You are now the owner." };
    });
});
