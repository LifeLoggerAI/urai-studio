import { NextResponse } from "next/server";
import { adminDb } from "@/server/firebaseAdmin";

export async function GET(req: Request, { params }: { params: { projectId: string } }) {
  const { projectId } = params;
  const outputsSnapshot = await adminDb.collection("studioOutputs").where("projectId", "==", projectId).get();

  const outputs = outputsSnapshot.docs.map(doc => doc.data());

  return NextResponse.json(outputs);
}
