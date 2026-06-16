import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

type JobKind = "clip_render" | "thumbnail" | "captions" | "package_export" | "publish";

type CreateJobPayload = {
    projectId: string;
    kind: JobKind;
    title?: string;
    prompt?: string;
    priority?: number;
    options?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
};

const allowedKinds: JobKind[] = [
    "clip_render",
    "thumbnail",
    "captions",
    "package_export",
    "publish",
];

const isRecord = (value: unknown): value is Record<string, unknown> => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readString = (value: unknown, field: string, required = false): string | undefined => {
    if (value === undefined || value === null) {
        if (required) {
            throw new functions.https.HttpsError("invalid-argument", `${field} is required.`);
        }
        return undefined;
    }

    if (typeof value !== "string") {
        throw new functions.https.HttpsError("invalid-argument", `${field} must be a string.`);
    }

    const trimmed = value.trim();
    if (!trimmed && required) {
        throw new functions.https.HttpsError("invalid-argument", `${field} cannot be empty.`);
    }

    return trimmed || undefined;
};

const readRecord = (value: unknown, field: string): Record<string, unknown> | undefined => {
    if (value === undefined || value === null) return undefined;
    if (!isRecord(value)) {
        throw new functions.https.HttpsError("invalid-argument", `${field} must be an object.`);
    }
    return value;
};

const normalizePriority = (value: unknown): number => {
    if (value === undefined || value === null) return 0;
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new functions.https.HttpsError("invalid-argument", "priority must be a finite number.");
    }
    return Math.max(0, Math.min(100, Math.trunc(value)));
};

const normalizeCreateJobPayload = (data: unknown): CreateJobPayload => {
    if (!isRecord(data)) {
        throw new functions.https.HttpsError("invalid-argument", "Job payload must be an object.");
    }

    const projectId = readString(data.projectId, "projectId", true)!;
    const kind = readString(data.kind, "kind", true) as JobKind;

    if (!allowedKinds.includes(kind)) {
        throw new functions.https.HttpsError(
            "invalid-argument",
            `Unsupported job kind: ${kind}.`
        );
    }

    return {
        projectId,
        kind,
        title: readString(data.title, "title"),
        prompt: readString(data.prompt, "prompt"),
        priority: normalizePriority(data.priority),
        options: readRecord(data.options, "options"),
        metadata: readRecord(data.metadata, "metadata"),
    };
};

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

    const payload = normalizeCreateJobPayload(data);

    const jobRef = db.collection("jobs").doc();
    const auditLogRef = db.collection("auditLogs").doc();

    const batch = db.batch();

    batch.set(jobRef, {
        ...payload,
        id: jobRef.id,
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
        after: payload,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        ip: context.rawRequest.ip,
        userAgent: context.rawRequest.headers["user-agent"],
    });

    await batch.commit();

    return { jobId: jobRef.id };
});
