"use client";

import { useState } from "react";
import Link from "next/link";
import PhotoUpload from "@/components/PhotoUpload";
import SecureImage from "@/components/SecureImage";
import { Photo, PhotoSession, User } from "@/types";

interface SessionDetailClientProps {
  session: PhotoSession;
  user: User;
}

export default function SessionDetailClient({
  session
}: SessionDetailClientProps) {
  const [photos] = useState<Photo[]>(session.photos);
  const [showUpload, setShowUpload] = useState(false);

  const handleUploadComplete = () => {
    // Refresh the page to get the updated photos from the database
    window.location.reload();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {showUpload ? "Cancel Upload" : "Upload Photos"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Session Info */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {session.title}
                </h1>
                <div className="space-y-2 text-gray-600">
                  <p>
                    <span className="font-medium">Client:</span>{" "}
                    {session.client.name}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span>{" "}
                    {session.client.email}
                  </p>
                  {session.client.phone && (
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {session.client.phone}
                    </p>
                  )}
                  <p>
                    <span className="font-medium">Date:</span>{" "}
                    {new Date(session.sessionDate).toLocaleDateString()}
                  </p>
                  {session.location && (
                    <p>
                      <span className="font-medium">Location:</span>{" "}
                      {session.location}
                    </p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-blue-600">
                  {photos.length}
                </p>
                <p className="text-gray-600">Photos</p>
              </div>
            </div>
            {session.description && (
              <div className="border-t pt-4">
                <p className="text-gray-700">{session.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Section */}
        {showUpload && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload Photos
              </h2>
              <PhotoUpload
                sessionId={session.id}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          </div>
        )}

        {/* Photos Grid */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Session Photos
            </h2>
          </div>
          <div className="p-6">
            {photos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="group relative bg-gray-100 rounded-lg overflow-hidden aspect-square"
                  >
                    {/* Photo Thumbnail */}
                    <SecureImage
                      photoId={photo.id}
                      type="thumbnail"
                      alt={photo.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    {/* Overlay - fixed to not interfere with image */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center p-4">
                      <div className="text-white text-center">
                        <p className="font-medium text-sm mb-1">
                          {photo.originalName}
                        </p>
                        <p className="text-xs">
                          {photo.width &&
                            photo.height &&
                            `${photo.width}x${photo.height} • `}
                          {formatFileSize(photo.size)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📸</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No photos yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Upload your first photos to get started
                </p>
                <button
                  onClick={() => setShowUpload(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
                >
                  Upload Photos
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
