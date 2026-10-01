import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const auditRoot = path.resolve('_audit/20260623_urai_studio_video_factory')
const captureReportPath = path.join(auditRoot, 'captures/route-capture-report.json')
const manifestPath = path.join(auditRoot, 'render-artifacts/urai-replay-teaser.render-manifest.json')
const outputDir = path.join(auditRoot, 'render-artifacts')
const outputPath = path.join(outputDir, 'urai-replay-teaser.motion-diagnostic.mp4')
const receiptPath = path.join(outputDir, 'urai-replay-teaser.motion-diagnostic-render-receipt.json')
const exactHead = process.env.URAI_EXACT_HEAD || process.env.GITHUB_SHA || 'unknown'

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8' })
  if (result.status !== 0) {
    throw new Error(`${command} failed: ${result.stderr || result.stdout || 'unknown error'}`)
  }
  return result.stdout
}

function probeVideo(file) {
  return JSON.parse(run('ffprobe', [
    '-v', 'error',
    '-select_streams', 'v:0',
    '-show_entries', 'format=duration:stream=codec_name,width,height,pix_fmt,avg_frame_rate',
    '-of', 'json',
    file,
  ]))
}

await mkdir(outputDir, { recursive: true })
const report = JSON.parse(await readFile(captureReportPath, 'utf8'))
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))

if (report.schemaVersion !== 'urai-studio-video-route-capture-2' || report.ok !== true) {
  throw new Error('semantic-ready route capture report is not green')
}

const durationByRoute = new Map()
const orderedRoutes = []
for (const shot of manifest.shots ?? []) {
  const route = String(shot.route || '')
  const duration = Number(shot.durationSeconds ?? (shot.endSecond - shot.startSecond))
  if (!route || !Number.isFinite(duration) || duration <= 0) throw new Error(`invalid timeline shot:${shot.id || 'unknown'}`)
  durationByRoute.set(route, (durationByRoute.get(route) ?? 0) + duration)
  if (!orderedRoutes.includes(route)) orderedRoutes.push(route)
}

const captureByRoute = new Map((report.results ?? []).map((entry) => [entry.route, entry]))
const inputs = []
const filters = []
const clipEvidence = []
let expectedDurationSeconds = 0

for (const [index, route] of orderedRoutes.entries()) {
  const capture = captureByRoute.get(route)
  const duration = durationByRoute.get(route)
  if (!capture?.passed || !capture.motion || !duration) throw new Error(`missing green motion capture for ${route}`)
  const readyOffset = Number(capture.semanticReadyOffsetSeconds)
  if (!Number.isFinite(readyOffset) || readyOffset < 0) throw new Error(`invalid semantic-ready offset for ${route}`)

  const inputProbe = probeVideo(capture.motion)
  const sourceDuration = Number(inputProbe?.format?.duration ?? 0)
  const availableAfterReady = sourceDuration - readyOffset
  if (!Number.isFinite(sourceDuration) || availableAfterReady + 0.15 < duration) {
    throw new Error(`motion capture too short for ${route}: source=${sourceDuration}s ready=${readyOffset}s need=${duration}s`)
  }

  inputs.push('-i', capture.motion)
  filters.push(
    `[${index}:v]trim=start=${readyOffset.toFixed(3)}:duration=${duration.toFixed(3)},setpts=PTS-STARTPTS,scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,fps=30,format=yuv420p[v${index}]`,
  )
  clipEvidence.push({
    route,
    semanticState: capture.semanticState,
    deployedSha: capture.deployedSha ?? null,
    sourceMotion: capture.motion,
    sourceDurationSeconds: sourceDuration,
    semanticReadyOffsetSeconds: readyOffset,
    usedDurationSeconds: duration,
  })
  expectedDurationSeconds += duration
}

const concatInputs = orderedRoutes.map((_, index) => `[v${index}]`).join('')
filters.push(`${concatInputs}concat=n=${orderedRoutes.length}:v=1:a=0[outv]`)

run('ffmpeg', [
  '-hide_banner', '-loglevel', 'error', '-y',
  ...inputs,
  '-filter_complex', filters.join(';'),
  '-map', '[outv]',
  '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  outputPath,
])

const outputProbe = probeVideo(outputPath)
const measuredDurationSeconds = Number(outputProbe?.format?.duration ?? 0)
const stream = outputProbe?.streams?.[0]
if (!Number.isFinite(measuredDurationSeconds) || Math.abs(measuredDurationSeconds - expectedDurationSeconds) > 0.6) {
  throw new Error(`motion diagnostic duration mismatch: expected ${expectedDurationSeconds}s, got ${measuredDurationSeconds}s`)
}
if (stream?.codec_name !== 'h264' || stream?.width !== 1920 || stream?.height !== 1080 || stream?.pix_fmt !== 'yuv420p') {
  throw new Error(`unexpected motion diagnostic properties: ${JSON.stringify(stream)}`)
}

const bytes = await readFile(outputPath)
const sha256 = createHash('sha256').update(bytes).digest('hex')
const deployedShas = [...new Set(clipEvidence.map((entry) => entry.deployedSha).filter(Boolean))]

const receipt = {
  schemaVersion: 'urai-studio-motion-diagnostic-render-receipt-1',
  exactHead,
  recordedAt: new Date().toISOString(),
  status: 'DIAGNOSTIC_PLAYABLE_MOTION_RENDER',
  playable: true,
  motionSource: true,
  aaaAccepted: false,
  finalLifeMovieAccepted: false,
  publicReleaseAuthorized: false,
  privateMemoryUsed: false,
  providerGeneratedMediaUsed: false,
  source: 'semantic-ready live product route WebM captures',
  sourceManifest: path.relative(process.cwd(), manifestPath),
  captureReport: path.relative(process.cwd(), captureReportPath),
  output: path.relative(process.cwd(), outputPath),
  outputSha256: sha256,
  expectedDurationSeconds,
  measuredDurationSeconds,
  video: stream,
  audio: 'none-diagnostic-only',
  captions: 'retained separately; not burned into motion diagnostic',
  deployedShas,
  clips: clipEvidence,
  purpose: 'Prove Studio can compose real route motion into a playable exact-run MP4 without representing it as final Life Movie, private-memory film, or provider-generated cinema.',
}

await writeFile(receiptPath, JSON.stringify(receipt, null, 2) + '\n')
console.log(JSON.stringify(receipt, null, 2))
