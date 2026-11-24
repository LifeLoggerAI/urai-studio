/**
 * R1738: pre-signing input validation only; NOT a provider-side size quota.
 * createUploadUrl is NOT exported in the reviewed functions/src/index.ts.
 */
const MAX_BYTES = 500 * 1024 * 1024;
const MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "video/mp4", "video/webm", "audio/mpeg", "audio/mp4",
  "audio/wav", "audio/webm",
]);
const EXTENSIONS: Record<string, readonly string[]> = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"], "image/webp": [".webp"],
  "image/gif": [".gif"], "video/mp4": [".mp4"],
  "video/webm": [".webm"], "audio/mpeg": [".mp3"],
  "audio/mp4": [".m4a"], "audio/wav": [".wav"],
  "audio/webm": [".webm"],
};

export type ValidUpload = {
  uid: string; fileName: string; mimeType: string; bytes: number;
};

export function validateSignedUploadRequest(value: unknown, uid: unknown): ValidUpload {
  if (!uid || typeof uid !== "string" || !/^[A-Za-z0-9:_-]{1,128}$/.test(uid)) {
    throw new Error("invalid_owner_uid");
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("invalid_upload_request");
  }
  const v = value as Record<string, unknown>;
  const fileName = v.fileName;
  const mimeType = v.mimeType;
  const bytes = v.bytes;
  if (typeof fileName !== "string" || fileName.length < 3 ||
      fileName.length > 128 || fileName.startsWith(".") ||
      !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(fileName) ||
      fileName.includes("..")) {
    throw new Error("invalid_filename");
  }
  if (typeof mimeType !== "string" || !MIME_TYPES.has(mimeType) ||
      !EXTENSIONS[mimeType].some(ext => fileName.toLowerCase().endsWith(ext))) {
    throw new Error("invalid_mime_type");
  }
  if (typeof bytes !== "number" || !Number.isSafeInteger(bytes) ||
      bytes <= 0 || bytes > MAX_BYTES) {
    throw new Error("invalid_upload_size");
  }
  return {uid, fileName, mimeType, bytes};
}
