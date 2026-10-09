# Current source binding for Studio diagnostic captures

The inherited video workflow used mutable dependency installation and pinned
Spatial `ff6f3df71a18b7ac6a2e5b7872b2fd0e802dbe3b`. Its receipts remain
historical evidence of that source. They do not accept the current release owner.

The workflow now uses frozen dependencies and proves the Studio source is clean
after installation and build, before diagnostic output generation. It captures
the freshly read Spatial #1636 owner at
`fe0f7fd2718e5594f9f572ccd4fb66301357639c`. This pin binds an unfrozen working convergence head; it is not
independently approved or production verified. A dependency-free guard freshly reads
that exact GitHub owner before capture and after both MP4 compositions. A moved, closed, forked or
unavailable owner fails the diagnostic workflow. The clone and route deployment
fingerprints must match the configured exact SHA. Artifact names include Studio
SHA, Spatial SHA and native run identity.

The owner read has a ten-second deadline and streams at most one MiB before
parsing. Oversized or broken streams are cancelled and produce fixed errors
without response details or credentials.

Manual diagnostic runs may provide `spatial_source_sha` after freshly reading
Spatial #1636. The input selects only the exact capture source and is rejected
unless it is a lowercase forty-character SHA matching that open canonical owner.
It uses the same before/after guard, clone identity and route fingerprints as
the committed comparison pin. An unavailable or moved owner still fails closed.
This avoids source commits merely to dispatch a diagnostic for a newer head;
it does not admit source to a release or confer approval. Runs without the input
use the committed comparison pin above and fail if that pin is no longer current.
Every successor requires fresh capture evidence; predecessor acceptance never transfers.
Both source read receipts remain observation-only. They certify no independent
review, artistic acceptance, private memory, provider readiness, device, public
release, production readback or Golden Master. No paid provider is invoked.
