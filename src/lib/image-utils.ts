import sharp from "sharp";

export interface WatermarkOptions {
  text?: string;
  opacity?: number;
  fontSize?: number;
  position?:
    | "center"
    | "bottom-right"
    | "bottom-left"
    | "top-right"
    | "top-left";
}

export async function addWatermark(
  inputBuffer: Buffer,
  options: WatermarkOptions = {}
): Promise<Buffer> {
  const {
    text = process.env.WATERMARK_TEXT || "Preview Only",
    opacity = parseFloat(process.env.WATERMARK_OPACITY || "0.5"),
    fontSize = 48
  } = options;

  try {
    const image = sharp(inputBuffer);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Unable to get image dimensions");
    }

    // Create watermark SVG
    const watermarkSvg = `
      <svg width="${metadata.width}" height="${metadata.height}">
        <text 
          x="50%" 
          y="50%" 
          font-family="Arial, sans-serif" 
          font-size="${fontSize}" 
          fill="white" 
          fill-opacity="${opacity}" 
          text-anchor="middle" 
          dominant-baseline="middle"
          transform="rotate(-45 ${metadata.width / 2} ${metadata.height / 2})"
        >
          ${text}
        </text>
      </svg>
    `;

    const watermarkedBuffer = await image
      .composite([
        {
          input: Buffer.from(watermarkSvg),
          blend: "over"
        }
      ])
      .jpeg({ quality: 80 })
      .toBuffer();

    return watermarkedBuffer;
  } catch (error) {
    console.error("Watermark error:", error);
    throw error;
  }
}

// Legacy file-based function for backwards compatibility
export async function addWatermarkToFile(
  inputPath: string,
  outputPath: string,
  options: WatermarkOptions = {}
) {
  try {
    const inputBuffer = await sharp(inputPath).toBuffer();
    const watermarkedBuffer = await addWatermark(inputBuffer, options);
    await sharp(watermarkedBuffer).toFile(outputPath);
    return true;
  } catch (error) {
    console.error("Watermark error:", error);
    return false;
  }
}

export async function generateThumbnail(
  inputPath: string,
  outputPath: string,
  width: number = 300,
  height: number = 300
) {
  try {
    await sharp(inputPath)
      .resize(width, height, {
        fit: "cover",
        position: "center"
      })
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    return true;
  } catch (error) {
    console.error("Thumbnail error:", error);
    return false;
  }
}
