import { notFound } from "next/navigation";
import ClientGalleryView from "./ClientGalleryView";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ access?: string }>;
}

async function getGallery(token: string, accessToken?: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const url = new URL(`${baseUrl}/api/gallery/${token}`);
    if (accessToken) {
      url.searchParams.set("access", accessToken);
    }

    console.log("Fetching gallery from:", url.toString());

    const response = await fetch(url.toString(), {
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

export default async function ClientGalleryPage({
  params,
  searchParams
}: PageProps) {
  const { token } = await params;
  const { access: accessToken } = await searchParams;
  const data = await getGallery(token, accessToken);

  if (!data || !data.gallery) {
    notFound();
  }

  return (
    <ClientGalleryView
      gallery={data.gallery}
      token={token}
      currentUser={data.currentUser || null}
    />
  );
}

export async function generateMetadata({ params, searchParams }: PageProps) {
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
