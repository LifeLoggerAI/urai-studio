import { NextResponse } from "next/server";
import { adminDb } from "@/server/firebaseAdmin";

export async function GET(req: Request, { params }: { params: { shareId: string } }) {
  const { shareId } = params;
  const shareDoc = await adminDb.collection("studioShares").doc(shareId).get();

  if (!shareDoc.exists) {
    return new NextResponse("Share link not found", { status: 404 });
  }

  return NextResponse.json(shareDoc.data());
}
