import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all sessions for this user with photos and client info
    const sessions = await prisma.photoSession.findMany({
      where: {
        photographerId: user.id,
      },
      include: {
        client: {
          select: {
            name: true,
            email: true,
          },
        },
        photos: {
          select: {
            id: true,
            filename: true,
          },
          orderBy: {
            uploadedAt: 'asc',
          },
        },
        _count: {
          select: {
            photos: true,
          },
        },
      },
      orderBy: {
        sessionDate: 'desc',
      },
    });

    // Add thumbnailUrl to photos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionsWithThumbnails = sessions.map((session: any) => ({
      ...session,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      photos: session.photos.map((photo: any) => ({
        ...photo,
        thumbnailUrl: `/api/photos/${photo.id}?type=thumbnail`,
      })),
    }));

    return NextResponse.json(sessionsWithThumbnails);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}
