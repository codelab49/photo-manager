import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { addWatermark } from "@/lib/image-utils";
import { downloadFromGCS } from "@/lib/gcs-utils";

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
    const type = request.nextUrl.searchParams.get("type") || "preview";

    try {
      let imageBuffer: Buffer;

      if (type === "thumbnail" && photo.thumbnailPath) {
        // Use pre-generated thumbnail (no watermark needed for small thumbs)
        imageBuffer = await downloadFromGCS(photo.thumbnailPath);
      } else if (type === "preview" && photo.previewPath) {
        // Use pre-generated watermarked preview
        imageBuffer = await downloadFromGCS(photo.previewPath);
      } else {
        // Fallback: generate on-the-fly if pre-generated version doesn't exist
        const originalBuffer = await downloadFromGCS(photo.path);
        imageBuffer = await addWatermark(originalBuffer, {
          text:
            type === "thumbnail"
              ? gallery.title
              : "Preview Only - " + gallery.title,
          opacity: type === "thumbnail" ? 0.5 : 0.7,
          fontSize: type === "thumbnail" ? 24 : 36
        });
      }

      return new NextResponse(new Uint8Array(imageBuffer), {
        headers: {
          "Content-Type": photo.mimeType || "image/jpeg",
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Content-Disposition": 'inline; filename=""',
          "X-Content-Type-Options": "nosniff",
          "X-Frame-Options": "DENY",
          Pragma: "no-cache",
          Expires: "0"
        }
      });
    } catch (error) {
      console.error("Image serving error:", error);
      return NextResponse.json(
        { error: "Failed to serve image" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Gallery API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
