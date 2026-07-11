-- CreateTable
CREATE TABLE "TableCellValue" (
    "ref" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TableCellValue_pkey" PRIMARY KEY ("ref")
);
