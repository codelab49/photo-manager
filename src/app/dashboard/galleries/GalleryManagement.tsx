"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Gallery {
  id: string;
  title: string;
  shareToken: string;
  expiresAt: string;
  createdAt: string;
  session: {
    title: string;
    sessionDate: string;
  };
  client: {
    name: string;
    email: string;
  };
  photos: {
    id: string;
  }[];
  accessList?: {
    id: string;
    name: string;
    email: string;
    accessToken: string;
  }[];
}

interface PhotoSession {
  id: string;
  title: string;
  sessionDate: string;
  client: {
    id: string;
    name: string;
    email: string;
    recipients?: {
      id: string;
      name: string;
      email: string;
      relation?: string;
    }[];
  };
  photos: {
    id: string;
    filename: string;
    thumbnailUrl?: string;
  }[];
}

export function GalleryManagement() {
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGalleries();
    fetchSessions();
  }, []);

  const fetchGalleries = async () => {
    try {
      const response = await fetch("/api/galleries");
      if (!response.ok) throw new Error("Failed to fetch galleries");
      const data = await response.json();
      setGalleries(data);
    } catch (err) {
      console.error("Error fetching galleries:", err);
      setError("Failed to load galleries");
    }
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions");
      if (!response.ok) throw new Error("Failed to fetch sessions");
      const data = await response.json();
      setSessions(data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching sessions:", err);
      setError("Failed to load sessions");
      setLoading(false);
    }
  };

  const deleteGallery = async (galleryId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this gallery? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/galleries/${galleryId}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Failed to delete gallery");

      setGalleries(galleries.filter((g) => g.id !== galleryId));
    } catch (err) {
      console.error("Error deleting gallery:", err);
      setError("Failed to delete gallery");
    }
  };

  const copyGalleryLink = (token: string) => {
    const url = `${window.location.origin}/gallery/${token}`;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
    alert("Gallery link copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchGalleries();
            fetchSessions();
          }}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-gray-50 rounded-lg p-6">
      {/* Create Gallery Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Your Galleries</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Create New Gallery
        </button>
      </div>

      {/* Create Gallery Form */}
      {showCreateForm && (
        <CreateGalleryForm
          sessions={sessions}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            fetchGalleries();
          }}
        />
      )}

      {/* Galleries List */}
      {galleries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No galleries created yet</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            Create Your First Gallery
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {galleries.map((gallery) => (
            <div
              key={gallery.id}
              className="bg-white rounded-lg shadow-md p-6 border"
            >
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {gallery.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {gallery.session.title} •{" "}
                  {new Date(gallery.session.sessionDate).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600">
                  Client: {gallery.client.name}
                </p>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600">
                  {gallery.photos.length} photo
                  {gallery.photos.length !== 1 ? "s" : ""}
                </p>
                <p className="text-xs text-gray-500">
                  Created: {new Date(gallery.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-500">
                  Expires: {new Date(gallery.expiresAt).toLocaleDateString()}
                </p>
              </div>

              {/* Access List */}
              {gallery.accessList && gallery.accessList.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Access Links ({gallery.accessList.length} people)
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {gallery.accessList.map((person) => (
                      <div
                        key={person.id}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-gray-700 truncate flex-1 mr-2">
                          {person.name} ({person.email})
                        </span>
                        <button
                          onClick={() => {
                            const url = `${window.location.origin}/gallery/${gallery.shareToken}?access=${person.accessToken}`;
                            navigator.clipboard.writeText(url);
                            alert(`Link copied for ${person.name}!`);
                          }}
                          className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs hover:bg-blue-200 transition-colors whitespace-nowrap"
                          title={`Copy personalized link for ${person.name}`}
                        >
                          Copy Link
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2">
                <button
                  onClick={() => copyGalleryLink(gallery.shareToken)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  title="Copy main gallery link"
                >
                  {gallery.accessList && gallery.accessList.length > 0
                    ? "Copy Main Link"
                    : "Copy Link"}
                </button>
                <Link
                  href={`/gallery/${gallery.shareToken}`}
                  target="_blank"
                  className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors text-center"
                >
                  Preview
                </Link>
                <button
                  onClick={() => deleteGallery(gallery.id)}
                  className="bg-red-100 text-red-600 px-3 py-2 rounded text-sm hover:bg-red-200 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CreateGalleryFormProps {
  sessions: PhotoSession[];
  onClose: () => void;
  onSuccess: () => void;
}

interface AccessPerson {
  name: string;
  email: string;
}

function CreateGalleryForm({
  sessions,
  onClose,
  onSuccess
}: CreateGalleryFormProps) {
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);
  const [accessList, setAccessList] = useState<AccessPerson[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSession = sessions.find((s) => s.id === selectedSessionId);

  const togglePhoto = (photoId: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(photoId)
        ? prev.filter((id) => id !== photoId)
        : [...prev, photoId]
    );
  };

  const selectAllPhotos = () => {
    if (!selectedSession) return;
    setSelectedPhotos(selectedSession.photos.map((p) => p.id));
  };

  const clearSelection = () => {
    setSelectedPhotos([]);
  };

  const addAccessPerson = () => {
    setAccessList([...accessList, { name: "", email: "" }]);
  };

  const removeAccessPerson = (index: number) => {
    setAccessList(accessList.filter((_, i) => i !== index));
  };

  const updateAccessPerson = (
    index: number,
    field: "name" | "email",
    value: string
  ) => {
    const updated = [...accessList];
    updated[index][field] = value;
    setAccessList(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId || selectedPhotos.length === 0 || !title.trim()) {
      setError(
        "Please fill in all required fields and select at least one photo"
      );
      return;
    }

    // Validate access list - each person must have both name and email
    const validAccessList = accessList.filter(
      (person) => person.name.trim() && person.email.trim()
    );

    if (accessList.length > 0 && validAccessList.length === 0) {
      setError("Please complete all access list entries or remove empty ones");
      return;
    }

    // Validate email formats
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const person of validAccessList) {
      if (!emailRegex.test(person.email)) {
        setError(`Invalid email format: ${person.email}`);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/galleries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: title.trim(),
          sessionId: selectedSessionId,
          photoIds: selectedPhotos,
          expiryDays,
          accessList: validAccessList
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create gallery");
      }

      onSuccess();
    } catch (err) {
      console.error("Error creating gallery:", err);
      setError(err instanceof Error ? err.message : "Failed to create gallery");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">
              Create New Gallery
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {/* Gallery Title */}
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Gallery Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
              placeholder="e.g., Wedding Photos - Preview"
              required
            />
          </div>

          {/* Session Selection */}
          <div>
            <label
              htmlFor="session"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Photo Session *
            </label>
            <select
              id="session"
              value={selectedSessionId}
              onChange={(e) => {
                const sessionId = e.target.value;
                setSelectedSessionId(sessionId);
                setSelectedPhotos([]);

                // Auto-populate access list with client recipients
                const session = sessions.find((s) => s.id === sessionId);
                if (session && session.client.recipients) {
                  const clientRecipients = session.client.recipients.map(
                    (recipient) => ({
                      name: recipient.name,
                      email: recipient.email
                    })
                  );
                  setAccessList(clientRecipients);
                } else {
                  // If no recipients, clear access list or add primary client email
                  setAccessList(
                    session
                      ? [
                          {
                            name: session.client.name,
                            email: session.client.email
                          }
                        ]
                      : []
                  );
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              required
            >
              <option value="">Select a session...</option>
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title} - {session.client.name} (
                  {new Date(session.sessionDate).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Days */}
          <div>
            <label
              htmlFor="expiryDays"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Gallery Expires After (days)
            </label>
            <input
              type="number"
              id="expiryDays"
              value={expiryDays}
              onChange={(e) => setExpiryDays(parseInt(e.target.value) || 30)}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
            />
          </div>

          {/* Access List */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Gallery Access List
              </label>
              <button
                type="button"
                onClick={addAccessPerson}
                className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
              >
                Add Person
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              Recipients from client management are auto-loaded. You can add
              additional people or modify as needed. Each person will get a
              unique access link.
            </p>

            {accessList.length === 0 ? (
              <div className="text-center py-4 border-2 border-dashed border-gray-300 rounded-md">
                <p className="text-gray-500 text-sm">
                  No access list configured
                </p>
                <p className="text-gray-400 text-xs">
                  Gallery will be publicly accessible via the main link
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-40 overflow-y-auto">
                {accessList.map((person, index) => (
                  <div
                    key={index}
                    className="flex gap-3 items-center bg-gray-50 p-3 rounded-md"
                  >
                    <div className="flex-1">
                      <input
                        type="text"
                        value={person.name}
                        onChange={(e) =>
                          updateAccessPerson(index, "name", e.target.value)
                        }
                        placeholder="Full Name"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="email"
                        value={person.email}
                        onChange={(e) =>
                          updateAccessPerson(index, "email", e.target.value)
                        }
                        placeholder="email@example.com"
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAccessPerson(index)}
                      className="text-red-600 hover:text-red-800 p-1"
                      title="Remove person"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Photo Selection */}
          {selectedSession && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Select Photos * ({selectedPhotos.length} selected)
                </label>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={selectAllPhotos}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-3">
                {selectedSession.photos.map((photo) => (
                  <div
                    key={photo.id}
                    className={`relative aspect-square cursor-pointer rounded-md overflow-hidden border-2 transition-all ${
                      selectedPhotos.includes(photo.id)
                        ? "border-blue-500 ring-2 ring-blue-200"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => togglePhoto(photo.id)}
                  >
                    {photo.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={photo.thumbnailUrl}
                        alt={photo.filename}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <svg
                          className="w-6 h-6 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    )}

                    {selectedPhotos.includes(photo.id) && (
                      <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                        <div className="bg-blue-500 text-white rounded-full p-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                loading ||
                !selectedSessionId ||
                selectedPhotos.length === 0 ||
                !title.trim()
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating..." : "Create Gallery"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
