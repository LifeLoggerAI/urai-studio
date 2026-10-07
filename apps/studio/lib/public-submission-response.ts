export function readSubmissionResult(httpOk: boolean, value: unknown) {
  const body = typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
  const saved = httpOk && body.ok === true && body.persisted === true;
  const error = typeof body.error === 'object' && body.error !== null
    ? body.error as Record<string, unknown>
    : {};
  const message = typeof body.message === 'string' && body.message.trim()
    ? body.message
    : typeof error.message === 'string' && error.message.trim()
      ? error.message
      : saved
        ? 'Your submission was saved.'
        : 'We could not confirm that your submission was saved. Your form has been kept so you can retry.';
  return { saved, message };
}
