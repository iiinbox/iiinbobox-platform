-- Folders are no longer fixed at 3-per-project (home/seller/rider "kind").
-- `subdomain` replaces `kind` as the live-routing-relevant field: only a
-- folder with a non-null, unique subdomain is resolvable by middleware.ts.
-- The 2 existing kind='seller'/'rider' folders (the only ones that were ever
-- actually wired to real subdomains) keep that meaning via their new
-- subdomain value; the home folder and any future arbitrary folder get
-- subdomain = NULL (home's live route is handled separately by
-- (home)/page.tsx, which always renders whatever's published at slug "home"
-- regardless of Folder data).

ALTER TABLE "Folder" ADD COLUMN "subdomain" TEXT;

UPDATE "Folder" SET "subdomain" = 'seller' WHERE "kind" = 'seller';
UPDATE "Folder" SET "subdomain" = 'rider' WHERE "kind" = 'rider';

DROP INDEX "Folder_projectId_kind_key";

CREATE UNIQUE INDEX "Folder_subdomain_key" ON "Folder"("subdomain");

ALTER TABLE "Folder" DROP COLUMN "kind";
