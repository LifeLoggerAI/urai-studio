# Authenticated private media delivery

Jobs working source fbed3acb0e55f3abbbf15d3cba7fb82d1a2dd3bd returns
nonbearer `urai-authenticated-private-media-v1` descriptors for short/long movies.
POST `{bridge: "short" | "longform", delivery: descriptor}` to
`/api/studio/video-factory/private-media` with the current Firebase ID token.
Studio verifies current revoked-token, edit-role and tenant authority, injects
the verified owner/tenant, and forwards only the validated delivery fields to
the server-configured protected Jobs bridge. Caller URLs and identity fields are
rejected. Enablement and exact endpoint/credential remain required and are read
again after asynchronous authorization and throughout delivery.

The adapter requires the expected MIME, refuses redirects, streams at most
64 KiB after each current authorization check, caps upstream chunks at one MiB
and total bytes at two GiB, and retains the existing 55-second byte-request
deadline. Abort, offboarding, token/tenant/config changes and upstream failures
stop delivery. No Storage bearer URL is issued by this adapter. Already
delivered bytes cannot be recalled, and historical signed URLs remain subject
to their actual expiry/object lifecycle. Native production delivery, literal
playback, captions, mobile/XR performance and artistic acceptance remain gates.
