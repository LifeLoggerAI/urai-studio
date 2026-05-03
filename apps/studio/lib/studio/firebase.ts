export const firebaseDiagnostics = {
  configured: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || null,
  hostingSite: process.env.NEXT_PUBLIC_HOSTING_SITE || 'urai-studio',
  adminAvailable: !!(process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.FIREBASE_PROJECT_ID),
};
