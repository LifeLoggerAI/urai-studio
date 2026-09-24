export type StudioCaptureSurface =
  | 'home'
  | 'orb'
  | 'ground'
  | 'life-map'
  | 'memory-star'
  | 'focus'
  | 'replay'
  | 'mirror'
  | 'shadow'
  | 'legacy'
  | 'council'
  | 'passport';

export type StudioProductCaptureReceipt = {
  schemaVersion: 1;
  surface: StudioCaptureSurface;
  repository: 'LifeLoggerAI/urai-spatial';
  exactSha: string;
  route: string;
  state: string;
  viewport: { width: number; height: number; deviceScaleFactor: number };
  deviceProfile: string;
  cameraPathRef: string;
  runtimeUrl: string;
  capturedAt: string;
  artifactHash: string;
  visualQa: 'not-reviewed' | 'accepted' | 'rejected';
  accessibilityQa: 'not-reviewed' | 'accepted' | 'rejected';
  founderApprovalRequired: boolean;
  founderApprovalRef?: string;
  cleanPlate: boolean;
  textless: boolean;
  reducedMotion: boolean;
  acceptedForReuse: false;
};

export function validateProductCaptureReceipt(receipt: StudioProductCaptureReceipt) {
  if (!/^[a-f0-9]{40}$/.test(receipt.exactSha)) throw new Error('capture_exact_sha_required');
  if (!/^sha256:[a-f0-9]{64}$/.test(receipt.artifactHash)) throw new Error('capture_artifact_hash_required');
  if (!receipt.runtimeUrl.startsWith('https://')) throw new Error('capture_runtime_https_required');
  if (receipt.visualQa !== 'accepted') return false;
  if (receipt.accessibilityQa !== 'accepted') return false;
  if (receipt.founderApprovalRequired && !receipt.founderApprovalRef) return false;
  // A source receipt cannot self-promote itself to reusable authority.
  // Promotion requires a separately governed acceptance receipt outside this source contract.
  return false;
}
