import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";

export async function POST(request: NextRequest) {
  const data = await request.formData();
  const files: File[] = data.getAll("files") as File[];
  const outputTarget = data.get("outputTarget") as string;

  if (!files || files.length === 0) {
    return NextResponse.json({ success: false, error: "No files uploaded" });
  }

  const savedFilePaths = [];

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save files to the `public/uploads` directory
    const path = join(process.cwd(), "public", "uploads", file.name);
    await writeFile(path, buffer);
    savedFilePaths.push(`/uploads/${file.name}`);
  }

  return NextResponse.json({ 
    success: true, 
    message: `${files.length} files uploaded successfully for target: ${outputTarget}`,
    files: savedFilePaths,
    outputTarget: outputTarget,
  });
}
