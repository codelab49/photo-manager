"use client";

import { useState, useEffect } from "react";

interface SecureImageProps {
  photoId: string;
  type?: "thumbnail" | "preview" | "original";
  alt: string;
  className?: string;
}

export default function SecureImage({
  photoId,
  type = "thumbnail",
  alt,
  className = ""
}: SecureImageProps) {
  const [imageSrc, setImageSrc] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchImage = async () => {
      try {
        setIsLoading(true);
        setError("");

        const response = await fetch(`/api/photos/${photoId}?type=${type}`);

        if (!response.ok) {
          throw new Error(`Failed to load image: ${response.status}`);
        }

        // Convert the response to a blob and create an object URL
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setImageSrc(objectUrl);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load image");
      } finally {
        setIsLoading(false);
      }
    };

    fetchImage();
  }, [photoId, type]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (imageSrc && imageSrc.startsWith("blob:")) {
        URL.revokeObjectURL(imageSrc);
      }
    };
  }, [imageSrc]);

  if (isLoading) {
    return (
      <div
        className={`bg-blue-200 animate-pulse flex items-center justify-center ${className}`}
      >
        <div className="text-blue-600 text-xs">Loading {photoId}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`bg-red-100 flex items-center justify-center ${className}`}
      >
        <div className="text-red-500 text-xs">{error}</div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={imageSrc} alt={alt} className={className} />
  );
}
