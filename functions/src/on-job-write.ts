
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();

const VALID_TRANSITIONS: { [key: string]: string[] } = {
    queued: ["running", "canceled"],
    running: ["succeeded", "failed", "canceled"],
    succeeded: [],
    failed: ["queued"], // Allow requeueing
    canceled: [],
};

export const onJobWrite = functions.firestore
    .document("jobs/{jobId}")
    .onWrite(async (change, context) => {
        const { jobId } = context.params;

        const before = change.before.data();
        const after = change.after.data();

        // If the document is new or deleted, no transition to validate.
        if (!before || !after) {
            return;
        }

        const beforeState = before.state;
        const afterState = after.state;

        if (beforeState !== afterState) {
            const allowedStates = VALID_TRANSITIONS[beforeState];

            if (!allowedStates || !allowedStates.includes(afterState)) {
                console.warn(`Illegal state transition on job ${jobId} from ${beforeState} to ${afterState}. Reverting.`);
                
                // Revert the change.
                await change.after.ref.set(before, { merge: true });

                // Log the illegal attempt.
                await db.collection("jobs").doc(jobId).collection("events").add({
                    type: "log",
                    message: `Illegal state transition attempted from ${beforeState} to ${afterState}. Change reverted.`,
                    data: { 
                        actor: "onJobWrite trigger",
                        from: beforeState, 
                        to: afterState 
                    },
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Write to audit log
                await db.collection("auditLogs").add({
                    actorUid: "system",
                    action: "illegal_job_state_transition",
                    target: `jobs/${jobId}`,
                    before: { state: beforeState },
                    after: { state: afterState },
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    reason: "Transition not allowed by onJobWrite trigger"
                });

                return;
            }

            // If the transition is valid, log it.
            console.log(`Valid state transition on job ${jobId} from ${beforeState} to ${afterState}.`);
            await db.collection("jobs").doc(jobId).collection("events").add({
                type: "state_change",
                message: `Job state changed from ${beforeState} to ${afterState}`,
                data: { from: beforeState, to: afterState },
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
    });
