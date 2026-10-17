# Studio private byte delivery

The export HTTP endpoint admits browser preflight only for the canonical
`https://uraistudio.com` / `https://www.uraistudio.com` origins and the current
Firebase project's exact Hosting and preview namespaces. `OPTIONS` accepts only
`GET` with `Authorization`, without reading Auth, Firestore, or Storage. Other
origins are rejected before token or data access; CORS has no wildcard or
credentials. The client follows the explicit current-project HTTPS function URL,
so its request does not resolve against a local browser origin. The canonical
Studio app has no native API-origin or Capacitor configuration in this source.

Private media descriptors from Jobs contain an exact authority fingerprint,
deadline and immutable Storage generation. They confer no byte authority. The
same-origin `/api/studio/video-factory/private-media/` route uses the existing
Firebase token and server-owned Studio edit role, binds the tenant and owner on
the server, and forwards only the strict `deliver` shape through the existing
protected Jobs bridge. Every admitted chunk is at most 64 KiB and rechecks the
current identity and role. Jobs separately rereads current consent, deletion
fences, source and output identity for each chunk. No GCS signed URL is issued.
Studio's own current data-rights deletion fence also blocks movie dispatch and
every private proxy chunk, including the reversible deletion window; a foreign
or permanent local fence fails closed.
The actual Firebase browser adapters force a fresh token and retain the exact
current Firebase user object across descriptor, token and body awaits. Signout,
account change or a replacement session cancels the body and prevents a Blob
from reaching the caller. Private movie proxy and browser deadlines start before
authentication and are at most 50 seconds, below Jobs' 55-second cleanup bound.

`getStudioDataExportDownload` returns a nonbearer descriptor for the exact
current-project `downloadStudioDataExport` function. The byte endpoint requires
a current Firebase Bearer token and checks revocation, the current canonical C7
`data.export` receipt, local and central deletion fences, immutable package
generation, checksum and both deadlines. These checks run again after Storage
awaits and before each admitted 64 KiB chunk. Already delivered bytes cannot be
recalled. The client validates the current-project host and function path
before obtaining a token and disables redirects, ambient cookies and caching.

Export preparation creates a durable private package intent before Storage
writes and admits a ready package only under the same live receipt. The
scheduled reconciler invalidates expired or revoked exports before deleting
an observed checksum-bound generation. Missing objects from uncertain
preparation remain pending until an object can be reconciled; absence alone
cannot prove erasure. Studio deletion activates its delivery fence before the
backup write, makes it permanent before record purge, and deletes known export
generations. Its receipts explicitly scope those records and generations and
leave `globalErasureVerified: false`; deletion backups are generation-bound, retained through the
restore window and active legal hold, and reconciled after the existing
30-day purge deadline and central Privacy owns Firebase Auth deletion.

The actual handler suite covers creation, token/receipt/source/generation
changes, post-await withdrawal, midstream withdrawal, deletion cancellation,
expiry cleanup and uncertain write reconciliation. The actual client/route
suite covers endpoint validation before token access, server-bound identity,
role/token withdrawal, chunk bounds and cancellation. Hosted exact-head
`Studio authenticated data-rights emulator` additionally loads the compiled
Functions and real rules for creator → descriptor → bytes → withdrawal and
direct Storage denial. Its result remains pending until that workflow passes.
Synthetic fixtures grant no production authority. No paid provider, deployed
private-family film, device playback or Golden Master acceptance is claimed.
