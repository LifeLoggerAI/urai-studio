'use client';

import { useState } from "react";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytes } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file to upload.");
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload the file to Firebase Storage
      const storageRef = ref(storage, `inputs/${file.name}`);
      await uploadBytes(storageRef, file);

      // 2. Create a new job in Firestore
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: "test-project", // In a real app, this would be dynamic
          ownerId: "test-user", // In a real app, this would be the logged-in user
          media: {
            name: file.name,
            path: storageRef.fullPath,
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create job");
      }

      const { jobId } = await response.json();

      alert(`Job created with ID: ${jobId}`);
    } catch (error) {
      console.error(error);
      alert("An error occurred while uploading the file.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div>
      <h1>Upload a File</h1>
      <form onSubmit={handleSubmit}>
        <input type="file" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} />
        <button type="submit" disabled={isUploading}>
          {isUploading ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}
