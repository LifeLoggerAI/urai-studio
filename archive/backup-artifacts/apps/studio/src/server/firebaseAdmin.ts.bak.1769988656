
import * as admin from 'firebase-admin';

// A private variable to cache the initialized Firebase Admin SDK instance.
// This prevents re-initialization on every server-side call, improving performance.
let cachedAdmin: admin.app.App | null = null;

// The service account key from environment variables.
// The key is expected to be a base64-encoded JSON string.
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

/**
 * Initializes and returns a cached instance of the Firebase Admin SDK.
 *
 * This function ensures that the Admin SDK is initialized only once per server instance.
 * It handles potential errors during initialization, such as missing environment variables,
 * and provides clear error messages for easier debugging.
 *
 * The `FIREBASE_ADMIN_PRIVATE_KEY` is decoded from base64 and newlines are correctly formatted.
 *
 * @returns {admin.app.App} The initialized Firebase Admin SDK instance.
 * @throws {Error} If the required Firebase Admin environment variables are not set,
 *                 or if the SDK fails to initialize.
 */
export function getFirebaseAdmin() {
  if (cachedAdmin) {
    return cachedAdmin;
  }

  // Ensure all required environment variables are present.
  if (!privateKey || !clientEmail || !projectId) {
    throw new Error(
      'Firebase Admin SDK environment variables are not set. ' +
      'Please check FIREBASE_ADMIN_PRIVATE_KEY, FIREBASE_ADMIN_CLIENT_EMAIL, and NEXT_PUBLIC_FIREBASE_PROJECT_ID.'
    );
  }

  try {
    // Decode the base64 private key and replace escaped newlines.
    const decodedPrivateKey = Buffer.from(privateKey, 'base64').toString('utf-8').replace(/\n/g, '\n');

    cachedAdmin = admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey: decodedPrivateKey,
      }),
    });

    console.log('Firebase Admin SDK initialized successfully.');
    return cachedAdmin;
  } catch (error: any) {
    // Provide a detailed error message if initialization fails.
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
  }
}
