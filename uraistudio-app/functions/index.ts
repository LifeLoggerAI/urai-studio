
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { logger } from "firebase-functions";
import admin from "firebase-admin";
import { z } from "zod";
import { exec as execCb } from "child_process";
import { promisify } from "util";
import { tmpdir } from "os";
import { join, basename } from "path";
import { promises as fs } from "fs";
import { VertexAI } from "@google-cloud/vertexai";

const exec = promisify(execCb);

if (!admin.apps.length) admin.initializeApp();

// --- Schemas and Types ---

const JobInputSchema = z.object({
  mode: z.enum(["auto"]).default("auto"),
  target: z.enum(["shorts", "youtube", "ads"]).default("shorts"),
  aspect: z.enum(["9:16", "1:1", "16:9"]).optional(),
  media: z.array(z.object({
    kind: z.enum(["video", "image"]),
    name: z.string(),
    size: z.number().optional()
  })).default([])
});

type JobStatus = "queued" | "running" | "succeeded" | "failed";

// --- Firestore Helpers ---

const updateJob = async (jobPath: string, patch: Record<string, any>) => {
  await admin.firestore().doc(jobPath).set(patch, { merge: true });
};

const updateJobProgress = (jobPath: string, stage: string, pct: number) => {
  return updateJob(jobPath, {
    progress: { stage, pct, t: Date.now() }
  });
};

// --- File and Path Helpers ---

const getPathFromUrl = (urlString: string): string => {
  const url = new URL(urlString);
  const parts = url.pathname.split("/");
  const objectPath = parts.slice(parts.indexOf('o') + 1).join("/");
  return decodeURIComponent(objectPath);
};

// --- Main Pipeline Steps ---

const downloadVideo = async (jobId: string, jobPath: string, videoUrl: string, tempDir: string): Promise<string> => {
  await updateJobProgress(jobPath, "downloading", 10);
  const bucket = admin.storage().bucket();
  const filePath = getPathFromUrl(videoUrl);
  const tempVideoPath = join(tempDir, basename(filePath));
  await bucket.file(filePath).download({ destination: tempVideoPath });
  logger.info("Video downloaded", { jobId, tempVideoPath });
  return tempVideoPath;
};

const extractThumbnail = async (jobId: string, jobPath: string, tempVideoPath: string, tempDir: string): Promise<string> => {
  await updateJobProgress(jobPath, "extracting frame", 60);
  const probeCmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${tempVideoPath}"`;
  const { stdout: durationStdout } = await exec(probeCmd);
  const duration = parseFloat(durationStdout);
  if (isNaN(duration)) {
    throw new Error("Could not determine video duration.");
  }
  const midpoint = duration / 2;
  const tempFramePath = join(tempDir, `frame-${jobId}.jpg`);
  const ffmpegCmd = `ffmpeg -i "${tempVideoPath}" -ss ${midpoint} -vframes 1 "${tempFramePath}"`;
  await exec(ffmpegCmd);
  logger.info("Frame extracted", { jobId, tempFramePath });
  return tempFramePath;
};

const transcribeAudio = async (jobId: string, jobPath: string, tempVideoPath: string, tempDir: string): Promise<string> => {
  await updateJobProgress(jobPath, "transcribing audio", 70);
  const tempAudioPath = join(tempDir, `audio-${jobId}.wav`);
  const ffmpegAudioCmd = `ffmpeg -i "${tempVideoPath}" -vn -acodec pcm_s16le -ar 44100 -ac 2 "${tempAudioPath}"`;
  await exec(ffmpegAudioCmd);
  logger.info("Audio extracted", { jobId, tempAudioPath });

  const audioBytes = await fs.readFile(tempAudioPath);
  const audioBase64 = audioBytes.toString("base64");

  const vertexAI = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" });
  const recognitionModel = vertexAI.getGenerativeModel({ model: "gemini-1.5-flash-001" });

  const recognitionRequest = {
    contents: [{
      role: "user",
      parts: [
        { text: "Transcribe the following audio and provide only the transcribed text, without any additional formatting or conversational text. If there is no speech, or if the audio is silent, return an empty string." },
        { inlineData: { mimeType: "audio/wav", data: audioBase64 } }
      ]
    }]
  };

  const recognitionResult = await recognitionModel.generateContent(recognitionRequest);
  return recognitionResult.response.candidates[0].content.parts[0].text.trim();
};

const generateTitle = async (jobId: string, jobPath: string, tempFramePath: string): Promise<string> => {
  await updateJobProgress(jobPath, "generating title", 80);
  const generativeModel = new VertexAI({ project: process.env.GCLOUD_PROJECT, location: "us-central1" }).getGenerativeModel({ model: "gemini-1.0-pro-vision-001" });

  const imageBytes = await fs.readFile(tempFramePath);
  const req = {
    contents: [{
      role: "user",
      parts: [
        { text: "Analyze this video frame and generate a short, catchy title for a social media video. The title should be no more than 10 words." },
        { inlineData: { mimeType: "image/jpeg", data: imageBytes.toString("base64") } }
      ]
    }]
  };

  const resp = await generativeModel.generateContent(req);
  return resp.response.candidates[0].content.parts[0].text.trim();
};

const uploadThumbnail = async (jobId: string, jobPath: string, tempFramePath: string): Promise<string> => {
  await updateJobProgress(jobPath, "uploading frame", 90);
  const bucket = admin.storage().bucket();
  const storageDestPath = `exports/${jobId}/thumbnail.jpg`;
  const [uploadedFile] = await bucket.upload(tempFramePath, {
    destination: storageDestPath,
    public: true,
  });
  const frameUrl = uploadedFile.publicUrl();
  logger.info("Frame uploaded", { jobId, frameUrl });
  return frameUrl;
};

// --- Main Cloud Function ---

export const onJobCreated = onDocumentCreated("jobs/{jobId}", async (event) => {
  const snap = event.data;
  if (!snap) return;

  const jobPath = snap.ref.path;
  const jobId = snap.id;
  const data = snap.data() || {};
  const status: JobStatus = (data.status as JobStatus) || "queued";

  if (status !== "queued") {
    logger.info("Skip job; not queued", { jobId, status });
    return;
  }

  const tempDir = tmpdir();

  try {
    const input = JobInputSchema.parse(data.input ?? {});
    logger.info("Job start", { jobId, input });

    await updateJob(jobPath, {
      status: "running",
      startedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const videoFile = input.media.find(m => m.kind === "video");
    if (!videoFile) {
      throw new Error("No video file found in job input.");
    }

    const tempVideoPath = await downloadVideo(jobId, jobPath, videoFile.name, tempDir);
    const tempFramePath = await extractThumbnail(jobId, jobPath, tempVideoPath, tempDir);
    const transcription = await transcribeAudio(jobId, jobPath, tempVideoPath, tempDir);
    const title = await generateTitle(jobId, jobPath, tempFramePath);
    const frameUrl = await uploadThumbnail(jobId, jobPath, tempFramePath);

    const outputs = {
      videos: [{ label: "final_9x16", url: "about:blank", aspect: "9:16" }],
      thumbnails: [{ label: "auto_thumbnail", url: frameUrl }],
      subtitles: [{ label: "captions_en", content: transcription, format: "srt" }],
      meta: {
        title: title,
        description: "Generated automatically by URAI Studio (MVP).",
        hashtags: ["#urai", "#aivideo", "#shorts"]
      }
    };

    await updateJob(jobPath, {
      status: "succeeded",
      progress: { stage: "done", pct: 100, t: Date.now() },
      outputs,
      finishedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info("Job succeeded", { jobId });

  } catch (e: any) {
    await updateJob(jobPath, {
      status: "failed",
      error: { message: "Pipeline failed", details: String(e?.stack ?? e) },
    });
    logger.error("Job failed", { jobId, err: String(e?.stack ?? e) });
  } finally {
    try {
      const files = await fs.readdir(tempDir);
      for (const file of files) {
        if (file.includes(jobId) || file.includes(basename(new URL(data.input.media.find((m: any) => m.kind === "video")!.name).pathname))) {
          await fs.unlink(join(tempDir, file));
        }
      }
    } catch (err) {
      logger.error("Failed to cleanup temp files", { jobId, err });
    }
  }
});
