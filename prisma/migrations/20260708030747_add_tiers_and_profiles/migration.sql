-- CreateEnum
CREATE TYPE "PlotTier" AS ENUM ('BASIC', 'CITY', 'PREMIUM', 'FOUNDER', 'HOMEPAGE');

-- AlterTable
ALTER TABLE "Plot" ADD COLUMN     "linkUrl" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "message" TEXT,
ADD COLUMN     "tier" "PlotTier" NOT NULL DEFAULT 'BASIC',
ALTER COLUMN "color" SET DEFAULT '#67e8f9';
