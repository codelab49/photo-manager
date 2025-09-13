"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Client {
  id: string;
  name: string;
  email: string;
}

interface PhotoSession {
  id: string;
  title: string;
  sessionDate: string;
  location: string | null;
  description: string | null;
  client: Client;
  _count: {
    photos: number;
  };
}

export default function SessionsManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<PhotoSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
  }, [status, router]);

  // Fetch sessions on component mount
  useEffect(() => {
    if (session) {
      fetchSessions();
    }
  }, [session]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sessions");
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setError("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSession = async (
    sessionId: string,
    sessionTitle: string
  ) => {
    if (
      !confirm(
        `Are you sure you want to delete the session "${sessionTitle}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeleteLoading(sessionId);
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error("Failed to delete session");
      }

      // Remove the session from the list
      setSessions(sessions.filter((session) => session.id !== sessionId));
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Failed to delete session. Please try again.");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Manage Photo Sessions
            </h1>
            <p className="mt-2 text-gray-600">
              View and manage all your photo sessions
            </p>
          </div>
          <div className="flex space-x-3">
            <Link
              href="/dashboard"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/sessions/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Create New Session
            </Link>
          </div>
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

        {/* Sessions List */}
        <div className="bg-white shadow rounded-lg">
          {sessions.length > 0 ? (
            <div className="overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Photos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {session.title}
                          </div>
                          {session.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {session.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {session.client.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {session.client.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(session.sessionDate).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          }
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {session._count.photos} photos
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {session.location || "Not specified"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/sessions/${session.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                          <button
                            onClick={() =>
                              handleDeleteSession(session.id, session.title)
                            }
                            disabled={deleteLoading === session.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {deleteLoading === session.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No sessions yet
              </h3>
              <p className="mt-2 text-gray-500">
                Get started by creating your first photo session.
              </p>
              <div className="mt-6">
                <Link
                  href="/sessions/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Create New Session
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
