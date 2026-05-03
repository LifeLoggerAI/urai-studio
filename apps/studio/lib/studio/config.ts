export const studioConfig = {
  service: 'urai-studio',
  name: 'URAI Studio',
  version: process.env.npm_package_version || '0.1.0',
  environment: process.env.NODE_ENV || 'development',
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'unconfigured',
  hostingSite: process.env.NEXT_PUBLIC_HOSTING_SITE || 'urai-studio',
};
