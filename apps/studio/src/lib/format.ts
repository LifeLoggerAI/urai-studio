export function fmtTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}

export function fmtShortId(id: string) {
  if (!id) return "";
  return id.length <= 10 ? id : `${id.slice(0, 6)}…${id.slice(-4)}`;
}
