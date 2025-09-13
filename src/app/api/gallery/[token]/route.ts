import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    // Find gallery by token
    const gallery = await prisma.gallery.findFirst({
      where: {
        shareToken: token,
        isActive: true
      },
      include: {
        photos: {
          include: {
            photo: true,
            likes: {
              select: {
                id: true,
                clientName: true,
                createdAt: true
              }
            },
            comments: {
              select: {
                id: true,
                comment: true,
                clientName: true,
                createdAt: true,
                updatedAt: true
              },
              orderBy: { createdAt: "desc" }
            }
          }
        },
        session: {
          include: {
            client: true
          }
        }
      }
    });

    if (!gallery) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    // Check if gallery has expired
    if (gallery.expiresAt && new Date() > gallery.expiresAt) {
      return NextResponse.json(
        { error: "Gallery has expired" },
        { status: 410 }
      );
    }

    return NextResponse.json({
      gallery: {
        id: gallery.id,
        title: gallery.title,
        description: gallery.description,
        createdAt: gallery.createdAt,
        expiresAt: gallery.expiresAt,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        photos: gallery.photos.map((gp: any) => ({
          ...gp.photo,
          likes: gp.likes,
          comments: gp.comments,
          likeCount: gp.likes.length,
          commentCount: gp.comments.length
        })),
        session: {
          title: gallery.session.title,
          date: gallery.session.sessionDate,
          client: {
            name: gallery.session.client.name
          }
        }
      }
    });
  } catch (error) {
    console.error("Gallery API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
