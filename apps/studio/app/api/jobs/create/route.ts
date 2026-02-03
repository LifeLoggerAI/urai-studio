
import { NextResponse } from "next/server";
import { firestore } from "../../../lib/firebase-admin";
import { StudioJob } from "../../../schemas";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
  const { prompt } = await request.json();

  if (!prompt) {
    return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
  }

  const jobId = uuidv4();
  const idempotencyKey = `clip_pipeline_v1_${jobId}`;

  const newJob: StudioJob = {
    jobId,
    type: "CLIP_PIPELINE_V1",
    status: "QUEUED",
    idempotencyKey,
    groupKey: `manual_creation_${jobId}`,
    priority: 100,
    source: {
      kind: "MANUAL",
      ref: "user_prompt",
      title: prompt,
    },
    input: {
      prompt,
    },
    attempts: 0,
    maxAttempts: 5,
    lease: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    await firestore.collection("studioJobs").doc(jobId).set(newJob);
    return NextResponse.json(newJob);
  } catch (error) {
    console.error("Error creating job:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
