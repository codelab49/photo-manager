"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { PhotoUploadResult } from "@/types";

interface PhotoUploadProps {
  sessionId: string;
  onUploadComplete?: (photos: PhotoUploadResult[]) => void;
}

interface UploadProgress {
  file: File;
  progress: number;
  status: "uploading" | "completed" | "error";
  error?: string;
  photo?: PhotoUploadResult;
}

export default function PhotoUpload({
  sessionId,
  onUploadComplete
}: PhotoUploadProps) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = useCallback(
    async (
      file: File
    ): Promise<{ success: boolean; photo: PhotoUploadResult }> => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("sessionId", sessionId);

      const response = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      return response.json();
    },
    [sessionId]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (isUploading) return;

      setIsUploading(true);
      const newUploads: UploadProgress[] = acceptedFiles.map((file) => ({
        file,
        progress: 0,
        status: "uploading" as const
      }));

      setUploads(newUploads);

      const completedPhotos: PhotoUploadResult[] = [];

      // Upload files sequentially to avoid overwhelming the server
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];

        try {
          // Update progress to show upload starting
          setUploads((prev) =>
            prev.map((upload, index) =>
              index === i ? { ...upload, progress: 10 } : upload
            )
          );

          const result = await uploadFile(file);

          // Update progress to completed
          setUploads((prev) =>
            prev.map((upload, index) =>
              index === i
                ? {
                    ...upload,
                    progress: 100,
                    status: "completed" as const,
                    photo: result.photo
                  }
                : upload
            )
          );

          completedPhotos.push(result.photo);
        } catch (error) {
          // Update progress to show error
          setUploads((prev) =>
            prev.map((upload, index) =>
              index === i
                ? {
                    ...upload,
                    status: "error" as const,
                    error:
                      error instanceof Error ? error.message : "Upload failed"
                  }
                : upload
            )
          );
        }
      }

      setIsUploading(false);

      if (onUploadComplete && completedPhotos.length > 0) {
        onUploadComplete(completedPhotos);
      }
    },
    [isUploading, onUploadComplete, uploadFile]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"]
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const clearCompleted = () => {
    setUploads((prev) =>
      prev.filter((upload) => upload.status === "uploading")
    );
  };

  return (
    <div className="w-full">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : isUploading
              ? "border-gray-300 bg-gray-50 cursor-not-allowed"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          }
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-4">
          <div className="text-4xl">
            {isUploading ? "⏳" : isDragActive ? "📤" : "📸"}
          </div>
          <div>
            {isUploading ? (
              <p className="text-gray-600">Uploading photos...</p>
            ) : isDragActive ? (
              <p className="text-blue-600 font-medium">Drop photos here</p>
            ) : (
              <>
                <p className="text-gray-700 font-medium">
                  Drag & drop photos here, or click to select
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Accepts JPEG, PNG, WebP (max 10MB each)
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Upload Progress (
              {uploads.filter((u) => u.status === "completed").length}/
              {uploads.length})
            </h3>
            {uploads.some((u) => u.status === "completed") && !isUploading && (
              <button
                onClick={clearCompleted}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear completed
              </button>
            )}
          </div>

          <div className="space-y-3">
            {uploads.map((upload, index) => (
              <div
                key={index}
                className="bg-white border rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="text-lg">
                      {upload.status === "completed"
                        ? "✅"
                        : upload.status === "error"
                        ? "❌"
                        : "⏳"}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {upload.file.name}
                      </p>
                      <p className="text-gray-500 text-xs">
                        {formatFileSize(upload.file.size)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {upload.status === "completed" ? (
                      <span className="text-green-600 text-sm font-medium">
                        Completed
                      </span>
                    ) : upload.status === "error" ? (
                      <span className="text-red-600 text-sm font-medium">
                        Failed
                      </span>
                    ) : (
                      <span className="text-blue-600 text-sm font-medium">
                        Uploading...
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {upload.status === "uploading" && (
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${upload.progress}%` }}
                    />
                  </div>
                )}

                {/* Error Message */}
                {upload.status === "error" && upload.error && (
                  <p className="text-red-600 text-sm mt-2">{upload.error}</p>
                )}

                {/* Success Info */}
                {upload.status === "completed" && upload.photo && (
                  <div className="text-green-600 text-sm mt-2">
                    <p>
                      Uploaded as {upload.photo.filename} • {upload.photo.width}
                      x{upload.photo.height}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
