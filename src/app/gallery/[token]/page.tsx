import { notFound } from "next/navigation";
import ClientGalleryView from "./ClientGalleryView";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getGallery(token: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/gallery/${token}`;

    console.log("Fetching gallery from:", url);

    const response = await fetch(url, {
      cache: "no-store" // Always fetch fresh data for client galleries
    });

    console.log("Gallery fetch response status:", response.status);

    if (!response.ok) {
      console.log(
        "Gallery fetch failed:",
        response.status,
        response.statusText
      );
      return null;
    }

    const data = await response.json();
    console.log("Gallery data received:", data);
    return data;
  } catch (error) {
    console.error("Failed to fetch gallery:", error);
    return null;
  }
}

export default async function ClientGalleryPage({ params }: PageProps) {
  const { token } = await params;
  const data = await getGallery(token);

  if (!data || !data.gallery) {
    notFound();
  }

  return <ClientGalleryView gallery={data.gallery} token={token} />;
}

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const data = await getGallery(token);

  if (!data || !data.gallery) {
    return {
      title: "Gallery Not Found"
    };
  }

  return {
    title: `${data.gallery.title} - Photo Gallery`,
    description:
      data.gallery.description ||
      `Photo gallery for ${data.gallery.session.client.name}`
  };
}
