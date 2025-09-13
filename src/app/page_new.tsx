import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center text-white">
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Photo Manager
        </h1>
        <p className="text-xl mb-8 text-slate-300">
          Professional photography portfolio and client gallery management
          system
        </p>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="text-3xl mb-4">📸</div>
            <h3 className="text-lg font-semibold mb-2">Upload & Organize</h3>
            <p className="text-slate-300">
              Easily upload and organize your photoshoot images with powerful
              management tools
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="text-3xl mb-4">🔒</div>
            <h3 className="text-lg font-semibold mb-2">Secure Sharing</h3>
            <p className="text-slate-300">
              Share watermarked previews with clients while protecting your
              original work
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6">
            <div className="text-3xl mb-4">⚡</div>
            <h3 className="text-lg font-semibold mb-2">Fast & Reliable</h3>
            <p className="text-slate-300">
              Built with modern technology for speed, reliability, and seamless
              user experience
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <Link
            href="/auth/signin"
            className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105"
          >
            Sign In to Dashboard
          </Link>

          <div className="text-slate-400">
            <p>New photographer? Contact admin for access</p>
          </div>
        </div>
      </div>
    </div>
  );
}
