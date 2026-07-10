-- AlterTable
ALTER TABLE "PageConfig" ADD COLUMN     "folderId" TEXT,
ADD COLUMN     "publishedConfig" JSONB;

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Folder" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "rootPageId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Folder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Folder_rootPageId_key" ON "Folder"("rootPageId");

-- CreateIndex
CREATE UNIQUE INDEX "Folder_projectId_kind_key" ON "Folder"("projectId", "kind");

-- AddForeignKey
ALTER TABLE "PageConfig" ADD CONSTRAINT "PageConfig_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Folder" ADD CONSTRAINT "Folder_rootPageId_fkey" FOREIGN KEY ("rootPageId") REFERENCES "PageConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill (runs in the same transaction as everything above): grandfather
-- every existing page as already-published, and scaffold the default
-- Project + its 3 Folders (Home/Seller/Rider), so nothing currently live
-- goes dark the moment draft/publish separation ships. This lives in the
-- migration itself (not a standalone script) because nothing in the deploy
-- pipeline invokes a separate seed step after `prisma migrate deploy` — a
-- script here would silently never run, and every live page would 404.
DO $$
DECLARE
  v_project_id       TEXT := gen_random_uuid()::text;
  v_home_folder_id   TEXT := gen_random_uuid()::text;
  v_seller_folder_id TEXT := gen_random_uuid()::text;
  v_rider_folder_id  TEXT := gen_random_uuid()::text;
  v_home_page_id     TEXT;
  v_seller_page_id   TEXT;
  v_rider_page_id    TEXT;
BEGIN
  -- Copying `config` byte-for-byte into `publishedConfig` changes nothing
  -- about what actually renders today — the live routes already gracefully
  -- handle every legacy config shape present in this table.
  UPDATE "PageConfig" SET "publishedConfig" = "config";

  SELECT "id" INTO v_home_page_id   FROM "PageConfig" WHERE "page" = 'home';
  SELECT "id" INTO v_seller_page_id FROM "PageConfig" WHERE "page" = 'seller-dashboard';
  SELECT "id" INTO v_rider_page_id  FROM "PageConfig" WHERE "page" = 'rider-dashboard';

  INSERT INTO "Project" ("id", "name", "order", "createdAt")
  VALUES (v_project_id, 'My Site', 0, CURRENT_TIMESTAMP);

  -- rootPageId is nullable, so this stays valid even against a fresh/empty
  -- database with no home/seller-dashboard/rider-dashboard rows yet.
  INSERT INTO "Folder" ("id", "name", "kind", "projectId", "rootPageId", "createdAt")
  VALUES
    (v_home_folder_id,   'Home Page',        'home',   v_project_id, v_home_page_id,   CURRENT_TIMESTAMP),
    (v_seller_folder_id, 'Seller Dashboard', 'seller', v_project_id, v_seller_page_id, CURRENT_TIMESTAMP),
    (v_rider_folder_id,  'Rider Dashboard',  'rider',  v_project_id, v_rider_page_id,  CURRENT_TIMESTAMP);

  -- Everything defaults into the Home folder (nothing in routing today
  -- associates any custom page with seller/rider over home — middleware.ts
  -- only rewrites the root path on those subdomains, any other path there
  -- already falls through to the same slug-based route as iiinbox.com),
  -- then the seller/rider root pages get overridden into their own folder.
  -- Folder assignment has zero effect on what's live; it only determines
  -- which folder's future Publish click re-publishes a page next.
  UPDATE "PageConfig" SET "folderId" = v_home_folder_id;

  IF v_seller_page_id IS NOT NULL THEN
    UPDATE "PageConfig" SET "folderId" = v_seller_folder_id WHERE "id" = v_seller_page_id;
  END IF;
  IF v_rider_page_id IS NOT NULL THEN
    UPDATE "PageConfig" SET "folderId" = v_rider_folder_id WHERE "id" = v_rider_page_id;
  END IF;
END $$;
