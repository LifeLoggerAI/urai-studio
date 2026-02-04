# URAI_STUDIO_LOCK

- **UTC Locked At:** 2026-02-04 04:57:41 UTC
- **Repo:** /home/user/urai-studio
- **Git Branch:** main
- **Git Commit:** 226573732557a72a295f5d03dc2d9e93f6c29466
- **Firebase Project:** urai-studio
- **Tag Target:** v1.0.0-studio
- **Functions Deploy Status:** FAILED
- **Log:** /tmp/urai_studio_ship_lock_20260204_045625.log

## Deploy Notes
❌ Deploy failed.

Reason:
- firebase deploy failed (see log)

### deploy output (tail)
```

=== Deploying to 'urai-studio'...

i  deploying functions
i  functions: preparing codebase default for deployment
i  functions: ensuring required API cloudfunctions.googleapis.com is enabled...
i  functions: ensuring required API cloudbuild.googleapis.com is enabled...
i  artifactregistry: ensuring required API artifactregistry.googleapis.com is enabled...
✔  functions: required API cloudfunctions.googleapis.com is enabled
✔  functions: required API cloudbuild.googleapis.com is enabled
✔  artifactregistry: required API artifactregistry.googleapis.com is enabled
⚠  functions: Runtime Node.js 20 will be deprecated on 2026-04-30 and will be decommissioned on 2026-10-31, after which you will not be able to deploy without upgrading. Consider upgrading now to avoid disruption. See https://cloud.google.com/functions/docs/runtime-support for full details on the lifecycle policy
i  functions: Loading and analyzing source code for codebase default to determine what to deploy
Serving at port 8731

Error: Failed to parse build specification:
- FirebaseError Unexpected key extensions. You may need to install a newer version of the Firebase CLI.
```

### functions:list
```
┌──────────┬─────────┬─────────┬──────────┬────────┬─────────┐
│ Function │ Version │ Trigger │ Location │ Memory │ Runtime │
└──────────┴─────────┴─────────┴──────────┴────────┴─────────┘
```
