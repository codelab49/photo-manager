import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const photoSession = await prisma.photoSession.findFirst({
      where: {
        id: params.id,
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
            filename: true,
            originalFilename: true,
            uploadedAt: true
          },
          orderBy: {
            uploadedAt: "asc"
          }
        },
        _count: {
          select: {
            photos: true,
            galleries: true
          }
        }
      }
    });

    if (!photoSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Add thumbnail URLs to photos
    const sessionWithThumbnails = {
      ...photoSession,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      photos: photoSession.photos.map((photo: any) => ({
        ...photo,
        thumbnailUrl: `/api/photos/${photo.id}?type=thumbnail`
      }))
    };

    return NextResponse.json(sessionWithThumbnails);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { title, clientId, sessionDate, location, description } =
      await request.json();

    // Validate required fields
    if (!title || !clientId || !sessionDate) {
      return NextResponse.json(
        { error: "Title, client, and session date are required" },
        { status: 400 }
      );
    }

    // Check if session exists and belongs to user
    const existingSession = await prisma.photoSession.findFirst({
      where: {
        id: params.id,
        photographerId: user.id
      }
    });

    if (!existingSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Verify client exists and belongs to user
    const client = await prisma.client.findFirst({
      where: {
        id: clientId,
        photographerId: user.id
      }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 400 });
    }

    // Update the session
    const updatedSession = await prisma.photoSession.update({
      where: { id: params.id },
      data: {
        title,
        clientId,
        sessionDate: new Date(sessionDate),
        location: location || null,
        description: description || null
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
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
            filename: true,
            originalName: true,
            path: true,
            size: true,
            width: true,
            height: true,
            uploadedAt: true
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
      }
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Check if session exists and belongs to user
    const photoSession = await prisma.photoSession.findFirst({
      where: {
        id: params.id,
        photographerId: user.id
      },
      include: {
        _count: {
          select: {
            photos: true,
            galleries: true
          }
        }
      }
    });

    if (!photoSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if session has photos or galleries
    if (photoSession._count.photos > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete session with photos. Please delete all photos first."
        },
        { status: 400 }
      );
    }

    if (photoSession._count.galleries > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete session with galleries. Please delete all galleries first."
        },
        { status: 400 }
      );
    }

    // Delete the session
    await prisma.photoSession.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
