# URAI Studio — Friend Mode v1 (Definition + Checklist)

## Friend Mode Definition
A non-technical friend can:
1) Open Studio URL
2) Sign in
3) Paste prompt or upload media
4) Click Generate
5) See progress
6) Download outputs (mp4 + thumbnail + captions)
7) Retry failures themselves

## Minimum Collections
- studios
- memberships
- clipRequests
- jobs
- jobRuns
- assets
- outputs
- deadLetters
- auditLogs

## Job State Machine
QUEUED -> RUNNING -> RENDERING -> UPLOADING -> SUCCEEDED
                         \-> FAILED

## Acceptance Tests (must pass)
1) Create job (prompt-only) -> appears instantly in job list
2) Job detail page opens and shows live status
3) Simulate fail -> shows FAILED; retry updates attempt+state
4) Refresh mid-job -> state still correct
5) Security: cannot read other studio jobs/assets/outputs

## v1 Scope (ship fast)
- Prompt-only job creation
- Job list + detail + retry
- Outputs list (paths) when SUCCEEDED
- No publishing / dialpad ingest in v1
