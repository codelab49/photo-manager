import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ token: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const { searchParams } = new URL(request.url);
    const accessToken = searchParams.get("access");

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
              include: {
                galleryAccess: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            comments: {
              include: {
                galleryAccess: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              },
              orderBy: { createdAt: "desc" }
            }
          }
        },
        session: {
          include: {
            client: true
          }
        },
        accessList: true // Include gallery access list
      }
    });

    if (!gallery) {
      return NextResponse.json({ error: "Gallery not found" }, { status: 404 });
    }

    // Check if access token is provided and valid
    let currentUser = null;
    if (accessToken) {
      currentUser = await prisma.galleryAccess.findFirst({
        where: {
          accessToken: accessToken,
          galleryId: gallery.id
        }
      });
    }

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
        photos: gallery.photos.map((gp: (typeof gallery.photos)[0]) => ({
          ...gp.photo,
          likes: gp.likes.map((like: (typeof gp.likes)[0]) => ({
            id: like.id,
            createdAt: like.createdAt,
            name: like.galleryAccess.name,
            email: like.galleryAccess.email
          })),
          comments: gp.comments.map((comment: (typeof gp.comments)[0]) => ({
            id: comment.id,
            comment: comment.comment,
            createdAt: comment.createdAt,
            updatedAt: comment.updatedAt,
            name: comment.galleryAccess.name,
            email: comment.galleryAccess.email
          })),
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
      },
      currentUser: currentUser
        ? {
            id: currentUser.id,
            name: currentUser.name,
            email: currentUser.email,
            accessToken: currentUser.accessToken
          }
        : null
    });
  } catch (error) {
    console.error("Gallery API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
