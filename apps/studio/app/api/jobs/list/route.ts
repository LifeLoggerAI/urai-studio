import { NextRequest, NextResponse } from "next/server";
import { listJobs } from "@/server/jobsStore";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "ALL";
  const limit = Number(url.searchParams.get("limit") || "50");
  const cursor = url.searchParams.get("cursor") || "";

  const out = await listJobs({ q, status, limit, cursor });
  return NextResponse.json({ ok: true, ...out });
}
