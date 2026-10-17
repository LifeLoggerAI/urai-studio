// A native recording's encoded time origin is independent of process wall time.
// Readiness and literal pixel acceptance remain distinct from this bounded
// interval calculation; callers must retain both the source and rendered bytes.
export function readyTailWindow({ sourceDurationSeconds, usedDurationSeconds,
  recordedReadySeconds, semanticState, semanticStateAtRecordingEnd,
  semanticReadinessSampleCount, recordingReadinessBasis }) {
  const source = Number(sourceDurationSeconds);
  const duration = Number(usedDurationSeconds);
  const recorded = Number(recordedReadySeconds);
  const startGuardSeconds = 1.5;
  const endGuardSeconds = 0.5;
  if (![source, duration, recorded].every(Number.isFinite)
    || source <= 0 || duration <= 0 || recorded <= 0) {
    throw new Error('invalid_encoded_ready_tail_duration');
  }
  if (!semanticState || semanticStateAtRecordingEnd !== semanticState) {
    throw new Error('missing_or_changed_final_route_readiness');
  }
  if (recordingReadinessBasis !== 'continuous-immediate-semantic-polls'
    || !Number.isInteger(semanticReadinessSampleCount) || semanticReadinessSampleCount < 2) {
    throw new Error('missing_continuous_recording_readiness');
  }
  if (recorded + 1e-9 < duration + startGuardSeconds + endGuardSeconds
    || source + 1e-9 < duration + endGuardSeconds) {
    throw new Error('insufficient_guarded_ready_tail');
  }
  return {
    basis: 'encoded-source-tail-after-final-readiness-revalidation',
    startSeconds: source - duration - endGuardSeconds,
    durationSeconds: duration,
    endSeconds: source - endGuardSeconds,
    recordedReadySeconds: recorded,
    startGuardSeconds,
    endGuardSeconds,
    literalPixelAccepted: false,
  };
}
