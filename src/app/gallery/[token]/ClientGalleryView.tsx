/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";

interface PhotoLike {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface PhotoComment {
  id: string;
  comment: string;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

interface Photo {
  id: string;
  originalName: string;
  previewPath: string | null;
  thumbnailPath: string | null;
  width: number | null;
  height: number | null;
  size: number;
  likes: PhotoLike[];
  comments: PhotoComment[];
  likeCount: number;
  commentCount: number;
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

interface CurrentUser {
  id: string;
  name: string;
  email: string;
  accessToken: string;
}

interface ClientGalleryViewProps {
  gallery: Gallery;
  token: string;
  currentUser: CurrentUser | null;
}

export default function ClientGalleryView({
  gallery,
  token,
  currentUser
}: ClientGalleryViewProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "slideshow">("grid");
  const [filter, setFilter] = useState<"all" | "liked">("all");
  const [likedPhotos, setLikedPhotos] = useState<Set<string>>(new Set());
  const [commentText, setCommentText] = useState("");

  // Disable keyboard shortcuts that might allow saving
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "s" || e.key === "a" || e.key === "p") {
        e.preventDefault();
      }
    }
  };

  // Handle like/unlike photo
  const handleLikePhoto = async (photoId: string) => {
    if (!currentUser) {
      alert("Access token not found. Please use the correct gallery link.");
      return;
    }

    try {
      const isLiked = likedPhotos.has(photoId);
      const method = isLiked ? "DELETE" : "POST";

      const response = await fetch(
        `/api/gallery/${token}/photo/${photoId}/like`,
        {
          method,
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ accessToken: currentUser.accessToken })
        }
      );

      if (response.ok) {
        const newLikedPhotos = new Set(likedPhotos);
        if (isLiked) {
          newLikedPhotos.delete(photoId);
        } else {
          newLikedPhotos.add(photoId);
        }
        setLikedPhotos(newLikedPhotos);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to like photo");
      }
    } catch (error) {
      console.error("Like error:", error);
      alert("Failed to like photo");
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (photoId: string, comment: string) => {
    if (!currentUser || !comment.trim()) {
      alert(
        "Access token not found or comment is empty. Please use the correct gallery link."
      );
      return;
    }

    try {
      const response = await fetch(
        `/api/gallery/${token}/photo/${photoId}/comment`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            comment: comment.trim(),
            accessToken: currentUser.accessToken
          })
        }
      );

      if (response.ok) {
        setCommentText("");
        // Refresh the page to show new comment
        window.location.reload();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Comment error:", error);
      alert("Failed to add comment");
    }
  };

  // Filter photos based on selected filter
  const filteredPhotos =
    filter === "liked"
      ? gallery.photos.filter((photo) => likedPhotos.has(photo.id))
      : gallery.photos;

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
      day: "numeric"
    });
  };

  const expiryDate = gallery.expiresAt ? new Date(gallery.expiresAt) : null;
  const isExpiringSoon =
    expiryDate && expiryDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 days

  return (
    <div
      className="min-h-screen bg-gray-50"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      style={{
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        userSelect: "none"
      }}
    >
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {gallery.title}
                </h1>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Client:</span>{" "}
                    {gallery.session.client.name}
                  </p>
                  <p>
                    <span className="font-medium">Session:</span>{" "}
                    {gallery.session.title}
                  </p>
                  <p>
                    <span className="font-medium">Date:</span>{" "}
                    {formatDate(gallery.session.date)}
                  </p>
                </div>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">
                    {gallery.photos.length}
                  </p>
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
                      This gallery will expire on{" "}
                      {formatDate(expiryDate.toISOString())}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
      {/* Welcome Message for Authenticated Users */}
      {currentUser && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <span className="font-medium">
                  Welcome, {currentUser.name}!
                </span>
                <br />
                You can like photos and leave comments. Your feedback will be
                attributed to you automatically.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Access Required Message for Non-Authenticated Users */}
      {!currentUser && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-6">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                <span className="font-medium">Access Required</span>
                <br />
                Please use the personalized link provided by your photographer
                to like photos and leave comments.
              </p>
            </div>
          </div>
        </div>
      )}{" "}
      {/* Filter Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6">
            <button
              onClick={() => setFilter("all")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === "all"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              All Photos ({gallery.photos.length})
            </button>
            <button
              onClick={() => setFilter("liked")}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                filter === "liked"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Liked Photos ({likedPhotos.size})
            </button>
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredPhotos.length > 0 ? (
          viewMode === "grid" ? (
            /* Grid View */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <div
                    className="aspect-square bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    {photo.thumbnailPath && (
                      <img
                        src={`/api/gallery/${token}/photo/${photo.id}?type=thumbnail`}
                        alt={photo.originalName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                        style={{ userSelect: "none" }}
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900 truncate flex-1">
                        {photo.originalName}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLikePhoto(photo.id);
                        }}
                        className={`ml-2 p-1 rounded-full transition-colors ${
                          likedPhotos.has(photo.id)
                            ? "text-red-500 hover:text-red-600"
                            : "text-gray-400 hover:text-red-500"
                        }`}
                        title={likedPhotos.has(photo.id) ? "Unlike" : "Like"}
                      >
                        <svg
                          className="w-5 h-5"
                          fill={
                            likedPhotos.has(photo.id) ? "currentColor" : "none"
                          }
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                          />
                        </svg>
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {photo.width &&
                          photo.height &&
                          `${photo.width}×${photo.height}`}
                      </span>
                      <span>{formatFileSize(photo.size)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                      <span>❤️ {photo.likeCount}</span>
                      <span>💬 {photo.commentCount}</span>
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
                      onContextMenu={(e) => e.preventDefault()}
                      onDragStart={(e) => e.preventDefault()}
                      style={{ userSelect: "none" }}
                    />
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white px-3 py-2 rounded">
                    <p className="font-medium">{selectedPhoto.originalName}</p>
                    <p className="text-sm opacity-90">
                      {selectedPhoto.width &&
                        selectedPhoto.height &&
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
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                          style={{ userSelect: "none" }}
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === "liked" ? "No liked photos" : "No photos available"}
            </h3>
            <p className="text-gray-600">
              {filter === "liked"
                ? "You haven't liked any photos yet. Like some photos to see them here!"
                : "This gallery does not contain any photos yet."}
            </p>
          </div>
        )}
      </main>
      {/* Photo Modal with Comments */}
      {selectedPhoto && viewMode === "grid" && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-6xl w-full h-full flex">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-xl z-10"
            >
              ✕ Close
            </button>

            {/* Image Section */}
            <div className="flex-1 flex items-center justify-center">
              <img
                src={`/api/gallery/${token}/photo/${selectedPhoto.id}?type=preview`}
                alt={selectedPhoto.originalName}
                className="max-w-full max-h-[80vh] object-contain"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                style={{ userSelect: "none" }}
              />
            </div>

            {/* Comments Sidebar */}
            <div className="w-96 bg-white ml-4 rounded-lg flex flex-col max-h-[80vh]">
              {/* Photo Info Header */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate">
                    {selectedPhoto.originalName}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLikePhoto(selectedPhoto.id);
                    }}
                    className={`p-1 rounded-full transition-colors ${
                      likedPhotos.has(selectedPhoto.id)
                        ? "text-red-500 hover:text-red-600"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                  >
                    <svg
                      className="w-6 h-6"
                      fill={
                        likedPhotos.has(selectedPhoto.id)
                          ? "currentColor"
                          : "none"
                      }
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedPhoto.width &&
                    selectedPhoto.height &&
                    `${selectedPhoto.width}×${selectedPhoto.height} • `}
                  {formatFileSize(selectedPhoto.size)}
                </p>
                <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                  <span>❤️ {selectedPhoto.likeCount} likes</span>
                  <span>💬 {selectedPhoto.commentCount} comments</span>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {selectedPhoto.comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm text-gray-900">
                        {comment.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{comment.comment}</p>
                    {comment.updatedAt !== comment.createdAt && (
                      <p className="text-xs text-gray-500 mt-1">
                        (edited {formatDate(comment.updatedAt)})
                      </p>
                    )}
                  </div>
                ))}

                {selectedPhoto.comments.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No comments yet.</p>
                    <p className="text-sm">Be the first to leave a comment!</p>
                  </div>
                )}
              </div>

              {/* Add Comment Form */}
              {currentUser && (
                <div className="p-4 border-t">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="mt-2 flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      Commenting as: {currentUser.name}
                    </span>
                    <button
                      onClick={async () => {
                        await handleCommentSubmit(
                          selectedPhoto.id,
                          commentText
                        );
                        setCommentText("");
                        // Refresh the page to show new comment
                        window.location.reload();
                      }}
                      disabled={!commentText.trim()}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                      Post
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
