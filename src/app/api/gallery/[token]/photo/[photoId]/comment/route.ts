import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string; token: string }> }
) {
  try {
    const { photoId, token } = await params;
    const { comment, accessToken } = await request.json();

    if (!comment || !accessToken) {
      return NextResponse.json(
        { error: "Comment and access token are required" },
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

    const galleryPhoto = gallery.photos.find(
      (gp: any) => gp.photoId === photoId
    );
    if (!galleryPhoto) {
      return NextResponse.json(
        { error: "Photo not found in gallery" },
        { status: 404 }
      );
    }

    // Create the comment
    const newComment = await prisma.photoComment.create({
      data: {
        galleryPhotoId: galleryPhoto.id,
        comment,
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

    return NextResponse.json({
      success: true,
      comment: {
        id: newComment.id,
        comment: newComment.comment,
        name: newComment.galleryAccess.name,
        email: newComment.galleryAccess.email,
        createdAt: newComment.createdAt,
        updatedAt: newComment.updatedAt
      }
    });
  } catch (error) {
    console.error("Comment creation error:", error);
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
        }
      }
    });

    if (!gallery || !gallery.isActive) {
      return NextResponse.json(
        { error: "Gallery not found or inactive" },
        { status: 404 }
      );
    }

    const galleryPhoto = gallery.photos.find(
      (gp: any) => gp.photoId === photoId
    );
    if (!galleryPhoto) {
      return NextResponse.json(
        { error: "Photo not found in gallery" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      comments: galleryPhoto.comments
    });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string; token: string }> }
) {
  try {
    const { photoId, token } = await params;
    const { commentId, comment, clientName } = await request.json();

    if (!comment || !commentId || !clientName) {
      return NextResponse.json(
        { error: "Comment, comment ID, and client name are required" },
        { status: 400 }
      );
    }

    // Verify gallery exists and is active
    const gallery = await prisma.gallery.findUnique({
      where: { shareToken: token },
      include: {
        photos: {
          where: { photoId }
        }
      }
    });

    if (!gallery || !gallery.isActive) {
      return NextResponse.json(
        { error: "Gallery not found or inactive" },
        { status: 404 }
      );
    }

    const galleryPhoto = gallery.photos.find(
      (gp: any) => gp.photoId === photoId
    );
    if (!galleryPhoto) {
      return NextResponse.json(
        { error: "Photo not found in gallery" },
        { status: 404 }
      );
    }

    // Update the comment (only allow the original commenter to edit)
    const updatedComment = await prisma.photoComment.update({
      where: {
        id: commentId,
        galleryPhotoId: galleryPhoto.id,
        clientName: clientName
      },
      data: {
        comment,
        updatedAt: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      comment: {
        id: updatedComment.id,
        comment: updatedComment.comment,
        clientName: updatedComment.clientName,
        createdAt: updatedComment.createdAt,
        updatedAt: updatedComment.updatedAt
      }
    });
  } catch (error) {
    console.error("Comment update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
