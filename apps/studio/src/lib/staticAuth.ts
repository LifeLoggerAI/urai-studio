/**
 * Static-export auth shim (no live auth during next export).
 * Keeps builds green without pulling react-firebase-hooks.
 */
export function useAuthState(_: unknown) {
  return [null, false, null] as const;
}
