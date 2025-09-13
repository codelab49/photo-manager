import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";

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

    // Get all galleries for this user
    const galleries = await prisma.gallery.findMany({
      where: {
        session: {
          photographerId: user.id
        }
      },
      include: {
        session: {
          select: {
            title: true,
            sessionDate: true
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        },
        photos: {
          select: {
            id: true
          }
        },
        accessList: {
          select: {
            id: true,
            name: true,
            email: true,
            accessToken: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json(galleries);
  } catch (error) {
    console.error("Error fetching galleries:", error);
    return NextResponse.json(
      { error: "Failed to fetch galleries" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
    const { title, sessionId, photoIds, expiryDays = 30, accessList = [] } = body;

    // Validate input
    if (
      !title ||
      !sessionId ||
      !photoIds ||
      !Array.isArray(photoIds) ||
      photoIds.length === 0
    ) {
      return NextResponse.json(
        { error: "Missing required fields: title, sessionId, and photoIds" },
        { status: 400 }
      );
    }

    // Validate access list format
    if (accessList && !Array.isArray(accessList)) {
      return NextResponse.json(
        { error: "Access list must be an array" },
        { status: 400 }
      );
    }

    // Validate each access list item
    for (const person of accessList) {
      if (!person.name || !person.email || typeof person.name !== 'string' || typeof person.email !== 'string') {
        return NextResponse.json(
          { error: "Each access list item must have name and email strings" },
          { status: 400 }
        );
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(person.email)) {
        return NextResponse.json(
          { error: `Invalid email format: ${person.email}` },
          { status: 400 }
        );
      }
    }

    // Verify the session belongs to this user
    const photoSession = await prisma.photoSession.findFirst({
      where: {
        id: sessionId,
        photographerId: user.id
      },
      include: {
        client: true
      }
    });

    if (!photoSession) {
      return NextResponse.json(
        { error: "Photo session not found or access denied" },
        { status: 404 }
      );
    }

    // Verify all photos belong to this session
    const photos = await prisma.photo.findMany({
      where: {
        id: { in: photoIds },
        sessionId: sessionId
      }
    });

    if (photos.length !== photoIds.length) {
      return NextResponse.json(
        { error: "Some photos not found or do not belong to this session" },
        { status: 400 }
      );
    }

    // Create gallery
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const gallery = await prisma.gallery.create({
      data: {
        title,
        shareToken: uuidv4(),
        expiresAt,
        sessionId,
        clientId: photoSession.clientId,
        photos: {
          create: photoIds.map((photoId: string) => ({
            photoId
          }))
        },
        accessList: {
          create: accessList.map((person: { name: string; email: string }) => ({
            name: person.name.trim(),
            email: person.email.trim().toLowerCase(),
            accessToken: uuidv4()
          }))
        }
      },
      include: {
        session: {
          select: {
            title: true,
            sessionDate: true
          }
        },
        client: {
          select: {
            name: true,
            email: true
          }
        },
        photos: {
          select: {
            id: true
          }
        },
        accessList: {
          select: {
            id: true,
            name: true,
            email: true,
            accessToken: true
          }
        }
      }
    });

    return NextResponse.json(gallery, { status: 201 });
  } catch (error) {
    console.error("Error creating gallery:", error);
    return NextResponse.json(
      { error: "Failed to create gallery" },
      { status: 500 }
    );
  }
}
