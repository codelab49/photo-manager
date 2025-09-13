import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import SessionDetailClient from "./SessionDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SessionDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch session with client and photos
  const photoSession = await prisma.photoSession.findFirst({
    where: {
      id,
      photographerId: session.user.id
    },
    include: {
      client: true,
      photos: {
        orderBy: { uploadedAt: "desc" }
      },
      _count: {
        select: { photos: true }
      }
    }
  });

  if (!photoSession) {
    notFound();
  }

  return <SessionDetailClient session={photoSession} user={session.user} />;
}
