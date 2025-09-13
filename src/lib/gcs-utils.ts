import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Initialize Google Cloud Storage
const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_SERVICE_ACCOUNT_KEY_PATH
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME || "photo_manager");

export interface UploadResult {
  success: boolean;
  filename?: string;
  publicUrl?: string;
  error?: string;
}

/**
 * Upload file to Google Cloud Storage
 */
export async function uploadToGCS(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
  folder: string = "photos"
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExtension = path.extname(originalName);
    const uniqueFilename = `${folder}/${uuidv4()}${fileExtension}`;

    const file = bucket.file(uniqueFilename);

    // Upload buffer to GCS
    await file.save(buffer, {
      metadata: {
        contentType: mimeType,
        metadata: {
          originalName: originalName,
          uploadedAt: new Date().toISOString()
        }
      }
    });

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${uniqueFilename}`;

    return {
      success: true,
      filename: uniqueFilename,
      publicUrl: publicUrl
    };
  } catch (error) {
    console.error("GCS Upload Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed"
    };
  }
}

/**
 * Generate signed URL for secure access
 */
export async function generateSignedUrl(
  filename: string,
  expiresInHours: number = 24
): Promise<string> {
  try {
    const file = bucket.file(filename);

    const [signedUrl] = await file.getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + expiresInHours * 60 * 60 * 1000 // Hours to milliseconds
    });

    return signedUrl;
  } catch (error) {
    console.error("Signed URL Error:", error);
    throw new Error("Failed to generate signed URL");
  }
}

/**
 * Delete file from Google Cloud Storage
 */
export async function deleteFromGCS(filename: string): Promise<boolean> {
  try {
    const file = bucket.file(filename);
    await file.delete();
    return true;
  } catch (error) {
    console.error("GCS Delete Error:", error);
    return false;
  }
}

/**
 * Check if file exists in Google Cloud Storage
 */
export async function fileExistsInGCS(filename: string): Promise<boolean> {
  try {
    const file = bucket.file(filename);
    const [exists] = await file.exists();
    return exists;
  } catch (error) {
    console.error("GCS File Check Error:", error);
    return false;
  }
}

/**
 * Download file from Google Cloud Storage
 */
export async function downloadFromGCS(filePath: string): Promise<Buffer> {
  try {
    // Extract filename from GCS URL
    let filename = filePath;
    if (filePath.startsWith("https://storage.googleapis.com/")) {
      const urlParts = filePath.split("/");
      // Remove the protocol, domain, and bucket name to get the file path
      filename = urlParts.slice(4).join("/");
    }

    const file = bucket.file(filename);
    const [exists] = await file.exists();

    if (!exists) {
      throw new Error(`File not found: ${filename}`);
    }

    const [buffer] = await file.download();
    return buffer;
  } catch (error) {
    console.error("GCS Download Error:", error);
    throw error;
  }
}
