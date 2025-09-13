"use client";

import { signOut } from "next-auth/react";
import Link from "next/link";

interface DashboardClientProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
  };
  stats: {
    sessions: number;
    photos: number;
    clients: number;
  };
  recentSessions: Array<{
    id: string;
    title: string;
    sessionDate: Date;
    client: {
      name: string;
    };
    _count: {
      photos: number;
    };
  }>;
}

export default function DashboardClient({
  user,
  stats,
  recentSessions
}: DashboardClientProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Photo Manager
              </h1>
              <p className="text-slate-600">
                Welcome back, {user.name || user.email}
              </p>
            </div>
            <button
              onClick={() => signOut()}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-blue-600 mr-4">📊</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.sessions}
                </p>
                <p className="text-slate-600">Photo Sessions</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-green-600 mr-4">📸</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.photos}
                </p>
                <p className="text-slate-600">Photos Uploaded</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="text-3xl text-purple-600 mr-4">👥</div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.clients}
                </p>
                <p className="text-slate-600">Clients</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/sessions/new"
              className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-4 rounded-lg transition-colors"
            >
              Create New Session
            </Link>
            <Link
              href="/dashboard/sessions"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-center py-3 px-4 rounded-lg transition-colors"
            >
              Manage Sessions
            </Link>
            <Link
              href="/dashboard/clients"
              className="bg-green-600 hover:bg-green-700 text-white text-center py-3 px-4 rounded-lg transition-colors"
            >
              Manage Clients
            </Link>
            <Link
              href="/dashboard/galleries"
              className="bg-purple-600 hover:bg-purple-700 text-white text-center py-3 px-4 rounded-lg transition-colors"
            >
              Manage Galleries
            </Link>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Sessions
            </h2>
          </div>
          <div className="divide-y">
            {recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <Link
                  key={session.id}
                  href={`/sessions/${session.id}`}
                  className="block p-6 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 hover:text-blue-600 transition-colors">
                        {session.title}
                      </h3>
                      <p className="text-slate-600">
                        Client: {session.client.name}
                      </p>
                      <p className="text-slate-500 text-sm">
                        {new Date(session.sessionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {session._count.photos}
                      </p>
                      <p className="text-slate-600 text-sm">photos</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="p-6 text-center text-slate-500">
                <p>
                  No sessions yet. Create your first session to get started!
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
