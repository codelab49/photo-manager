"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface SessionFormData {
  title: string;
  clientId: string;
  sessionDate: string;
  location: string;
  description: string;
}

export default function NewSessionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<SessionFormData>({
    title: "",
    clientId: "",
    sessionDate: "",
    location: "",
    description: ""
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
  }, [status, router]);

  // Fetch clients on component mount
  useEffect(() => {
    if (session) {
      fetchClients();
    }
  }, [session]);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients");
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data = await response.json();

      // Check if data has a clients property (wrapped response) or is array directly
      let clientsArray;
      if (data.clients && Array.isArray(data.clients)) {
        clientsArray = data.clients;
      } else if (Array.isArray(data)) {
        clientsArray = data;
      } else {
        console.error("Clients data is not in expected format:", data);
        setClients([]);
        setError("Invalid clients data received");
        return;
      }

      setClients(clientsArray);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setClients([]); // Ensure clients is always an array
      setError("Failed to load clients");
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create session");
      }

      const newSession = await response.json();

      // Redirect to the session detail page
      router.push(`/sessions/${newSession.id}`);
    } catch (error) {
      console.error("Error creating session:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create session"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push("/dashboard");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Photo Session
          </h1>
          <p className="mt-2 text-gray-600">
            Set up a new photo session with your client
          </p>
        </div>

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

        {/* Form */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Session Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Smith Family Portrait Session"
                />
              </div>

              {/* Client Selection */}
              <div>
                <label
                  htmlFor="clientId"
                  className="block text-sm font-medium text-gray-700"
                >
                  Client *
                </label>
                <select
                  id="clientId"
                  name="clientId"
                  required
                  value={formData.clientId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a client...</option>
                  {Array.isArray(clients) &&
                    clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} ({client.email})
                      </option>
                    ))}
                </select>
                {Array.isArray(clients) && clients.length === 0 && (
                  <p className="mt-1 text-sm text-gray-500">
                    No clients found.{" "}
                    <a
                      href="/dashboard/clients"
                      className="text-blue-600 hover:text-blue-500"
                    >
                      Create a client first
                    </a>
                    .
                  </p>
                )}
              </div>

              {/* Session Date */}
              <div>
                <label
                  htmlFor="sessionDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Session Date *
                </label>
                <input
                  type="datetime-local"
                  id="sessionDate"
                  name="sessionDate"
                  required
                  value={formData.sessionDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="location"
                  className="block text-sm font-medium text-gray-700"
                >
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Central Park, NYC"
                />
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Any special requests, props needed, or other notes for the session..."
                />
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
                  type="submit"
                  disabled={
                    loading || !Array.isArray(clients) || clients.length === 0
                  }
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  {loading ? "Creating..." : "Create Session"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
