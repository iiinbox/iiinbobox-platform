-- CreateTable
CREATE TABLE "SiteSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "logoUrl" TEXT,
    "logoWidth" INTEGER NOT NULL DEFAULT 120,
    "logoAlign" TEXT NOT NULL DEFAULT 'left',
    "logoLink" TEXT NOT NULL DEFAULT '/',
    "faviconUrl" TEXT,
    "faviconContentType" TEXT NOT NULL DEFAULT 'image/png',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteSettings_pkey" PRIMARY KEY ("id")
);
