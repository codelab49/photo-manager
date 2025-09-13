import { notFound } from "next/navigation";
import ClientGalleryView from "./ClientGalleryView";

interface PageProps {
  params: Promise<{ token: string }>;
}

async function getGallery(token: string) {
  try {
    const response = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/gallery/${token}`,
      {
        cache: "no-store" // Always fetch fresh data for client galleries
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();
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
