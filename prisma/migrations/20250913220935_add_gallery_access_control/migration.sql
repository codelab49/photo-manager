/*
  Warnings:

  - You are about to drop the column `clientEmail` on the `photo_comments` table. All the data in the column will be lost.
  - You are about to drop the column `clientName` on the `photo_comments` table. All the data in the column will be lost.
  - You are about to drop the column `clientEmail` on the `photo_likes` table. All the data in the column will be lost.
  - You are about to drop the column `clientName` on the `photo_likes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[galleryPhotoId,galleryAccessId]` on the table `photo_likes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `galleryAccessId` to the `photo_comments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `galleryAccessId` to the `photo_likes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."photo_likes_galleryPhotoId_clientName_key";

-- AlterTable
ALTER TABLE "public"."photo_comments" DROP COLUMN "clientEmail",
DROP COLUMN "clientName",
ADD COLUMN     "galleryAccessId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."photo_likes" DROP COLUMN "clientEmail",
DROP COLUMN "clientName",
ADD COLUMN     "galleryAccessId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "public"."gallery_access" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "galleryId" TEXT NOT NULL,

    CONSTRAINT "gallery_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "gallery_access_accessToken_key" ON "public"."gallery_access"("accessToken");

-- CreateIndex
CREATE UNIQUE INDEX "gallery_access_galleryId_email_key" ON "public"."gallery_access"("galleryId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "photo_likes_galleryPhotoId_galleryAccessId_key" ON "public"."photo_likes"("galleryPhotoId", "galleryAccessId");

-- AddForeignKey
ALTER TABLE "public"."gallery_access" ADD CONSTRAINT "gallery_access_galleryId_fkey" FOREIGN KEY ("galleryId") REFERENCES "public"."galleries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."photo_likes" ADD CONSTRAINT "photo_likes_galleryAccessId_fkey" FOREIGN KEY ("galleryAccessId") REFERENCES "public"."gallery_access"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."photo_comments" ADD CONSTRAINT "photo_comments_galleryAccessId_fkey" FOREIGN KEY ("galleryAccessId") REFERENCES "public"."gallery_access"("id") ON DELETE CASCADE ON UPDATE CASCADE;
