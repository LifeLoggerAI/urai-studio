
'use client';

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import React from 'react';

interface FileUploadProps {
  setFiles: React.Dispatch<React.SetStateAction<File[]>>;
}

export default function FileUpload({ setFiles }: FileUploadProps) {
  const [localFiles, setLocalFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setLocalFiles(prevFiles => {
        const newFiles = [...prevFiles, ...acceptedFiles];
        setFiles(newFiles); // Lift state up to the parent component
        return newFiles;
    });
  }, [setFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".mov", ".avi"],
    },
  });

  const uploadedFiles = localFiles.map((file) => (
    <li key={file.name} className="text-sm text-gray-400">
      {file.name} - {(file.size / 1024 / 1024).toFixed(2)} MB
    </li>
  ));

  return (
    <section>
      <div
        {...getRootProps()}
        className={`flex flex-col items-center justify-center p-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
          isDragActive ? "border-blue-500 bg-gray-700" : "border-gray-600 hover:border-gray-500"
        }`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p className="text-blue-400">Drop the files here ...</p>
        ) : (
          <p className="text-gray-400">Drag & drop files here, or click to select</p>
        )}
      </div>
      {localFiles.length > 0 && (
          <aside className="mt-4">
            <h4 className="text-md font-semibold text-gray-300">Files to process:</h4>
            <ul className="mt-2 list-disc list-inside">{uploadedFiles}</ul>
          </aside>
      )}
    </section>
  );
}
