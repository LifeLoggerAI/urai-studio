import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const auditRoot = path.resolve('_audit/20260623_urai_studio_video_factory')
const captureReportPath = path.join(auditRoot, 'captures/route-capture-report.json')
const manifestPath = path.join(auditRoot, 'render-artifacts/urai-replay-teaser.render-manifest.json')
const outputDir = path.join(auditRoot, 'render-artifacts')
const outputPath = path.join(outputDir, 'urai-replay-teaser.diagnostic.mp4')
const receiptPath = path.join(outputDir, 'urai-replay-teaser.diagnostic-render-receipt.json')
const exactHead = process.env.URAI_EXACT_HEAD || process.env.GITHUB_SHA || 'unknown'

await mkdir(outputDir, { recursive: true })
const report = JSON.parse(await readFile(captureReportPath, 'utf8'))
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

const durationByRoute = new Map()
for (const shot of manifest.shots ?? []) {
  const duration = Number(shot.durationSeconds ?? (shot.endSecond - shot.startSecond))
  durationByRoute.set(shot.route, (durationByRoute.get(shot.route) ?? 0) + duration)
}
const orderedRoutes = []
for (const shot of manifest.shots ?? []) {
  if (!orderedRoutes.includes(shot.route)) orderedRoutes.push(shot.route)
}
const screenshotByRoute = new Map((report.results ?? []).map((entry) => [entry.route, entry.screenshot]))
const concatLines = []
let totalDuration = 0
for (const route of orderedRoutes) {
  const screenshot = screenshotByRoute.get(route)
  const duration = durationByRoute.get(route)
  if (!screenshot || !duration) throw new Error(`missing capture or duration for ${route}`)
  const escaped = String(screenshot).replaceAll("'", "'\\''")
  concatLines.push(`file '${escaped}'`)
  concatLines.push(`duration ${duration}`)
  totalDuration += duration
}
const lastScreenshot = screenshotByRoute.get(orderedRoutes.at(-1))
concatLines.push(`file '${String(lastScreenshot).replaceAll("'", "'\\''")}'`)
const concatPath = path.join(outputDir, 'diagnostic-concat.txt')
await writeFile(concatPath, concatLines.join('\n') + '\n')

const ffmpeg = spawnSync('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  '-f', 'concat', '-safe', '0', '-i', concatPath,
  '-vf', 'fps=30,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  outputPath,
], { encoding: 'utf8' })
if (ffmpeg.status !== 0) throw new Error(`ffmpeg failed: ${ffmpeg.stderr || ffmpeg.stdout}`)

const probe = spawnSync('ffprobe', [
  '-v', 'error',
  '-select_streams', 'v:0',
  '-show_entries', 'format=duration:stream=codec_name,width,height,pix_fmt',
  '-of', 'json',
  outputPath,
], { encoding: 'utf8' })
if (probe.status !== 0) throw new Error(`ffprobe failed: ${probe.stderr || probe.stdout}`)
const metadata = JSON.parse(probe.stdout)
const measuredDuration = Number(metadata?.format?.duration ?? 0)
if (!Number.isFinite(measuredDuration) || Math.abs(measuredDuration - totalDuration) > 0.5) {
  throw new Error(`diagnostic duration mismatch: expected ${totalDuration}s, got ${measuredDuration}s`)
}
const stream = metadata?.streams?.[0]
if (stream?.codec_name !== 'h264' || stream?.width !== 1920 || stream?.height !== 1080 || stream?.pix_fmt !== 'yuv420p') {
  throw new Error(`unexpected diagnostic video properties: ${JSON.stringify(stream)}`)
}

const receipt = {
  schemaVersion: 'urai-studio-diagnostic-render-receipt-1',
  exactHead,
  recordedAt: new Date().toISOString(),
  status: 'DIAGNOSTIC_PLAYABLE_RENDER',
  playable: true,
  aaaAccepted: false,
  publicReleaseAuthorized: false,
  source: 'retained exact-run route screenshots',
  sourceManifest: path.relative(process.cwd(), manifestPath),
  captureReport: path.relative(process.cwd(), captureReportPath),
  output: path.relative(process.cwd(), outputPath),
  expectedDurationSeconds: totalDuration,
  measuredDurationSeconds: measuredDuration,
  video: stream,
  audio: 'none-diagnostic-only',
  captions: 'retained separately; not burned into diagnostic',
  purpose: 'Prove the Studio verification lane can compose and retain a playable exact-run MP4 without misrepresenting it as final Life Movie quality.',
}
await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n')
console.log(JSON.stringify(receipt, null, 2))
