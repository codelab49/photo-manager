/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

interface Photo {
  id: string;
  originalName: string;
  previewPath: string | null;
  thumbnailPath: string | null;
  width: number | null;
  height: number | null;
  size: number;
}

interface Gallery {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  expiresAt: string | null;
  photos: Photo[];
  session: {
    title: string;
    date: string;
    client: {
      name: string;
    };
  };
}

interface ClientGalleryViewProps {
  gallery: Gallery;
  token: string;
}

export default function ClientGalleryView({ gallery, token }: ClientGalleryViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "slideshow">("grid");

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const expiryDate = gallery.expiresAt ? new Date(gallery.expiresAt) : null;
  const isExpiringSoon = expiryDate && expiryDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{gallery.title}</h1>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Client:</span> {gallery.session.client.name}
                  </p>
                  <p>
                    <span className="font-medium">Session:</span> {gallery.session.title}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span> {formatDate(gallery.session.date)}
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{gallery.photos.length}</p>
                  <p className="text-sm text-gray-600">Photos</p>
                </div>
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === "grid"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode("slideshow")}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      viewMode === "slideshow"
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Slideshow
                  </button>
                </div>
              </div>
            </div>
            
            {gallery.description && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <p className="text-blue-800">{gallery.description}</p>
              </div>
            )}

            {isExpiringSoon && expiryDate && (
              <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center">
                  <div className="text-yellow-800">
                    <p className="font-medium">Gallery Expiring Soon</p>
                    <p className="text-sm">
                      This gallery will expire on {formatDate(expiryDate.toISOString())}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {gallery.photos.length > 0 ? (
          viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {gallery.photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="aspect-square bg-gray-100">
                    {photo.thumbnailPath && (
                      <img
                        src={`/api/gallery/${token}/photo/${photo.id}?type=thumbnail`}
                        alt={photo.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {photo.originalName}
                    </p>
                    <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {photo.width && photo.height && `${photo.width}×${photo.height}`}
                      </span>
                      <span>{formatFileSize(photo.size)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Slideshow View */
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {selectedPhoto && (
                <div className="relative">
                  <div className="aspect-video bg-gray-100 flex items-center justify-center">
                    <img
                      src={`/api/gallery/${token}/photo/${selectedPhoto.id}?type=preview`}
                      alt={selectedPhoto.originalName}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded">
                    <p className="font-medium">{selectedPhoto.originalName}</p>
                    <p className="text-sm opacity-90">
                      {selectedPhoto.width && selectedPhoto.height && 
                        `${selectedPhoto.width}×${selectedPhoto.height} • `}
                      {formatFileSize(selectedPhoto.size)}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Thumbnail strip */}
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex space-x-2 overflow-x-auto">
                  {gallery.photos.map((photo) => (
                    <button
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedPhoto?.id === photo.id
                          ? "border-blue-500"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {photo.thumbnailPath && (
                        <img
                          src={`/api/gallery/${token}/photo/${photo.id}?type=thumbnail`}
                          alt={photo.originalName}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No photos available</h3>
            <p className="text-gray-600">This gallery does not contain any photos yet.</p>
          </div>
        )}
      </main>
      
      {/* Photo Modal */}
      {selectedPhoto && viewMode === "grid" && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-5xl max-h-full">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl"
            >
              ✕ Close
            </button>
            <img
              src={`/api/gallery/${token}/photo/${selectedPhoto.id}?type=preview`}
              alt={selectedPhoto.originalName}
              className="max-w-full max-h-[80vh] object-contain"
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded">
              <p className="font-medium">{selectedPhoto.originalName}</p>
              <p className="text-sm opacity-90">
                {selectedPhoto.width && selectedPhoto.height && 
                  `${selectedPhoto.width}×${selectedPhoto.height} • `}
                {formatFileSize(selectedPhoto.size)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
