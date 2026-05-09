import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

const db = admin.firestore();
const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;

type CallableContext = functions.https.CallableContext;

type StudioMode = "demo" | "user" | "campaign" | "therapeutic" | "vr" | "social";

type StudioAssetType =
  | "image"
  | "video"
  | "audio"
  | "script"
  | "subtitle"
  | "scroll"
  | "scene"
  | "model"
  | "other";

function requireUid(context: CallableContext): string {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "You must be authenticated to use URAI Studio callables."
    );
  }

  return context.auth.uid;
}

function requireString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : fallback;
}

function safeMode(value: unknown): StudioMode {
  const modes: StudioMode[] = ["demo", "user", "campaign", "therapeutic", "vr", "social"];
  return modes.includes(value as StudioMode) ? (value as StudioMode) : "user";
}

function safeAssetType(value: unknown): StudioAssetType {
  const types: StudioAssetType[] = [
    "image",
    "video",
    "audio",
    "script",
    "subtitle",
    "scroll",
    "scene",
    "model",
    "other",
  ];
  return types.includes(value as StudioAssetType) ? (value as StudioAssetType) : "other";
}

function nowFields() {
  return {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

function assertAdmin(context: CallableContext): void {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "This URAI Studio action requires an admin custom claim."
    );
  }
}

export const ping = functions.https.onCall(async () => ({
  ok: true,
  service: "urai-studio",
  timestamp: new Date().toISOString(),
}));

export const createStudioProject = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const projectRef = db.collection("studioProjects").doc();
  const title = requireString(data?.title, "Untitled Studio Project");
  const mode = safeMode(data?.mode);

  await projectRef.set({
    id: projectRef.id,
    uid,
    title,
    mode,
    sourceRefs: Array.isArray(data?.sourceRefs) ? data.sourceRefs : [],
    scenes: [],
    narrationStyle: requireString(data?.narrationStyle, "calm cinematic narrator"),
    visualStyle: requireString(data?.visualStyle, "symbolic cinematic memory system"),
    exportStatus: "draft",
    ...nowFields(),
  });

  await db.collection("studioEvents").add({
    uid,
    type: "project_created",
    projectId: projectRef.id,
    ...nowFields(),
  });

  return { ok: true, projectId: projectRef.id };
});

export const seedStudioDemo = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const projectRef = db.collection("studioProjects").doc();
  const sceneRefs = [db.collection("studioScenes").doc(), db.collection("studioScenes").doc(), db.collection("studioScenes").doc()];
  const assetRefs = [db.collection("studioAssets").doc(), db.collection("studioAssets").doc(), db.collection("studioAssets").doc()];
  const scriptRef = db.collection("narratorScripts").doc();
  const scrollRef = db.collection("studioScrolls").doc();
  const exportRef = db.collection("exportJobs").doc();
  const batch = db.batch();
  const title = requireString(data?.title, "URAI Studio Demo Scroll");

  batch.set(projectRef, {
    id: projectRef.id,
    uid,
    title,
    mode: "demo",
    sourceRefs: [],
    scenes: sceneRefs.map((ref) => ref.id),
    narrationStyle: "warm cinematic companion",
    visualStyle: "aura-lit symbolic studio reel",
    exportStatus: "draft",
    ...nowFields(),
  });

  const sceneTitles = ["Signal Awakening", "Memory Constellation", "Export Bloom"];
  sceneRefs.forEach((ref, order) => {
    batch.set(ref, {
      id: ref.id,
      uid,
      projectId: projectRef.id,
      order,
      title: sceneTitles[order],
      description: `Demo scene ${order + 1} for validating the URAI Studio cinematic scroll flow.`,
      durationSeconds: 12,
      assetRefs: [assetRefs[order].id],
      narrationRef: scriptRef.id,
      ...nowFields(),
    });
  });

  const assetTypes: StudioAssetType[] = ["image", "script", "scroll"];
  assetRefs.forEach((ref, index) => {
    batch.set(ref, {
      id: ref.id,
      uid,
      title: `Demo Studio Asset ${index + 1}`,
      type: assetTypes[index],
      status: "ready",
      source: "system",
      storagePath: `generated/${uid}/studio/${ref.id}`,
      metadata: { demo: true, projectId: projectRef.id },
      ...nowFields(),
    });
  });

  batch.set(scriptRef, {
    id: scriptRef.id,
    uid,
    projectId: projectRef.id,
    title: "Demo Companion Narration",
    body: "A quiet signal becomes a memory. The memory becomes a constellation. The constellation becomes a cinematic scroll.",
    style: "warm cinematic companion",
    status: "ready",
    ...nowFields(),
  });

  batch.set(scrollRef, {
    id: scrollRef.id,
    uid,
    projectId: projectRef.id,
    title: "Demo Studio Scroll",
    sceneIds: sceneRefs.map((ref) => ref.id),
    status: "draft",
    ...nowFields(),
  });

  batch.set(exportRef, {
    id: exportRef.id,
    uid,
    projectId: projectRef.id,
    type: "manifest",
    exportStatus: "draft",
    manifest: null,
    ...nowFields(),
  });

  batch.set(db.collection("studioEvents").doc(), {
    uid,
    type: "seed_demo_project",
    projectId: projectRef.id,
    ...nowFields(),
  });

  await batch.commit();

  return {
    ok: true,
    projectId: projectRef.id,
    sceneIds: sceneRefs.map((ref) => ref.id),
    assetIds: assetRefs.map((ref) => ref.id),
    scriptId: scriptRef.id,
    scrollId: scrollRef.id,
    exportJobId: exportRef.id,
  };
});

export const generateStudioScript = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const projectId = requireString(data?.projectId, "standalone");
  const prompt = requireString(data?.prompt, "Generate a concise URAI Studio narrator script.");
  const style = requireString(data?.style, "cinematic companion");
  const scriptRef = db.collection("narratorScripts").doc();
  const body = `Style: ${style}\n\n${prompt}\n\nURAI Studio narration: We gather the signal, shape it into a scene, and let the story become visible.`;

  await scriptRef.set({
    id: scriptRef.id,
    uid,
    projectId,
    title: requireString(data?.title, "Generated Studio Narration"),
    body,
    style,
    status: "ready",
    ...nowFields(),
  });

  await db.collection("studioEvents").add({ uid, type: "script_generated", projectId, scriptId: scriptRef.id, ...nowFields() });

  return { ok: true, scriptId: scriptRef.id, body };
});

export const generateSceneNarration = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const sceneId = requireString(data?.sceneId, "standalone-scene");
  const scriptRef = db.collection("narratorScripts").doc();
  const body = `Scene narration for ${sceneId}: a symbolic memory moves from raw signal into cinematic form.`;

  await scriptRef.set({
    id: scriptRef.id,
    uid,
    sceneId,
    projectId: requireString(data?.projectId, "standalone"),
    title: requireString(data?.title, "Generated Scene Narration"),
    body,
    style: requireString(data?.style, "scene companion"),
    status: "ready",
    ...nowFields(),
  });

  return { ok: true, scriptId: scriptRef.id, body };
});

export const generateSrtForProject = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const projectId = requireString(data?.projectId, "standalone");
  const subtitleRef = db.collection("subtitles").doc();
  const srt = "1\n00:00:00,000 --> 00:00:04,000\nURAI Studio begins the scroll.\n\n2\n00:00:04,000 --> 00:00:08,000\nThe signal becomes a scene.\n";

  await subtitleRef.set({
    id: subtitleRef.id,
    uid,
    projectId,
    format: "srt",
    body: srt,
    status: "ready",
    ...nowFields(),
  });

  return { ok: true, subtitleId: subtitleRef.id, srt };
});

export const generateCompanionIntro = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const scriptRef = db.collection("narratorScripts").doc();
  const body = requireString(
    data?.body,
    "I am your URAI Studio companion. I will help turn signals, memories, and scenes into a coherent cinematic system."
  );

  await scriptRef.set({
    id: scriptRef.id,
    uid,
    projectId: requireString(data?.projectId, "companion"),
    title: "Companion Intro",
    body,
    style: "companion intro",
    status: "ready",
    ...nowFields(),
  });

  return { ok: true, scriptId: scriptRef.id, body };
});

export const createAssetJob = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const jobRef = db.collection("assetJobs").doc();

  await jobRef.set({
    id: jobRef.id,
    uid,
    projectId: typeof data?.projectId === "string" ? data.projectId : null,
    type: safeAssetType(data?.type),
    status: "queued",
    prompt: requireString(data?.prompt, "URAI Studio asset generation job"),
    outputAssetId: null,
    error: null,
    ...nowFields(),
  });

  await db.collection("studioEvents").add({ uid, type: "asset_job_created", assetJobId: jobRef.id, ...nowFields() });

  return { ok: true, assetJobId: jobRef.id };
});

export const markAssetReady = functions.https.onCall(async (data, context) => {
  assertAdmin(context);
  const assetId = requireString(data?.assetId, "");
  if (!assetId) {
    throw new functions.https.HttpsError("invalid-argument", "assetId is required.");
  }

  await db.collection("studioAssets").doc(assetId).set(
    {
      status: "ready",
      publicUrl: typeof data?.publicUrl === "string" ? data.publicUrl : null,
      thumbnailUrl: typeof data?.thumbnailUrl === "string" ? data.thumbnailUrl : null,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  return { ok: true, assetId };
});

export const createExportJob = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const exportRef = db.collection("exportJobs").doc();
  const projectId = requireString(data?.projectId, "standalone");

  await exportRef.set({
    id: exportRef.id,
    uid,
    projectId,
    type: requireString(data?.type, "manifest"),
    exportStatus: "queued",
    manifest: null,
    storagePath: `generated/${uid}/studio/exports/${exportRef.id}.json`,
    ...nowFields(),
  });

  await db.collection("studioEvents").add({ uid, type: "export_created", projectId, exportJobId: exportRef.id, ...nowFields() });

  return { ok: true, exportJobId: exportRef.id };
});

export const processExportJob = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const exportJobId = requireString(data?.exportJobId, "");
  if (!exportJobId) {
    throw new functions.https.HttpsError("invalid-argument", "exportJobId is required.");
  }

  const exportRef = db.collection("exportJobs").doc(exportJobId);
  const exportSnap = await exportRef.get();
  if (!exportSnap.exists || exportSnap.data()?.uid !== uid) {
    throw new functions.https.HttpsError("not-found", "Export job not found for this user.");
  }

  const manifest = {
    service: "urai-studio",
    exportJobId,
    generatedAt: new Date().toISOString(),
    projectId: exportSnap.data()?.projectId ?? null,
    formats: ["scroll-json", "storyboard-markdown", "srt", "asset-manifest", "capcut-scene-list"],
  };

  await exportRef.set(
    {
      exportStatus: "ready",
      manifest,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await db.collection("studioEvents").add({ uid, type: "export_ready", exportJobId, ...nowFields() });

  return { ok: true, exportJobId, manifest };
});

export const getExportJobStatus = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const exportJobId = requireString(data?.exportJobId, "");
  if (!exportJobId) {
    throw new functions.https.HttpsError("invalid-argument", "exportJobId is required.");
  }

  const exportSnap = await db.collection("exportJobs").doc(exportJobId).get();
  if (!exportSnap.exists || exportSnap.data()?.uid !== uid) {
    throw new functions.https.HttpsError("not-found", "Export job not found for this user.");
  }

  return { ok: true, exportJob: exportSnap.data() };
});

export const getStudioDashboard = functions.https.onCall(async (_data, context) => {
  const uid = requireUid(context);
  const [projects, assets, scrolls, exports] = await Promise.all([
    db.collection("studioProjects").where("uid", "==", uid).orderBy("createdAt", "desc").limit(10).get(),
    db.collection("studioAssets").where("uid", "==", uid).orderBy("createdAt", "desc").limit(10).get(),
    db.collection("studioScrolls").where("uid", "==", uid).orderBy("createdAt", "desc").limit(10).get(),
    db.collection("exportJobs").where("uid", "==", uid).orderBy("createdAt", "desc").limit(10).get(),
  ]);

  return {
    ok: true,
    projects: projects.docs.map((doc) => doc.data()),
    assets: assets.docs.map((doc) => doc.data()),
    scrolls: scrolls.docs.map((doc) => doc.data()),
    exports: exports.docs.map((doc) => doc.data()),
  };
});

export const logStudioEvent = functions.https.onCall(async (data, context) => {
  const uid = requireUid(context);
  const eventRef = db.collection("studioEvents").doc();

  await eventRef.set({
    id: eventRef.id,
    uid,
    type: requireString(data?.type, "studio_event"),
    projectId: typeof data?.projectId === "string" ? data.projectId : null,
    metadata: typeof data?.metadata === "object" && data.metadata !== null ? data.metadata : {},
    ...nowFields(),
  });

  return { ok: true, eventId: eventRef.id };
});
