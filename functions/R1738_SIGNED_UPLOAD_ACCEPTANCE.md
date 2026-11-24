# R1738 — Studio signed-upload input guard (draft-only review)

## Source and bounded scope

Parent: Studio #207 exact Git commit `1b161774bf033b00882360342db65a1ce2ba1fac`. This branch changes a dormant helper `functions/src/createUploadUrl.ts`, adds `upload-url-validation.ts` and its 14 local negative/positive validation tests.

**Function not exported:** Current `functions/src/index.ts` does **not** export `createUploadUrl`. A source file existing in the repository does **not** demonstrate that an endpoint has been deployed; do not activate it or add an export as part of this review.

## What is improved

- Require a verified string owner UID supplied from `context.auth.uid`, never from caller data.
- Reject path separators, `..`, controls, leading dot, malformed and overly long filenames.
- Allow listed image/video/audio content types with matching extensions; reject HTML, SVG, executable types and MIME/extension mismatch.
- Require positive, safe-integer, caller-declared bytes no greater than 500 MiB; reject negative, `NaN`, infinity, fractional values and strings.
- Preserve the existing behavior for valid common media uploads and Firestore draft metadata.

## Why this is NOT upload authorization

- The 500 MiB validation applies **only to a caller-supplied declaration at URL issuance**. V4 `getSignedUrl({action:"write",contentType})` here does not by itself prove an enforcement of actual uploaded bytes at GCS. A full solution requires a broker/verified post-upload size and content policy, and may require refusing public signed PUT URLs entirely for private-memory data.
- This code does **not** establish that upload credentials are properly limited to a specific owner, bucket, object generation, consent purpose and retention policy after signing. URL leakage, metadata mismatch, malware scanning, expiry and revoked consent are separately unclosed.
- No Google Cloud access, IAM policy update, app deployment, or positive private rendering is tested by this branch.

## Required follow-through before endpoint activation

Independently inspect actual Firebase exports and deployed functions; identify the bucket policy and V4 signer principal; prove with a controlled isolated provider canary that oversized payloads, wrong content type, session replay, revoked sessions and cross-owner paths fail safely. Restrict signed URL issuance by owner/consent-purpose and application provenance. Preserve legitimate user upload and data-rights workflows. Require security/privacy review and protected green CI.

**Review-only; no merge/deploy/IAM/private writes. Production HOLD / NO-GO.**

