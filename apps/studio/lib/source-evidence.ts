export type SourceClass =
  | 'camera-original'
  | 'scan'
  | 'screenshot'
  | 'screen-recording'
  | 'exported-copy'
  | 'edited-derivative'
  | 'transcode'
  | 'generated'
  | 'document-photo'
  | 'unknown';

export type SourceEvidenceState =
  | 'confirmed-source'
  | 'source-supported'
  | 'metadata-only'
  | 'label-only'
  | 'inferred'
  | 'conflicting'
  | 'unknown';

export type TimestampKind =
  | 'exif-original'
  | 'exif-digitized'
  | 'file-created'
  | 'file-modified'
  | 'cloud-created'
  | 'cloud-modified'
  | 'embedded-media'
  | 'filename-only'
  | 'unknown';

export type SourceTimestamp = {
  kind: TimestampKind;
  value: string | null;
  state: SourceEvidenceState;
  timezone: string | null;
};

export type SourceDeviceEvidence = {
  make: string | null;
  model: string | null;
  lens: string | null;
  software: string | null;
  state: SourceEvidenceState;
};

export type SourceGpsEvidence = {
  present: boolean;
  precisePrivateValueKey: string | null;
  publicRegionKey: string | null;
  altitudeMeters: number | null;
  headingDegrees: number | null;
  state: SourceEvidenceState;
};

export type SourceEvidencePacket = {
  schemaVersion: '1.0.0';
  sourceAssetKey: string;
  sourceClass: SourceClass;
  mimeType: string;
  byteSize: number;
  sha256: string | null;
  dimensions: { width: number; height: number } | null;
  orientation: string | null;
  fileName: string;
  containerOrCodec: string | null;
  colorProfile: string | null;
  softwareHistory: string[];
  device: SourceDeviceEvidence;
  timestamps: SourceTimestamp[];
  gps: SourceGpsEvidence;
  locationEvidence: string[];
  folderProvenance: string[];
  batchKey: string | null;
  sameEventClusterKey: string | null;
  neighborSourceKeys: string[];
  identityLabels: string[];
  confirmedIdentityKeys: string[];
  visibleFacts: string[];
  metadataFacts: string[];
  contradictions: string[];
  privacyClass: 'private' | 'restricted' | 'public-safe';
  sourceConfidence: 'confirmed' | 'high' | 'medium' | 'low' | 'unknown';
  derivativeOfSourceKey: string | null;
};

export type SourceEvidenceValidation = {
  ok: boolean;
  errors: string[];
};

const SHA256 = /^[a-f0-9]{64}$/i;
const SAFE_KEY = /^[a-zA-Z0-9._:-]+$/;

export function validateSourceEvidencePacket(packet: SourceEvidencePacket): SourceEvidenceValidation {
  const errors: string[] = [];

  if (packet.schemaVersion !== '1.0.0') errors.push('unsupported_source_evidence_schema');
  if (!SAFE_KEY.test(packet.sourceAssetKey)) errors.push('invalid_source_asset_key');
  if (!packet.mimeType.trim()) errors.push('missing_mime_type');
  if (!packet.fileName.trim()) errors.push('missing_file_name');
  if (!Number.isFinite(packet.byteSize) || packet.byteSize <= 0) errors.push('invalid_byte_size');

  const isOriginal = packet.sourceClass === 'camera-original' || packet.sourceClass === 'scan';
  if (isOriginal && (!packet.sha256 || !SHA256.test(packet.sha256))) {
    errors.push('original_missing_sha256');
  }
  if (packet.sha256 && !SHA256.test(packet.sha256)) errors.push('invalid_sha256');

  if (packet.sourceClass === 'generated' && packet.sourceConfidence === 'confirmed') {
    errors.push('generated_media_cannot_be_confirmed_source_truth');
  }
  if (packet.derivativeOfSourceKey && !SAFE_KEY.test(packet.derivativeOfSourceKey)) {
    errors.push('invalid_derivative_source_key');
  }
  if (
    ['edited-derivative', 'transcode', 'exported-copy'].includes(packet.sourceClass) &&
    !packet.derivativeOfSourceKey
  ) {
    errors.push('derivative_missing_parent_source');
  }

  if (packet.gps.present && packet.gps.state === 'unknown') {
    errors.push('gps_present_but_state_unknown');
  }
  if (packet.gps.precisePrivateValueKey && packet.privacyClass === 'public-safe') {
    errors.push('precise_gps_exposed_to_public_safe_packet');
  }

  for (const timestamp of packet.timestamps) {
    if (timestamp.state === 'unknown' && timestamp.value !== null) {
      errors.push(`unknown_timestamp_has_value:${timestamp.kind}`);
    }
    if (timestamp.kind === 'filename-only' && timestamp.state === 'confirmed-source') {
      errors.push('filename_timestamp_cannot_be_confirmed_capture_time');
    }
    if (
      ['file-created', 'file-modified', 'cloud-created', 'cloud-modified'].includes(timestamp.kind) &&
      timestamp.state === 'confirmed-source'
    ) {
      errors.push(`filesystem_timestamp_cannot_be_confirmed_capture_time:${timestamp.kind}`);
    }
  }

  if (packet.contradictions.length && packet.sourceConfidence === 'confirmed') {
    errors.push('confirmed_source_has_unresolved_contradictions');
  }

  if (
    packet.sameEventClusterKey &&
    !packet.batchKey &&
    packet.neighborSourceKeys.length === 0 &&
    packet.locationEvidence.length === 0 &&
    packet.timestamps.length === 0
  ) {
    errors.push('same_event_cluster_has_no_supporting_evidence');
  }

  return { ok: errors.length === 0, errors };
}

export function canPromoteSourceToCanon(packet: SourceEvidencePacket): boolean {
  const validation = validateSourceEvidencePacket(packet);
  if (!validation.ok) return false;
  if (packet.sourceClass === 'generated') return false;
  if (packet.sourceConfidence === 'unknown' || packet.sourceConfidence === 'low') return false;
  if (packet.contradictions.length) return false;
  return true;
}
