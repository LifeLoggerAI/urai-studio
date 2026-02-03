
// apps/studio/app/api/dlq/route.ts

import { NextResponse } from "next/server";
import { firestore } from "../../../lib/firebase-admin";
import { StudioDLQItem, StudioAudit } from "../../schemas";
import { v4 as uuidv4 } from "uuid";

// Get all items from the Dead Letter Queue
export async function GET() {
  try {
    const dlqRef = firestore.collection("studioDLQ").orderBy("createdAt", "desc");
    const snapshot = await dlqRef.get();

    if (snapshot.empty) {
      return NextResponse.json({ dlqItems: [] });
    }

    const dlqItems = snapshot.docs.map(doc => doc.data() as StudioDLQItem);
    return NextResponse.json({ dlqItems });

  } catch (error: any) {
    console.error("Error fetching DLQ items:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Dismiss (delete) an item from the Dead Letter Queue
export async function DELETE(request: Request) {
  const { dlqId, jobId } = await request.json();

  if (!dlqId || !jobId) {
    return NextResponse.json({ error: "DLQ ID and Job ID are required" }, { status: 400 });
  }

  try {
    const dlqRef = firestore.collection("studioDLQ").doc(dlqId);
    
    await firestore.runTransaction(async (transaction) => {
      const dlqDoc = await transaction.get(dlqRef);
      if (!dlqDoc.exists) {
        throw new Error("DLQ item not found");
      }
      transaction.delete(dlqRef);

      const auditRef = firestore.collection("studioAudit").doc(uuidv4());
      transaction.set(auditRef, { 
        auditId: auditRef.id, 
        at: new Date(), 
        actor: { uid: "system" }, // In a real app, this would be the logged-in user
        action: "DLQ_DISMISSED", 
        jobId: jobId,
        details: { dlqId }
      } as StudioAudit);
    });

    return NextResponse.json({ message: `DLQ item ${dlqId} dismissed successfully` });

  } catch (error: any) {
    console.error(`Error dismissing DLQ item ${dlqId}:`, error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

