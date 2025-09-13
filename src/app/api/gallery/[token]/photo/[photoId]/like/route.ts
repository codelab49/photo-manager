import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string; token: string }> }
) {
  try {
    const { photoId, token } = await params;
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    // Verify access token and get gallery access
    const galleryAccess = await prisma.galleryAccess.findFirst({
      where: {
        accessToken: accessToken,
        gallery: {
          shareToken: token,
          isActive: true
        }
      },
      include: {
        gallery: {
          include: {
            photos: {
              where: { photoId }
            }
          }
        }
      }
    });

    if (!galleryAccess) {
      return NextResponse.json(
        { error: "Invalid access token or gallery not found" },
        { status: 403 }
      );
    }

    const gallery = galleryAccess.gallery;

    // Check if gallery has expired
    if (gallery.expiresAt && gallery.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Gallery has expired" },
        { status: 410 }
      );
    }

    const galleryPhoto = gallery.photos.find((gp) => gp.photoId === photoId);
    if (!galleryPhoto) {
      return NextResponse.json(
        { error: "Photo not found in gallery" },
        { status: 404 }
      );
    }

    // Check if already liked by this user
    const existingLike = await prisma.photoLike.findUnique({
      where: {
        galleryPhotoId_galleryAccessId: {
          galleryPhotoId: galleryPhoto.id,
          galleryAccessId: galleryAccess.id
        }
      }
    });

    if (existingLike) {
      return NextResponse.json(
        { error: "Photo already liked by this user" },
        { status: 409 }
      );
    }

    // Create the like
    const like = await prisma.photoLike.create({
      data: {
        galleryPhotoId: galleryPhoto.id,
        galleryAccessId: galleryAccess.id
      },
      include: {
        galleryAccess: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    // Get updated like count
    const likeCount = await prisma.photoLike.count({
      where: { galleryPhotoId: galleryPhoto.id }
    });

    return NextResponse.json({
      success: true,
      like: {
        id: like.id,
        name: like.galleryAccess.name,
        email: like.galleryAccess.email,
        createdAt: like.createdAt
      },
      likeCount
    });
  } catch (error) {
    console.error("Like error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string; token: string }> }
) {
  try {
    const { photoId, token } = await params;
    const { accessToken } = await request.json();

    if (!accessToken) {
      return NextResponse.json(
        { error: "Access token is required" },
        { status: 400 }
      );
    }

    // Verify access token and get gallery access
    const galleryAccess = await prisma.galleryAccess.findFirst({
      where: {
        accessToken: accessToken,
        gallery: {
          shareToken: token,
          isActive: true
        }
      },
      include: {
        gallery: {
          include: {
            photos: {
              where: { photoId }
            }
          }
        }
      }
    });

    if (!galleryAccess) {
      return NextResponse.json(
        { error: "Invalid access token or gallery not found" },
        { status: 403 }
      );
    }

    const gallery = galleryAccess.gallery;
    const galleryPhoto = gallery.photos.find(
      (gp: any) => gp.photoId === photoId
    );
    if (!galleryPhoto) {
      return NextResponse.json(
        { error: "Photo not found in gallery" },
        { status: 404 }
      );
    }

    // Delete the like
    await prisma.photoLike.delete({
      where: {
        galleryPhotoId_galleryAccessId: {
          galleryPhotoId: galleryPhoto.id,
          galleryAccessId: galleryAccess.id
        }
      }
    });

    // Get updated like count
    const likeCount = await prisma.photoLike.count({
      where: { galleryPhotoId: galleryPhoto.id }
    });

    return NextResponse.json({
      success: true,
      likeCount
    });
  } catch (error) {
    console.error("Unlike error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string; token: string }> }
) {
  try {
    const { photoId, token } = await params;

    // Verify gallery exists and is active
    const gallery = await prisma.gallery.findUnique({
      where: { shareToken: token },
      include: {
        photos: {
          where: { photoId },
          include: {
            likes: {
              select: {
                id: true,
                clientName: true,
                createdAt: true
              },
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    if (!gallery || !gallery.isActive) {
      return NextResponse.json(
        { error: "Gallery not found or inactive" },
        { status: 404 }
      );
    }

    const galleryPhoto = gallery.photos.find((gp) => gp.photoId === photoId);
    if (!galleryPhoto) {
      return NextResponse.json(
        { error: "Photo not found in gallery" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      likes: galleryPhoto.likes,
      likeCount: galleryPhoto.likes.length
    });
  } catch (error) {
    console.error("Get likes error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
