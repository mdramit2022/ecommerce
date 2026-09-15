-- CreateEnum
CREATE TYPE "BannerPlacement" AS ENUM ('HERO', 'PROMO_TILE', 'SIDEBAR');

-- CreateEnum
CREATE TYPE "SiteContentKind" AS ENUM ('ANNOUNCEMENT', 'TRUST_BADGE', 'SOCIAL_LINK', 'FOOTER_LINK');

-- CreateTable
CREATE TABLE "Banner" (
    "id" TEXT NOT NULL,
    "placement" "BannerPlacement" NOT NULL,
    "eyebrow" TEXT,
    "title" TEXT NOT NULL,
    "titleAccent" TEXT,
    "highlight" TEXT,
    "description" TEXT,
    "image" TEXT NOT NULL,
    "ctaLabel" TEXT,
    "ctaHref" TEXT,
    "secondaryLabel" TEXT,
    "secondaryHref" TEXT,
    "theme" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Banner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" TEXT NOT NULL,
    "quote" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "location" TEXT,
    "rating" INTEGER NOT NULL,
    "avatar" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteContentItem" (
    "id" TEXT NOT NULL,
    "kind" "SiteContentKind" NOT NULL,
    "group" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "href" TEXT,
    "icon" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteContentItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSetting_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE INDEX "Banner_placement_isActive_sortOrder_idx" ON "Banner"("placement", "isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "Testimonial_isActive_sortOrder_idx" ON "Testimonial"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "SiteContentItem_kind_isActive_sortOrder_idx" ON "SiteContentItem"("kind", "isActive", "sortOrder");
