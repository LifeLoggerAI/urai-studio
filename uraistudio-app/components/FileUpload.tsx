
import { useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { app } from "@/app/firebase";

const functions = getFunctions(app);
const storage = getStorage(app);

const createUploadUrl = httpsCallable(functions, "createUploadUrl");
const finalizeUpload = httpsCallable(functions, "finalizeUpload");

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const { data: uploadData }: any = await createUploadUrl({
        fileName: file.name,
        mimeType: file.type,
        bytes: file.size,
        title,
        description,
      });

      const { contentId, uploadUrl, storagePath } = uploadData;

      await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      await finalizeUpload({
        contentId,
        storagePath,
        mimeType: file.type,
        bytes: file.size,
      });

      setFile(null);
      setTitle("");
      setDescription("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="border p-4 rounded mb-8">
      <h2 className="text-xl font-bold mb-4">Upload New Content</h2>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <div className="flex flex-col space-y-4">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="border p-2 rounded"
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="border p-2 rounded"
        />
        <input type="file" onChange={handleFileChange} />
        <button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:bg-gray-400"
        >
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </div>
    </div>
  );
}
