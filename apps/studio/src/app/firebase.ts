/**
 * Compatibility shim for older imports:
 *   import { app, db } from "@/app/firebase";
 *
 * Our canonical client setup lives in "@/lib/firebaseClient".
 */
export { app, db, firebaseAuth } from "@/lib/firebaseClient";
