# URAI_STUDIO_LOCK

- **UTC Locked At:** 2026-02-04 04:52:35 UTC
- **Repo:** /home/user/urai-studio
- **Git Branch:** main
- **Git Commit:** 2bed905e5a43ce1ad217054bed64da21698a8a27
- **Firebase Project:** urai-studio
- **Tag Target:** v1.0.0-studio
- **Functions Deploy Status:** FAILED
- **Log:** /tmp/urai_studio_ship_lock_20260204_045153.log

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
✔  functions: required API cloudbuild.googleapis.com is enabled
✔  artifactregistry: required API artifactregistry.googleapis.com is enabled
✔  functions: required API cloudfunctions.googleapis.com is enabled
⚠  functions: Runtime Node.js 20 will be deprecated on 2026-04-30 and will be decommissioned on 2026-10-31, after which you will not be able to deploy without upgrading. Consider upgrading now to avoid disruption. See https://cloud.google.com/functions/docs/runtime-support for full details on the lifecycle policy
⚠  functions: package.json indicates an outdated version of firebase-functions. Please upgrade using npm install --save firebase-functions@latest in your functions directory.
⚠  functions: Please note that there will be breaking changes when you upgrade.
i  functions: Loading and analyzing source code for codebase default to determine what to deploy
Serving at port 8910

i  functions: preparing functions directory for uploading...
i  functions: packaged /home/user/urai-studio/functions (80.57 KB) for uploading
There was an error retrieving the Firestore database. Currently, the database id is set to (default), make sure it exists.

Error: HTTP Error: 403, Cloud Firestore API has not been used in project urai-studio before or it is disabled. Enable it by visiting https://console.developers.google.com/apis/api/firestore.googleapis.com/overview?project=urai-studio then retry. If you enabled this API recently, wait a few minutes for the action to propagate to our systems and retry.
```

### functions:list
```
┌──────────┬─────────┬─────────┬──────────┬────────┬─────────┐
│ Function │ Version │ Trigger │ Location │ Memory │ Runtime │
└──────────┴─────────┴─────────┴──────────┴────────┴─────────┘
```
