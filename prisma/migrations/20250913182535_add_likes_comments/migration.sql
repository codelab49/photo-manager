-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('PHOTOGRAPHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "public"."SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'PHOTOGRAPHER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."clients" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photographerId" TEXT NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."photo_sessions" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sessionDate" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "status" "public"."SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "photographerId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "photo_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."photos" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "previewPath" TEXT,
    "thumbnailPath" TEXT,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "photographerId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,

    CONSTRAINT "photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."galleries" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "shareToken" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "watermark" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "sessionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,

    CONSTRAINT "galleries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."gallery_photos" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "galleryId" TEXT NOT NULL,
    "photoId" TEXT NOT NULL,

    CONSTRAINT "gallery_photos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."photo_likes" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "galleryPhotoId" TEXT NOT NULL,

    CONSTRAINT "photo_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."photo_comments" (
    "id" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "galleryPhotoId" TEXT NOT NULL,

    CONSTRAINT "photo_comments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "galleries_shareToken_key" ON "public"."galleries"("shareToken");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_photos_galleryId_photoId_key" ON "public"."gallery_photos"("galleryId", "photoId");

-- CreateIndex
CREATE UNIQUE INDEX "photo_likes_galleryPhotoId_clientName_key" ON "public"."photo_likes"("galleryPhotoId", "clientName");

-- AddForeignKey
ALTER TABLE "public"."clients" ADD CONSTRAINT "clients_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."photo_sessions" ADD CONSTRAINT "photo_sessions_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."photo_sessions" ADD CONSTRAINT "photo_sessions_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."photos" ADD CONSTRAINT "photos_photographerId_fkey" FOREIGN KEY ("photographerId") REFERENCES "public"."users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."photos" ADD CONSTRAINT "photos_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."photo_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."galleries" ADD CONSTRAINT "galleries_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."photo_sessions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."galleries" ADD CONSTRAINT "galleries_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "public"."clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gallery_photos" ADD CONSTRAINT "gallery_photos_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "public"."galleries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."gallery_photos" ADD CONSTRAINT "gallery_photos_photoId_fkey" FOREIGN KEY ("photoId") REFERENCES "public"."photos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."photo_likes" ADD CONSTRAINT "photo_likes_galleryPhotoId_fkey" FOREIGN KEY ("galleryPhotoId") REFERENCES "public"."gallery_photos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."photo_comments" ADD CONSTRAINT "photo_comments_galleryPhotoId_fkey" FOREIGN KEY ("galleryPhotoId") REFERENCES "public"."gallery_photos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
