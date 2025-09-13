import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadToGCS } from "@/lib/gcs-utils";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const sessionId = formData.get("sessionId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID required" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPEG, PNG, and WebP are allowed."
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "File too large. Maximum size is 10MB."
        },
        { status: 400 }
      );
    }

    // Verify session belongs to photographer
    const photoSession = await prisma.photoSession.findFirst({
      where: {
        id: sessionId,
        photographerId: session.user.id
      }
    });

    if (!photoSession) {
      return NextResponse.json({ error: "Invalid session" }, { status: 403 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Get image metadata using Sharp
    const metadata = await sharp(buffer).metadata();

    // Upload original to Google Cloud Storage
    const uploadResult = await uploadToGCS(
      buffer,
      file.name,
      file.type,
      `photos/${sessionId}`
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        {
          error: "Failed to upload to cloud storage"
        },
        { status: 500 }
      );
    }

    // Create thumbnail
    const thumbnailBuffer = await sharp(buffer)
      .resize(300, 300, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();

    // Upload thumbnail
    const thumbnailResult = await uploadToGCS(
      thumbnailBuffer,
      `thumb_${file.name}`,
      "image/jpeg",
      `thumbnails/${sessionId}`
    );

    // Save photo record to database
    const photo = await prisma.photo.create({
      data: {
        filename: uploadResult.filename!,
        originalName: file.name,
        path: uploadResult.publicUrl!,
        thumbnailPath: thumbnailResult.success
          ? thumbnailResult.publicUrl
          : null,
        mimeType: file.type,
        size: file.size,
        width: metadata.width,
        height: metadata.height,
        metadata: JSON.parse(JSON.stringify(metadata)),
        photographerId: session.user.id,
        sessionId
      }
    });

    return NextResponse.json({
      success: true,
      photo: {
        id: photo.id,
        filename: photo.filename,
        originalName: photo.originalName,
        thumbnailPath: photo.thumbnailPath,
        size: photo.size,
        width: photo.width,
        height: photo.height
      }
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Internal server error"
      },
      { status: 500 }
    );
  }
}
