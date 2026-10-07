# Authenticated private media delivery

Jobs working source a3c5d90d2116516eca6b9dc93969c71c9024777a returns
nonbearer `urai-authenticated-private-media-v1` descriptors for short/long movies.
POST `{bridge: "short" | "longform", delivery: descriptor}` to
`/api/studio/video-factory/private-media/` with the current Firebase ID token.
Studio verifies current revoked-token, edit-role and tenant authority, injects
the verified owner/tenant, and forwards only the validated delivery fields to
the server-configured protected Jobs bridge. Caller URLs and identity fields are
rejected. Enablement and exact endpoint/credential remain required and are read
again after asynchronous authorization and throughout delivery.

The adapter requires the expected MIME, refuses redirects, streams at most
64 KiB after each current authorization check, caps upstream chunks at one MiB
and total bytes at two GiB. Its 50-second operation deadline starts before
route authentication and stays below Jobs' 55-second cleanup bound. Studio's
own deletion fence and current Firebase browser session also remain mandatory.
Abort, offboarding, token/tenant/config changes and upstream failures
stop delivery. No Storage bearer URL is issued by this adapter. Already
delivered bytes cannot be recalled, and historical signed URLs remain subject
to their actual expiry/object lifecycle. Native production delivery, literal
playback, captions, mobile/XR performance and artistic acceptance remain gates.
