# URAI Studio Lockdown

This document provides the exact steps for running, deploying, and troubleshooting the URAI Studio application. It also covers user roles and other security-related information.

## Local Development

1. **Install Dependencies:** `pnpm install`
2. **Run the Development Server:** `pnpm dev`

## Deployment

1. **Build the Application:** `pnpm build`
2. **Deploy to Firebase:** `firebase deploy`

## User Roles

- **Admin:** Users with the `admin` role have full access to the system.
- **User:** Regular users have limited access to their own data.

## Troubleshooting

- **Check the logs:** The `auditLogs` collection in Firestore contains a log of all significant events.
- **Retry failed jobs:** Admins can retry failed jobs from the admin dashboard.
