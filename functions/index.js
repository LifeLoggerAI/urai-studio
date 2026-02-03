const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const {
  onCall, 
  HttpsError
} = require("firebase-functions/v2/https");
const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const { beforeUserCreated } = require("firebase-functions/v2/identity");
const logger = require("firebase-functions/logger");

initializeApp();
const db = getFirestore();
const auth = getAuth();

// --- Helper Functions ---

/**
 * Writes an entry to the audit log.
 * @param {object} logData The data for the audit log entry.
 */
const writeAuditLog = async (logData) => {
  try {
    await db.collection("auditLogs").add({
      ...logData,
      createdAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    logger.error("Failed to write audit log:", error, { logData });
  }
};

// --- Auth Triggers ---

/**
 * Sets the initial role for a new user and creates their studioUser profile.
 * The first user can be configured to be an owner.
 */
exports.onusercreate = beforeUserCreated(async (event) => {
  const user = event.data;
  const uid = user.uid;
  
  const configDoc = await db.collection("system").doc("config").get();
  const config = configDoc.data() ?? { allowBootstrapOwner: true };

  let role = "viewer"; // Default role

  // Check if this is the first user and if bootstrap is allowed.
  if (config.allowBootstrapOwner) {
    if (!config.bootstrapOwnerEmail || config.bootstrapOwnerEmail === user.email) {
      const userCount = (await db.collection("studioUsers").limit(1).get()).size;
      if (userCount === 0) {
        role = "owner";
        // Disable bootstrap after the first owner is created.
        await db.collection("system").doc("config").set({ allowBootstrapOwner: false }, { merge: true });
      }
    }
  }

  // Set custom claims
  await auth.setCustomUserClaims(uid, { role });

  // Create the user profile document in Firestore
  await db.collection("studioUsers").doc(uid).set({
    uid: uid,
    email: user.email,
    displayName: user.displayName || "",
    role: role,
    disabled: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  
  await writeAuditLog({
      actorUid: uid,
      action: "create_user",
      target: `studioUsers/${uid}`,
      after: { email: user.email, role: role }
  });

  return;
});


// --- Callable Functions ---

/**
 * 1. bootstrapOwner (Callable)
 * Allows an existing user to be promoted to owner if bootstrap is still enabled.
 */
exports.bootstrapOwner = onCall({ enforceAppCheck: true }, async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "You must be logged in.");
  }

  const configRef = db.collection("system").doc("config");

  return db.runTransaction(async (transaction) => {
    const configDoc = await transaction.get(configRef);
    const config = configDoc.data() ?? { allowBootstrapOwner: true };

    if (!config.allowBootstrapOwner) {
      throw new HttpsError("failed-precondition", "Bootstrap is already disabled.");
    }

    // Promote user to owner
    await auth.setCustomUserClaims(uid, { role: 'owner' });
    const userRef = db.collection("studioUsers").doc(uid);
    transaction.update(userRef, { role: "owner", updatedAt: FieldValue.serverTimestamp() });

    // Disable future bootstraps
    transaction.set(configRef, { allowBootstrapOwner: false }, { merge: true });

    await writeAuditLog({
        actorUid: uid,
        action: "bootstrap_owner",
        target: `studioUsers/${uid}`,
        after: { role: 'owner' }
    });

    return { message: "Successfully bootstrapped owner." };
  });
});


/**
 * 2. createJob (Callable)
 * Allows editor+ to create a new job.
 */
exports.createJob = onCall({ enforceAppCheck: true }, async (request) => {
    const { role } = request.auth?.token || {};
    if (!role || !["editor", "admin", "owner"].includes(role)) {
        throw new HttpsError("permission-denied", "You do not have permission to create jobs.");
    }

    const { projectId, kind, input } = request.data;
    if (!projectId || !kind) {
        throw new HttpsError("invalid-argument", "Missing projectId or kind.");
    }

    const jobRef = db.collection('jobs').doc();
    await jobRef.set({
        projectId,
        kind,
        input: input || {},
        state: "queued",
        priority: 5,
        attempt: 0,
        createdBy: request.auth.uid,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });

    await writeAuditLog({
        actorUid: request.auth.uid,
        action: "create_job",
        target: `jobs/${jobRef.id}`,
        after: { projectId, kind, state: 'queued' }
    });

    return { jobId: jobRef.id };
});

/**
 * 3. approvePublish (Callable)
 * Allows admin/owner to approve a publish request.
 */
exports.approvePublish = onCall({ enforceAppCheck: true }, async (request) => {
    const { role } = request.auth?.token || {};
    if (!role || !["admin", "owner"].includes(role)) {
        throw new HttpsError("permission-denied", "You do not have permission to approve publishes.");
    }

    const { publishId } = request.data;
    if (!publishId) {
        throw new HttpsError("invalid-argument", "Missing publishId.");
    }

    const publishRef = db.collection('publishes').doc(publishId);
    await publishRef.update({
        state: 'approved',
        approvedBy: request.auth.uid,
        updatedAt: FieldValue.serverTimestamp(),
    });

    await writeAuditLog({
        actorUid: request.auth.uid,
        action: "approve_publish",
        target: `publishes/${publishId}`,
        after: { state: 'approved' }
    });

    return { message: "Publish approved." };
});


// --- Scheduled Functions ---

/**
 * 4. jobRunner (Scheduled)
 * Periodically scans for and processes queued jobs.
 */
exports.jobrunner = onSchedule("every 1 minutes", async () => {
    const now = new Date();
    const leaseTime = new Date(now.getTime() + 300 * 1000); // 5-minute lease

    const query = db.collection('jobs')
        .where('state', '==', 'queued')
        .orderBy('priority', 'desc')
        .orderBy('createdAt', 'asc');

    const snapshot = await query.get();
    if (snapshot.empty) {
        logger.log("No queued jobs to process.");
        return;
    }

    // Process jobs
    for (const doc of snapshot.docs) {
        const jobRef = doc.ref;
        const jobData = doc.data();

        try {
            // Attempt to claim the job
            await db.runTransaction(async (transaction) => {
                const freshDoc = await transaction.get(jobRef);
                if (freshDoc.data().state === 'queued') {
                    transaction.update(jobRef, { 
                        state: 'running', 
                        claimedBy: 'jobRunner/instance-1', // Placeholder instance ID
                        leaseExpiresAt: FieldValue.serverTimestamp(),
                        updatedAt: FieldValue.serverTimestamp()
                    });
                } else {
                    return Promise.reject("Job already claimed or not queued.");
                }
            });

            // --- Placeholder Rendering Logic ---
            logger.log(`Simulating processing for job ${jobRef.id} of kind ${jobData.kind}`);
            let output = { placeholder: true, path: `gs://.../renders/${jobRef.id}/output.mp4` };
            await jobRef.collection('events').add({ 
                type: 'log', 
                message: `Processing started for kind: ${jobData.kind}`,
                createdAt: FieldValue.serverTimestamp()
            });
            // --- End Placeholder Logic ---

            // Mark as succeeded
            await jobRef.update({ state: 'succeeded', output, updatedAt: FieldValue.serverTimestamp() });

             await writeAuditLog({
                actorUid: 'system',
                action: 'update_job_state',
                target: `jobs/${jobRef.id}`,
                before: { state: 'running' },
                after: { state: 'succeeded' }
            });

        } catch(error) {
            if (error === "Job already claimed or not queued.") {
                logger.log(`Skipping job ${jobRef.id}, it was claimed by another runner.`);
                continue; // Skip to next job
            }

            logger.error(`Failed to process job ${jobRef.id}:`, error);
            const currentAttempt = jobData.attempt || 0;
            const maxAttempts = (await db.doc('system/config').get()).data()?.maxJobAttempts || 3;
            
            const newState = currentAttempt >= maxAttempts ? 'failed' : 'queued';

            await jobRef.update({
                state: newState,
                error: { message: String(error) },
                attempt: FieldValue.increment(1),
                claimedBy: null, // Release the claim
                leaseExpiresAt: null,
                updatedAt: FieldValue.serverTimestamp(),
            });

             await writeAuditLog({
                actorUid: 'system',
                action: 'update_job_state',
                target: `jobs/${jobRef.id}`,
                before: { state: 'running' },
                after: { state: newState, error: String(error) }
            });
        }
    }
});

// --- Firestore Triggers ---

/**
 * 5. onJobWrite (Firestore Trigger)
 * Enforces valid state transitions on jobs server-side.
 */
exports.onjobwrite = onDocumentWritten("jobs/{jobId}", (event) => {
  const before = event.data?.before.data();
  const after = event.data?.after.data();

  // Only care about updates.
  if (!before || !after) return null;

  // Allow if coming from the backend (no auth context in event-driven functions)
  // This check is imperfect. The security rules are the primary enforcement.
  if (event.authType !== 'USER') {
      return null;
  }

  const validTransitions = {
    queued: ["running"], // Only by backend
    running: ["succeeded", "failed", "canceled"], // Only by backend
    // Client might be able to cancel a queued job
    // queued: ["canceled"],
  };

  // If a client-side update has modified a protected field, revert it.
  const protectedFields = ['state', 'output', 'error', 'claimedBy', 'leaseExpiresAt', 'attempt'];
  let needsRevert = false;
  const revertData = {};

  for (const field of protectedFields) {
      if (before[field] !== after[field]) {
          needsRevert = true;
          revertData[field] = before[field]; // Revert to the old value
      }
  }

  if (needsRevert) {
      logger.warn(`Client-side modification of protected job fields detected for ${event.params.jobId}. Reverting.`);
      return event.data.after.ref.update(revertData);
  }
  
  return null;
});
