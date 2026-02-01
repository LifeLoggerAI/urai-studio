# URAI Studio Architecture

This document outlines the architecture of the URAI Studio application, including the data model, job pipeline, state machine, and idempotency mechanisms.

## Data Model

The Firestore database is structured into the following collections:

- `users`: Stores user profiles and roles.
- `contentItems`: The central repository for media content.
- `contentItems/{itemId}/uploads`: Tracks uploaded media files.
- `contentItems/{itemId}/versions`: Represents different processed versions of a content item.
- `jobs`: The job queue for all processing tasks.
- `jobRuns`: Records individual attempts to run a job.
- `auditLogs`: A log of all significant events in the system.

## Job Pipeline

The job pipeline is orchestrated by Cloud Functions and is designed to be a robust and idempotent state machine.

1. **Upload:** The client uploads a raw media file to a signed URL in Cloud Storage.
2. **Validation:** A Cloud Function validates the uploaded file (type, size, etc.).
3. **Job Creation:** A chain of jobs is created for the new version (e.g., transcode, captions, thumbnail).
4. **Processing:** A worker function processes the jobs in the queue, with locking to prevent double-processing.
5. **Output:** The processed files are written to Cloud Storage.

## State Machine and Idempotency

The job processing system is designed to be a reliable state machine.

- **Deterministic Job Creation:** The same version will not create duplicate jobs.
- **Worker Locking:** The `lockedBy` and `lockExpiresAt` fields prevent multiple workers from processing the same job.
- **Retries:** The `attempts` field is incremented on each retry, with a maximum number of retries.

