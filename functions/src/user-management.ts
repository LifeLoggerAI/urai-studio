
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

// Helper function to check for owner or admin roles
const ensureAdmin = async (uid: string) => {
    const userRef = db.doc(`studioUsers/${uid}`);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found.");
    }
    const user = userDoc.data()!;
    if (user.role !== "owner" && user.role !== "admin") {
        throw new functions.https.HttpsError(
            "permission-denied",
            "You do not have permission to perform this action."
        );
    }
    return user;
};

export const listUsers = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError(
            "unauthenticated",
            "The function must be called while authenticated."
        );
    }

    await ensureAdmin(context.auth.uid);

    const userRecords = await admin.auth().listUsers();
    const studioUsersSnapshot = await db.collection("studioUsers").get();
    const studioUsers = studioUsersSnapshot.docs.reduce((acc, doc) => {
        acc[doc.id] = doc.data();
        return acc;
    }, {} as { [key: string]: admin.firestore.DocumentData });

    const combinedUsers = userRecords.users.map(user => {
        const studioUser = studioUsers[user.uid] || {};
        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            disabled: user.disabled,
            photoURL: user.photoURL,
            metadata: user.metadata,
            ...studioUser // This will overwrite with studioUser fields if they exist
        };
    });

    return { users: combinedUsers };
});

export const updateUserRole = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    const adminUser = await ensureAdmin(context.auth.uid);
    
    const { targetUid, newRole } = data;

    if (!targetUid || !newRole) {
        throw new functions.https.HttpsError("invalid-argument", "'targetUid' and 'newRole' are required.");
    }

    // Prevent an admin from elevating another user to owner
    if (newRole === "owner" && adminUser.role !== "owner") {
        throw new functions.https.HttpsError("permission-denied", "Only an owner can assign the owner role.");
    }

    // Prevent a user from changing their own role
    if (context.auth.uid === targetUid) {
        throw new functions.https.HttpsError("permission-denied", "You cannot change your own role.");
    }

    const targetUserRef = db.doc(`studioUsers/${targetUid}`);
    
    await db.runTransaction(async (transaction) => {
        const targetUserDoc = await transaction.get(targetUserRef);
        if (!targetUserDoc.exists) {
            throw new functions.https.HttpsError("not-found", "Target user not found.");
        }

        const beforeData = targetUserDoc.data();
        transaction.update(targetUserRef, { 
            role: newRole,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const auditLogRef = db.collection("auditLogs").doc();
        transaction.set(auditLogRef, {
            actorUid: context.auth.uid,
            action: "update_user_role",
            target: `studioUsers/${targetUid}`,
            before: { role: beforeData?.role },
            after: { role: newRole },
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    });

    return { message: "User role updated successfully." };
});

export const setUserDisabledStatus = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }

    await ensureAdmin(context.auth.uid);

    const { targetUid, disabled } = data;

    if (!targetUid || typeof disabled !== 'boolean') {
        throw new functions.https.HttpsError("invalid-argument", "'targetUid' and 'disabled' status are required.");
    }

    if (context.auth.uid === targetUid) {
        throw new functions.https.HttpsError("permission-denied", "You cannot disable your own account.");
    }

    await admin.auth().updateUser(targetUid, { disabled });
    
    // Also update the firestore doc if it exists
    const userRef = db.doc(`studioUsers/${targetUid}`);
    const userDoc = await userRef.get();
    if (userDoc.exists) {
        await userRef.update({ 
            disabled,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }

    const auditLogRef = db.collection("auditLogs").doc();
    await auditLogRef.set({
        actorUid: context.auth.uid,
        action: "set_user_disabled_status",
        target: `users/${targetUid}`,
        before: { disabled: !disabled },
        after: { disabled },
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { message: `User disabled status set to ${disabled}.` };
});
