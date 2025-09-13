import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get all sessions for this user with photos and client info
    const sessions = await prisma.photoSession.findMany({
      where: {
        photographerId: user.id
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            recipients: {
              select: {
                id: true,
                name: true,
                email: true,
                relation: true
              }
            }
          }
        },
        photos: {
          select: {
            id: true,
            filename: true
          },
          orderBy: {
            uploadedAt: "asc"
          }
        },
        _count: {
          select: {
            photos: true
          }
        }
      },
      orderBy: {
        sessionDate: "desc"
      }
    });

    // Add thumbnailUrl to photos
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionsWithThumbnails = sessions.map((session: any) => ({
      ...session,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      photos: session.photos.map((photo: any) => ({
        ...photo,
        thumbnailUrl: `/api/photos/${photo.id}?type=thumbnail`
      }))
    }));

    return NextResponse.json(sessionsWithThumbnails);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { title, clientId, sessionDate, location, description } = body;

    // Validate required fields
    if (!title || !clientId || !sessionDate) {
      return NextResponse.json(
        { error: "Title, client, and session date are required" },
        { status: 400 }
      );
    }

    // Verify the client belongs to this photographer
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        photographerId: user.id
      }
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found or unauthorized" },
        { status: 404 }
      );
    }

    // Create the photo session
    const photoSession = await prisma.photoSession.create({
      data: {
        title: title.trim(),
        sessionDate: new Date(sessionDate),
        location: location?.trim() || null,
        description: description?.trim() || null,
        photographerId: user.id,
        clientId: clientId
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            recipients: {
              select: {
                id: true,
                name: true,
                email: true,
                relation: true
              }
            }
          }
        },
        _count: {
          select: {
            photos: true
          }
        }
      }
    });

    return NextResponse.json(photoSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
