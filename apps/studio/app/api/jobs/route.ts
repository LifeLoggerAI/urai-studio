
// apps/studio/app/api/jobs/route.ts

import { NextResponse } from "next/server";
import { firestore } from "../../../lib/firebase-admin";
import { StudioJob } from "../../schemas";

export async function GET() {
  try {
    const jobsRef = firestore.collection("studioJobs").orderBy("createdAt", "desc").limit(10);
    const snapshot = await jobsRef.get();

    if (snapshot.empty) {
      return NextResponse.json({ jobs: [] });
    }

    const jobs = snapshot.docs.map(doc => doc.data() as StudioJob);
    return NextResponse.json({ jobs });

  } catch (error: any) {
    console.error("Error fetching recent jobs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
