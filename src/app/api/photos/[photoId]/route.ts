import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSignedUrl } from "@/lib/gcs-utils";

interface RouteParams {
  params: Promise<{ photoId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { photoId } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "thumbnail"; // thumbnail, preview, or original

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the photo
    const photo = await prisma.photo.findFirst({
      where: {
        id: photoId,
        photographerId: session.user.id // Only allow access to own photos
      }
    });

    if (!photo) {
      return NextResponse.json({ error: "Photo not found" }, { status: 404 });
    }

    // Determine which file to serve
    let filename: string;
    switch (type) {
      case "original":
        filename = photo.filename;
        break;
      case "preview":
        filename =
          photo.previewPath?.replace(
            "https://storage.googleapis.com/photo_manager/",
            ""
          ) || photo.filename;
        break;
      case "thumbnail":
      default:
        filename =
          photo.thumbnailPath?.replace(
            "https://storage.googleapis.com/photo_manager/",
            ""
          ) || photo.filename;
        break;
    }

    // Generate signed URL (valid for 1 hour)
    const signedUrl = await generateSignedUrl(filename, 1);
    console.log(`Serving image: ${filename} via signed URL`);

    // Fetch the image from GCS and stream it
    const response = await fetch(signedUrl);

    if (!response.ok) {
      console.error(
        `Failed to fetch image from GCS: ${response.status} - ${response.statusText}`
      );
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();

    // Return the image with proper headers
    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": photo.mimeType || "image/jpeg",
        "Cache-Control": "public, max-age=3600" // Cache for 1 hour
      }
    });
  } catch (error) {
    console.error("Photo serve error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
