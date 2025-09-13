import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Params {
  galleryId: string;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
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

    const { galleryId } = params;

    // Verify the gallery belongs to this user
    const gallery = await prisma.gallery.findFirst({
      where: {
        id: galleryId,
        session: {
          photographerId: user.id,
        },
      },
    });

    if (!gallery) {
      return NextResponse.json(
        { error: 'Gallery not found or access denied' },
        { status: 404 }
      );
    }

    // Delete the gallery
    await prisma.gallery.delete({
      where: { id: galleryId },
    });

    return NextResponse.json({ message: 'Gallery deleted successfully' });
  } catch (error) {
    console.error('Error deleting gallery:', error);
    return NextResponse.json(
      { error: 'Failed to delete gallery' },
      { status: 500 }
    );
  }
}
