-- Migration to add gallery access control

-- Create GalleryAccess table
CREATE TABLE "gallery_access" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "galleryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gallery_access_pkey" PRIMARY KEY ("id")
);

-- Create indexes
CREATE UNIQUE INDEX "gallery_access_accessToken_key" ON "gallery_access"("accessToken");
CREATE UNIQUE INDEX "gallery_access_galleryId_email_key" ON "gallery_access"("galleryId", "email");

-- Add foreign key constraint
ALTER TABLE "gallery_access" ADD CONSTRAINT "gallery_access_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Modify PhotoLike to reference GalleryAccess instead of clientName/clientEmail
ALTER TABLE "photo_likes" DROP COLUMN "clientName";
ALTER TABLE "photo_likes" DROP COLUMN "clientEmail";
ALTER TABLE "photo_likes" ADD COLUMN "galleryAccessId" TEXT NOT NULL;
ALTER TABLE "photo_likes" ADD CONSTRAINT "photo_likes_galleryAccessId_fkey" FOREIGN KEY ("galleryAccessId") REFERENCES "gallery_access"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Modify PhotoComment to reference GalleryAccess instead of clientName/clientEmail  
ALTER TABLE "photo_comments" DROP COLUMN "clientName";
ALTER TABLE "photo_comments" DROP COLUMN "clientEmail";
ALTER TABLE "photo_comments" ADD COLUMN "galleryAccessId" TEXT NOT NULL;
ALTER TABLE "photo_comments" ADD CONSTRAINT "photo_comments_galleryAccessId_fkey" FOREIGN KEY ("galleryAccessId") REFERENCES "gallery_access"("id") ON DELETE CASCADE ON UPDATE CASCADE;
