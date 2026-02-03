import { NextRequest, NextResponse } from "next/server";
import { requestReplay } from "@/server/jobCommands";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const jobId = String(body.jobId || "").trim();
  const reason = String(body.reason || "").trim();

  if (!jobId) return NextResponse.json({ ok: false, error: "jobId_required" }, { status: 400 });

  const actor = req.headers.get("x-forwarded-email") || req.headers.get("x-urai-role") || "unknown";
  const out = await requestReplay(jobId, "DLQ_REPLAY", actor, reason);
  return NextResponse.json(out);
}
