import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch user's data
  const [sessions, photos, clients] = await Promise.all([
    prisma.photoSession.count({
      where: { photographerId: session.user.id }
    }),
    prisma.photo.count({
      where: { photographerId: session.user.id }
    }),
    prisma.client.count({
      where: { photographerId: session.user.id }
    })
  ]);

  const recentSessions = await prisma.photoSession.findMany({
    where: { photographerId: session.user.id },
    include: {
      client: true,
      _count: {
        select: { photos: true }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 5
  });

  return (
    <DashboardClient
      user={session.user}
      stats={{ sessions, photos, clients }}
      recentSessions={recentSessions}
    />
  );
}
