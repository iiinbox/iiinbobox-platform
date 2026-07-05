-- DropIndex
DROP INDEX "Product_title_trgm_idx";

-- CreateTable
CREATE TABLE "PageConfig" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{"components":[]}',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PageConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PageConfig_page_key" ON "PageConfig"("page");
