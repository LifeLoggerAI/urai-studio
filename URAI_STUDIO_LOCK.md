# URAI_STUDIO_LOCK

- **UTC Locked At:** 2026-02-04 05:24:50 UTC
- **Repo:** /home/user/urai-studio
- **Git Branch:** main
- **Git Commit:** 21920f2d5d2256bce479e5299c133895eaec9e08
- **Firebase Project:** urai-studio
- **Tag Target:** v1.0.0-studio
- **Functions Deploy Status:** OK
- **Log:** /tmp/urai_studio_ship_lock_20260204_052344.log

## Deploy Notes
✅ Functions deploy completed successfully.

### functions:list
```
┌────────────────┬─────────┬───────────────────────────────────────────────────┬─────────────┬────────┬──────────┐
│ Function       │ Version │ Trigger                                           │ Location    │ Memory │ Runtime  │
├────────────────┼─────────┼───────────────────────────────────────────────────┼─────────────┼────────┼──────────┤
│ approvePublish │ v2      │ callable                                          │ us-central1 │ ---    │ nodejs20 │
├────────────────┼─────────┼───────────────────────────────────────────────────┼─────────────┼────────┼──────────┤
│ bootstrapOwner │ v2      │ callable                                          │ us-central1 │ ---    │ nodejs20 │
├────────────────┼─────────┼───────────────────────────────────────────────────┼─────────────┼────────┼──────────┤
│ createJob      │ v2      │ callable                                          │ us-central1 │ ---    │ nodejs20 │
├────────────────┼─────────┼───────────────────────────────────────────────────┼─────────────┼────────┼──────────┤
│ jobrunner      │ v2      │ scheduled                                         │ us-central1 │ ---    │ nodejs20 │
├────────────────┼─────────┼───────────────────────────────────────────────────┼─────────────┼────────┼──────────┤
│ onjobwrite     │ v2      │ https                                             │ us-central1 │ ---    │ nodejs20 │
├────────────────┼─────────┼───────────────────────────────────────────────────┼─────────────┼────────┼──────────┤
│ onusercreate   │ v2      │ providers/cloud.auth/eventTypes/user.beforeCreate │ us-central1 │ ---    │ nodejs20 │
└────────────────┴─────────┴───────────────────────────────────────────────────┴─────────────┴────────┴──────────┘
```
