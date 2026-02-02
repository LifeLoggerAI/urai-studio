
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import {getStorage} from "firebase-admin/storage";
import {v4 as uuidv4} from "uuid";
import * as sharp from "sharp";
import {spawn} from "child_process";

admin.initializeApp();

const db = admin.firestore();
const storage = getStorage();

const MAX_UPLOAD_SIZE_MB = 500;

// Creates a studioUsers document for a new user
export const createUserDoc = functions.auth.user().onCreate(async (user) => {
    const {uid, email} = user;
    await db.collection("studioUsers").doc(uid).set({
        email,
        plan: "free",
        role: "user",
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
});

// Create a signed URL for uploading a file
export const createUploadUrl = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to upload a file.");
    }

    const {fileName, mimeType, bytes, title, description} = data;
    const {uid} = context.auth;

    if (bytes > MAX_UPLOAD_SIZE_MB * 1024 * 1024) {
        throw new functions.https.HttpsError("invalid-argument", `File size exceeds the ${MAX_UPLOAD_SIZE_MB}MB limit.`);
    }

    const userDoc = await db.collection("studioUsers").doc(uid).get();
    if (!userDoc.exists || !userDoc.data()?.isActive) {
        throw new functions.https.HttpsError("permission-denied", "Your account is not active.");
    }

    const contentId = uuidv4();
    const storagePath = `uploads/${uid}/${contentId}/${fileName}`;

    const contentItem = {
        ownerUid: uid,
        title: title || "Untitled",
        description: description || null,
        status: "draft",
        input: {},
        storagePath,
        fileName,
        mimeType,
        bytes,
        outputs: [],
        error: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    await db.collection("contentItems").doc(contentId).set(contentItem);

    const [uploadUrl] = await storage.bucket().file(storagePath).getSignedUrl({
        action: "write",
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
        version: "v4",
        contentType: mimeType,
    });

    await db.collection("auditLogs").add({
        actorUid: uid,
        action: "createUploadUrl",
        target: `contentItems/${contentId}`,
        metadata: {fileName, mimeType, bytes},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });


    return {contentId, uploadUrl, storagePath};
});

// Finalize an upload and create a job
export const finalizeUpload = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to finalize an upload.");
    }

    const {contentId, storagePath, mimeType, bytes} = data;
    const {uid} = context.auth;

    const contentItemRef = db.collection("contentItems").doc(contentId);
    const contentItemDoc = await contentItemRef.get();

    if (!contentItemDoc.exists || contentItemDoc.data()?.ownerUid !== uid) {
        throw new functions.https.HttpsError("permission-denied", "You do not have permission to finalize this upload.");
    }

    await contentItemRef.update({
        status: "uploaded",
        input: {
            storagePath,
            mimeType,
            bytes,
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const jobId = uuidv4();
    await db.collection("jobs").doc(jobId).set({
        type: "processContent",
        contentId,
        ownerUid: uid,
        status: "queued",
        attempt: 1,
        log: [],
        result: null,
        error: null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await db.collection("auditLogs").add({
        actorUid: uid,
        action: "finalizeUpload",
        target: `contentItems/${contentId}`,
        metadata: {jobId},
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });


    return {ok: true, jobId};
});


// Process a job when it is created
export const runJob = functions.firestore.document("jobs/{jobId}").onCreate(async (snap, context) => {
    const job = snap.data();
    const {jobId} = context.params;
    const {contentId, ownerUid} = job;

    const jobRef = db.collection("jobs").doc(jobId);
    const contentItemRef = db.collection("contentItems").doc(contentId);

    await jobRef.update({status: "running", updatedAt: admin.firestore.FieldValue.serverTimestamp()});

    try {
        const contentItemDoc = await contentItemRef.get();
        const contentItem = contentItemDoc.data();
        if (!contentItem) {
            throw new Error("Content item not found");
        }

        const {storagePath, mimeType, fileName} = contentItem;
        const bucket = storage.bucket();
        const file = bucket.file(storagePath);
        const [metadata] = await file.getMetadata();

        const outputs = [];
        const outputPrefix = `outputs/${ownerUid}/${contentId}`;

        if (mimeType.startsWith("image/")) {
            const sizes = {thumb: 128, medium: 640, large: 1920};
            for (const [name, size] of Object.entries(sizes)) {
                const outputStoragePath = `${outputPrefix}/${name}_${fileName}`;
                const outputFile = bucket.file(outputStoragePath);

                const transformer = sharp().resize(size, size, {fit: "inside"});
                const stream = file.createReadStream().pipe(transformer).pipe(outputFile.createWriteStream());

                await new Promise((resolve, reject) => {
                    stream.on("finish", resolve);
                    stream.on("error", reject);
                });

                const [outputMetadata] = await outputFile.getMetadata();
                const [url] = await outputFile.getSignedUrl({action: "read", expires: Date.now() + 60 * 60 * 1000});

                outputs.push({
                    type: `${name}`,
                    storagePath: outputStoragePath,
                    url,
                    bytes: outputMetadata.size,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });
            }
        } else if (mimeType.startsWith("audio/")) {
            // Audio processing with ffprobe (optional)
            const outputStoragePath = `${outputPrefix}/normalized_${fileName}`;
            await file.copy(bucket.file(outputStoragePath));
            const outputFile = bucket.file(outputStoragePath);
            const [outputMetadata] = await outputFile.getMetadata();
            const [url] = await outputFile.getSignedUrl({action: "read", expires: Date.now() + 60 * 60 * 1000});
            outputs.push({
                type: "normalized",
                storagePath: outputStoragePath,
                url,
                bytes: outputMetadata.size,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

        } else if (mimeType.startsWith("video/")) {
            // Video processing with ffmpeg (optional)
            const outputStoragePath = `${outputPrefix}/normalized_${fileName}`;
            await file.copy(bucket.file(outputStoragePath));
            const outputFile = bucket.file(outputStoragePath);
            const [outputMetadata] = await outputFile.getMetadata();
            const [url] = await outputFile.getSignedUrl({action: "read", expires: Date.now() + 60 * 60 * 1000});
            outputs.push({
                type: "normalized",
                storagePath: outputStoragePath,
                url,
                bytes: outputMetadata.size,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

        } else {
            // Copy unknown file types
            const outputStoragePath = `${outputPrefix}/normalized_${fileName}`;
            await file.copy(bucket.file(outputStoragePath));
            const outputFile = bucket.file(outputStoragePath);
            const [outputMetadata] = await outputFile.getMetadata();
            const [url] = await outputFile.getSignedUrl({action: "read", expires: Date.now() + 60 * 60 * 1000});
            outputs.push({
                type: "normalized",
                storagePath: outputStoragePath,
                url,
                bytes: outputMetadata.size,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }

        await contentItemRef.update({
            status: "ready",
            outputs,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await jobRef.update({
            status: "succeeded",
            result: {outputs: outputs.map((o) => o.storagePath)},
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

    } catch (error: any) {
        await contentItemRef.update({
            status: "failed",
            error: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        await jobRef.update({
            status: "failed",
            error: error.message,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});


// Refresh the signed URLs for a content item's outputs
export const refreshOutputUrls = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "You must be logged in to refresh output URLs.");
    }

    const {contentId} = data;
    const {uid} = context.auth;

    const contentItemRef = db.collection("contentItems").doc(contentId);
    const contentItemDoc = await contentItemRef.get();

    if (!contentItemDoc.exists || contentItemDoc.data()?.ownerUid !== uid) {
        throw new functions.https.HttpsError("permission-denied", "You do not have permission to refresh these URLs.");
    }

    const contentItem = contentItemDoc.data();
    if (!contentItem || !contentItem.outputs) {
        return {outputs: []};
    }

    const refreshedOutputs = await Promise.all(
        contentItem.outputs.map(async (output: any) => {
            const [url] = await storage.bucket().file(output.storagePath).getSignedUrl({
                action: "read",
                expires: Date.now() + 60 * 60 * 1000, // 1 hour
            });
            return {...output, url};
        }),
    );

    await contentItemRef.update({
        outputs: refreshedOutputs,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {outputs: refreshedOutputs};
});
