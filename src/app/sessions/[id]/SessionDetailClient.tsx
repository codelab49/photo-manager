"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import PhotoUpload from "@/components/PhotoUpload";
import SecureImage from "@/components/SecureImage";
import { Photo, PhotoSession, User, Client, Recipient } from "@/types";

interface SessionDetailClientProps {
  session: PhotoSession;
  user: User;
}

export default function SessionDetailClient({
  session: initialSession
}: SessionDetailClientProps) {
  const [session, setSession] = useState<PhotoSession>(initialSession);
  const [photos] = useState<Photo[]>(session.photos);
  const [showUpload, setShowUpload] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    title: session.title,
    clientId: session.client.id,
    sessionDate: new Date(session.sessionDate).toISOString().slice(0, 16),
    location: session.location || "",
    description: session.description || "",
    clientName: session.client.name,
    clientEmail: session.client.email,
    clientPhone: session.client.phone || "",
    recipients: session.client.recipients || []
  });

  // Fetch clients when entering edit mode
  useEffect(() => {
    if (isEditing && clients.length === 0) {
      fetchClients();
    }
  }, [isEditing, clients.length]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) throw new Error("Failed to fetch clients");
      const data = await response.json();
      setClients(Array.isArray(data) ? data : data.clients || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setError("Failed to load clients");
    }
  };

  const handleUploadComplete = () => {
    // Refresh the page to get the updated photos from the database
    window.location.reload();
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sessions/${session.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: editData.title,
          clientId: editData.clientId,
          sessionDate: editData.sessionDate,
          location: editData.location,
          description: editData.description
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update session");
      }

      const updatedSession = await response.json();
      setSession(updatedSession);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating session:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update session"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      title: session.title,
      clientId: session.client.id,
      sessionDate: new Date(session.sessionDate).toISOString().slice(0, 16),
      location: session.location || "",
      description: session.description || "",
      clientName: session.client.name,
      clientEmail: session.client.email,
      clientPhone: session.client.phone || "",
      recipients: session.client.recipients || []
    });
    setIsEditing(false);
    setError(null);
  };

  const addRecipient = () => {
    setEditData((prev) => ({
      ...prev,
      recipients: [
        ...prev.recipients,
        { id: "", name: "", email: "", relation: "" }
      ]
    }));
  };

  const removeRecipient = (index: number) => {
    setEditData((prev) => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index)
    }));
  };

  const updateRecipient = (index: number, field: string, value: string) => {
    setEditData((prev) => ({
      ...prev,
      recipients: prev.recipients.map((recipient, i) =>
        i === index ? { ...recipient, [field]: value } : recipient
      )
    }));
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
                onClick={() => setIsEditing(!isEditing)}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                {isEditing ? "Cancel Edit" : "Edit Session"}
              </button>
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
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Session Info */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6">
            {!isEditing ? (
              <>
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
                {session.client.recipients &&
                  session.client.recipients.length > 0 && (
                    <div className="border-t pt-4 mt-4">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Recipients
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {session.client.recipients.map((recipient, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded-lg"
                          >
                            <p className="font-medium text-gray-900">
                              {recipient.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {recipient.email}
                            </p>
                            {recipient.relation && (
                              <p className="text-sm text-gray-500">
                                {recipient.relation}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </>
            ) : (
              <form className="space-y-6">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Session Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={editData.title}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Client Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Client *
                  </label>
                  <select
                    name="clientId"
                    value={editData.clientId}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Session Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Session Date *
                  </label>
                  <input
                    type="datetime-local"
                    name="sessionDate"
                    value={editData.sessionDate}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={editData.location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Central Park, NYC"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows={4}
                    value={editData.description}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 bg-white text-gray-900 border border-gray-400 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Any special requests, props needed, or other notes for the session..."
                  />
                </div>

                {/* Recipients */}
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Recipients
                    </label>
                    <button
                      type="button"
                      onClick={addRecipient}
                      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
                    >
                      Add Recipient
                    </button>
                  </div>
                  {editData.recipients.map((recipient, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 mb-3"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            Name
                          </label>
                          <input
                            type="text"
                            value={recipient.name}
                            onChange={(e) =>
                              updateRecipient(index, "name", e.target.value)
                            }
                            className="mt-1 block w-full px-2 py-1 text-sm bg-white text-gray-900 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            value={recipient.email}
                            onChange={(e) =>
                              updateRecipient(index, "email", e.target.value)
                            }
                            className="mt-1 block w-full px-2 py-1 text-sm bg-white text-gray-900 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">
                            Relation
                          </label>
                          <input
                            type="text"
                            value={recipient.relation || ""}
                            onChange={(e) =>
                              updateRecipient(index, "relation", e.target.value)
                            }
                            className="mt-1 block w-full px-2 py-1 text-sm bg-white text-gray-900 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Spouse, Child"
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRecipient(index)}
                        className="mt-2 text-sm text-red-600 hover:text-red-800"
                      >
                        Remove Recipient
                      </button>
                    </div>
                  ))}
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
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
