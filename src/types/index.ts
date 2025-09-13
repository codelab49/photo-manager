export interface Photo {
  id: string;
  filename: string;
  originalName: string;
  path: string;
  previewPath: string | null;
  thumbnailPath: string | null;
  size: number;
  width: number | null;
  height: number | null;
  uploadedAt: Date;
}

export interface PhotoUploadResult {
  id: string;
  filename: string;
  originalName: string;
  thumbnailPath: string | null;
  size: number;
  width: number | null;
  height: number | null;
}

export interface Recipient {
  id: string;
  name: string;
  email: string;
  relation?: string | null;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  recipients?: Recipient[];
}

export interface PhotoSession {
  id: string;
  title: string;
  description?: string | null;
  sessionDate: Date;
  location?: string | null;
  client: Client;
  photos: Photo[];
  _count: {
    photos: number;
  };
}

export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface GalleryAccess {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  galleryId: string;
}

export interface PhotoLike {
  id: string;
  galleryAccess: {
    name: string;
    email: string;
  };
  createdAt: Date;
}

export interface PhotoComment {
  id: string;
  comment: string;
  galleryAccess: {
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
