import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addWatermark } from "@/lib/image-utils";
import { readFile } from "fs/promises";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string; token: string }> }
) {
  try {
    const { photoId, token } = await params;

    // Find the gallery with the token
    const gallery = await prisma.gallery.findUnique({
      where: { shareToken: token },
      include: {
        photos: {
          where: { photoId },
          include: { photo: true }
        }
      }
    });

    if (!gallery || !gallery.isActive) {
      return NextResponse.json(
        { error: "Gallery not found or inactive" },
        { status: 404 }
      );
    }

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

    const photo = galleryPhoto.photo;
    const originalPath = photo.path;

    // Generate watermarked version path
    const watermarkedPath = originalPath.replace(
      /\.(jpg|jpeg|png)$/i,
      "_watermarked.$1"
    );

    try {
      // Try to read existing watermarked version
      const watermarkedImage = await readFile(watermarkedPath);

      return new NextResponse(new Uint8Array(watermarkedImage), {
        headers: {
          "Content-Type": photo.mimeType,
          "Cache-Control": "public, max-age=3600",
          "Content-Disposition": "inline"
        }
      });
    } catch {
      // Generate watermarked version if it doesn't exist
      const watermarkSuccess = await addWatermark(
        originalPath,
        watermarkedPath,
        {
          text: "Preview Only - " + gallery.title,
          opacity: 0.7,
          fontSize: 36
        }
      );

      if (!watermarkSuccess) {
        return NextResponse.json(
          { error: "Failed to generate watermarked image" },
          { status: 500 }
        );
      }

      const watermarkedImage = await readFile(watermarkedPath);

      return new NextResponse(new Uint8Array(watermarkedImage), {
        headers: {
          "Content-Type": photo.mimeType,
          "Cache-Control": "public, max-age=3600",
          "Content-Disposition": "inline"
        }
      });
    }
  } catch (error) {
    console.error("Image serving error:", error);
    return NextResponse.json(
      { error: "Failed to serve image" },
      { status: 500 }
    );
  }
}
